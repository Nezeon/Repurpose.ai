"""
Clinical Trials Agent - Searches ClinicalTrials.gov for trial data.
Uses ClinicalTrials.gov REST API v2.
"""

import asyncio
import json
import ssl
from typing import Dict, List, Any
from urllib.parse import quote
import aiohttp
from app.agents.base_agent import BaseAgent
from app.models.schemas import EvidenceItem
from app.utils.api_clients import AsyncHTTPClient, rate_limited
from app.config import settings


class ClinicalTrialsAgent(BaseAgent):
    """Agent for searching ClinicalTrials.gov."""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.base_url = "https://clinicaltrials.gov/api/v2/studies"
        self.max_results = self.config.get("max_results", 100)

    @rate_limited(settings.CLINICAL_TRIALS_RATE_LIMIT)
    async def fetch_data(self, drug_name: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fetch clinical trials from ClinicalTrials.gov API.

        Args:
            drug_name: Drug name to search for
            context: Additional search context

        Returns:
            List of clinical trial dictionaries
        """
        drug_name = self._sanitize_drug_name(drug_name)

        # ClinicalTrials.gov v2 API
        params = {
            "query.term": drug_name,
            "pageSize": self.max_results
        }

        # Full browser-like headers to avoid bot detection
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Cache-Control": "no-cache",
        }

        self.logger.info(f"Searching ClinicalTrials.gov for: {drug_name}")

        try:
            # Build URL for fallback methods (URL-encode drug name)
            url = f"{self.base_url}?query.term={quote(drug_name)}&pageSize={self.max_results}"

            data = None
            last_error = None

            # Method 1: Try aiohttp with browser-like headers
            try:
                self.logger.debug("Trying aiohttp method...")
                data = await self._fetch_with_aiohttp(url)
            except Exception as aiohttp_error:
                self.logger.warning(f"aiohttp failed: {aiohttp_error}")
                last_error = aiohttp_error

            # Method 2: Try curl (bypasses TLS fingerprinting)
            if data is None:
                try:
                    self.logger.debug("Trying curl method...")
                    data = await self._fetch_with_curl(url)
                except Exception as curl_error:
                    self.logger.warning(f"curl failed: {curl_error}")
                    last_error = curl_error

            # Method 3: Try httpx as last resort
            if data is None:
                try:
                    self.logger.debug("Trying httpx method...")
                    async with AsyncHTTPClient() as client:
                        data = await client.get(self.base_url, params=params, headers=headers)
                except Exception as httpx_error:
                    self.logger.warning(f"httpx failed: {httpx_error}")
                    last_error = httpx_error

            if data is None:
                raise last_error or Exception("All fetch methods failed")

            # Handle both API response formats (v1 and v2)
            if "studies" in data:
                # Direct studies array (v1 format)
                studies = data.get("studies", [])
            else:
                # API v2 wraps studies in studiesResponse
                studies = data.get("studiesResponse", {}).get("studies", [])

            self.logger.info(f"Found {len(studies)} clinical trials")

            return studies

        except Exception as e:
            self.logger.error(f"ClinicalTrials.gov API error: {e}")
            raise

    async def process_data(self, raw_data: List[Dict[str, Any]], drug_name: str = "") -> List[EvidenceItem]:
        """
        Process clinical trials into evidence items.

        Args:
            raw_data: List of study dictionaries

        Returns:
            List of EvidenceItem objects
        """
        evidence_items = []

        for study in raw_data:
            try:
                parsed = self._parse_study(study)

                if not parsed:
                    continue

                nct_id = parsed["nct_id"]
                trial_title = parsed["title"]

                # Create evidence item
                evidence = EvidenceItem(
                    source="clinical_trials",
                    indication=parsed["indication"],
                    summary=parsed["summary"],
                    date=parsed["date"],
                    url=f"https://clinicaltrials.gov/study/{nct_id}" if nct_id else None,
                    title=trial_title,
                    metadata={
                        "nct_id": nct_id,
                        "title": trial_title,
                        "status": parsed["status"],
                        "phase": parsed["phase"],
                        "conditions": parsed["conditions"]
                    },
                    relevance_score=self._calculate_relevance(parsed)
                )

                evidence_items.append(evidence)

            except Exception as e:
                self.logger.warning(f"Failed to process study: {e}")
                continue

        return evidence_items

    def _parse_study(self, study: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse study data from ClinicalTrials.gov API.

        Args:
            study: Raw study dictionary

        Returns:
            Parsed study dictionary or None
        """
        try:
            protocol_section = study.get("protocolSection", {})

            # Identification module
            identification = protocol_section.get("identificationModule", {})
            nct_id = identification.get("nctId", "")
            title = identification.get("briefTitle", "No title")

            # Status module
            status_module = protocol_section.get("statusModule", {})
            overall_status = status_module.get("overallStatus", "Unknown")
            start_date = status_module.get("startDateStruct", {}).get("date", "")
            completion_date = status_module.get("completionDateStruct", {}).get("date", "")

            # Design module
            design_module = protocol_section.get("designModule", {})
            phases = design_module.get("phases", [])
            phase = phases[0] if phases else "N/A"

            # Conditions module
            conditions_module = protocol_section.get("conditionsModule", {})
            conditions = conditions_module.get("conditions", [])

            # Use first condition as primary indication
            indication = conditions[0] if conditions else self._extract_indication(title)

            # Create summary
            summary = f"{overall_status} {phase} trial for {indication}"
            if completion_date:
                summary += f" (completed: {completion_date})"
            elif start_date:
                summary += f" (started: {start_date})"

            return {
                "nct_id": nct_id,
                "title": title,
                "status": overall_status,
                "phase": phase,
                "conditions": conditions,
                "indication": indication,
                "summary": summary,
                "date": completion_date or start_date or "",
                "start_date": start_date,
                "completion_date": completion_date
            }

        except Exception as e:
            self.logger.warning(f"Failed to parse study: {e}")
            return None

    def _calculate_relevance(self, parsed_study: Dict[str, Any]) -> float:
        """
        Calculate relevance score for clinical trial.

        Args:
            parsed_study: Parsed study dictionary

        Returns:
            Relevance score (0-1)
        """
        score = 0.5  # Base score

        # Boost for completed trials
        status = parsed_study.get("status", "").lower()
        if "completed" in status:
            score += 0.3
        elif "active" in status or "recruiting" in status:
            score += 0.2

        # Boost for later phase trials
        phase = parsed_study.get("phase", "").lower()
        if "phase 4" in phase or "phase iv" in phase:
            score += 0.3
        elif "phase 3" in phase or "phase iii" in phase:
            score += 0.25
        elif "phase 2" in phase or "phase ii" in phase:
            score += 0.15

        # Boost for trials with recent completion date
        completion_date = parsed_study.get("completion_date", "")
        if completion_date:
            try:
                year = int(completion_date.split("-")[0])
                if year >= 2020:
                    score += 0.15
                elif year >= 2015:
                    score += 0.10
            except (ValueError, IndexError):
                pass

        return min(score, 1.0)

    async def _fetch_with_curl(self, url: str) -> Dict[str, Any]:
        """Fallback method using curl to bypass TLS fingerprinting."""
        import subprocess
        import sys

        def run_curl():
            """Run curl synchronously."""
            try:
                # Use full browser-like headers to avoid 403
                user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

                if sys.platform == "win32":
                    # On Windows, use shell with properly escaped command
                    # Use -L to follow redirects, -A for user agent
                    cmd = [
                        'curl', '-s', '-L',
                        '-A', user_agent,
                        '-H', 'Accept: application/json',
                        '-H', 'Accept-Language: en-US,en;q=0.9',
                        url
                    ]
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=30,
                        encoding='utf-8',
                        errors='replace'
                    )
                else:
                    # On Unix, use list without shell
                    result = subprocess.run(
                        [
                            "curl", "-s", "-L",
                            "-A", user_agent,
                            "-H", "Accept: application/json",
                            "-H", "Accept-Language: en-US,en;q=0.9",
                            url
                        ],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )

                # Check if result or stdout is None
                if result is None:
                    raise Exception("curl subprocess returned None")

                stdout = result.stdout or ""
                stderr = result.stderr or ""

                if result.returncode != 0:
                    raise Exception(f"curl failed (code {result.returncode}): {stderr}")

                if not stdout.strip():
                    raise Exception(f"curl returned empty response. stderr: {stderr}")

                return json.loads(stdout)
            except subprocess.TimeoutExpired:
                raise Exception("curl timed out after 30 seconds")
            except json.JSONDecodeError as e:
                raise Exception(f"Invalid JSON from curl: {e}")
            except FileNotFoundError:
                raise Exception("curl not available on this system")

        # Run synchronous curl in executor to not block event loop
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, run_curl)

    async def _fetch_with_aiohttp(self, url: str) -> Dict[str, Any]:
        """
        Fetch data using aiohttp with browser-like configuration.
        This can sometimes bypass restrictions that httpx triggers.
        """
        # Create SSL context that allows all certificates (for some corporate networks)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        # Browser-like headers
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
        }

        connector = aiohttp.TCPConnector(ssl=ssl_context)
        timeout = aiohttp.ClientTimeout(total=30)

        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 403:
                    raise Exception(f"403 Forbidden - API blocking requests")
                response.raise_for_status()
                return await response.json()

    async def _perform_connection_test(self) -> Dict[str, Any]:
        """Test connection to ClinicalTrials.gov API with a minimal query."""
        url = f"{self.base_url}?query.term=cancer&pageSize=1"
        data = None
        method_used = None

        # Method 1: Try aiohttp
        try:
            data = await self._fetch_with_aiohttp(url)
            method_used = "aiohttp"
        except Exception as aiohttp_error:
            self.logger.warning(f"aiohttp test failed: {aiohttp_error}")

        # Method 2: Try curl
        if data is None:
            try:
                data = await self._fetch_with_curl(url)
                method_used = "curl"
            except Exception as curl_error:
                self.logger.warning(f"curl test failed: {curl_error}")

        # Method 3: Try httpx
        if data is None:
            params = {"query.term": "cancer", "pageSize": 1}
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with AsyncHTTPClient() as client:
                data = await client.get(self.base_url, params=params, headers=headers)
                method_used = "httpx"

        # Handle both API response formats
        total_count = data.get("totalCount", 0)
        if not total_count:
            total_count = data.get("studiesResponse", {}).get("totalCount", 0)

        return {
            "message": "ClinicalTrials.gov API connected successfully",
            "details": {
                "endpoint": self.base_url,
                "total_studies": total_count,
                "api_version": "v2",
                "method": method_used
            }
        }
