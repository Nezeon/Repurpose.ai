"""
Clinical Trials Agent - Searches ClinicalTrials.gov for trial data.
Uses ClinicalTrials.gov REST API v2.
"""

from typing import Dict, List, Any
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

        params = {
            "query.term": drug_name,
            "pageSize": self.max_results,
            "format": "json"
        }

        self.logger.info(f"Searching ClinicalTrials.gov for: {drug_name}")

        try:
            async with AsyncHTTPClient() as client:
                data = await client.get(self.base_url, params=params)

            studies = data.get("studies", [])
            self.logger.info(f"Found {len(studies)} clinical trials")

            return studies

        except Exception as e:
            self.logger.error(f"ClinicalTrials.gov API error: {e}")
            raise

    async def process_data(self, raw_data: List[Dict[str, Any]]) -> List[EvidenceItem]:
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
