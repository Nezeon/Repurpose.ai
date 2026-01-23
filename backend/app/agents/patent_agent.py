"""
Patent Agent - Searches Lens.org for patent information related to drug repurposing.
Uses Lens.org Scholarly API.
"""

from typing import Dict, List, Any, Optional
from app.agents.base_agent import BaseAgent
from app.models.schemas import EvidenceItem
from app.utils.api_clients import AsyncHTTPClient, rate_limited
from app.config import settings


class PatentAgent(BaseAgent):
    """Agent for searching Lens.org for patent data."""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.base_url = "https://api.lens.org/patent/search"
        self.api_key = settings.LENS_API_KEY
        self.max_results = self.config.get("max_results", 50)

    @rate_limited(settings.LENS_RATE_LIMIT)
    async def fetch_data(self, drug_name: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fetch patent data from Lens.org API.

        Args:
            drug_name: Drug name to search for
            context: Additional search context

        Returns:
            List of patent dictionaries
        """
        # Check if API key is configured
        if not self.api_key or self.api_key == "your_lens_api_key_here":
            self.logger.warning("Lens.org API key not configured, skipping patent search")
            return []

        drug_name = self._sanitize_drug_name(drug_name)

        # Construct search query
        query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                                "title": drug_name
                            }
                        }
                    ],
                    "should": [
                        {
                            "match": {
                                "abstract": "repurposing"
                            }
                        },
                        {
                            "match": {
                                "abstract": "new indication"
                            }
                        },
                        {
                            "match": {
                                "abstract": "therapeutic use"
                            }
                        }
                    ]
                }
            },
            "size": self.max_results,
            "sort": [{"filing_date": "desc"}]
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        self.logger.info(f"Searching Lens.org for patents mentioning: {drug_name}")

        try:
            async with AsyncHTTPClient() as client:
                data = await client.post(
                    self.base_url,
                    json=query,
                    headers=headers
                )

            patents = data.get("data", [])
            self.logger.info(f"Found {len(patents)} patents")

            return patents

        except Exception as e:
            self.logger.error(f"Lens.org API error: {e}")
            # Don't raise - patent data is optional
            return []

    async def process_data(self, raw_data: List[Dict[str, Any]]) -> List[EvidenceItem]:
        """
        Process patent data into evidence items.

        Args:
            raw_data: List of patent dictionaries

        Returns:
            List of EvidenceItem objects
        """
        evidence_items = []

        for patent in raw_data:
            try:
                # Extract patent information
                lens_id = patent.get("lens_id", "")
                title = patent.get("title", "No title")
                abstract = patent.get("abstract", "")
                filing_date = patent.get("filing_date", "")
                publication_date = patent.get("publication_date", "")

                # Extract applicants (companies/institutions)
                applicants = patent.get("applicants", [])
                applicant_names = [a.get("name", "") for a in applicants[:3]]

                # Extract claims (first 3)
                claims = patent.get("claims", [])
                claim_texts = [c.get("claim_text", "") for c in claims[:3]]

                # Infer indication from title and abstract
                combined_text = f"{title}. {abstract}"
                indication = self._extract_indication(combined_text)

                # Create summary
                summary = self._create_summary(title, abstract, applicant_names)

                # Create evidence item
                evidence = EvidenceItem(
                    source="patent",
                    indication=indication,
                    summary=summary,
                    date=publication_date or filing_date,
                    url=f"https://www.lens.org/lens/patent/{lens_id}" if lens_id else None,
                    title=title,
                    metadata={
                        "lens_id": lens_id,
                        "filing_date": filing_date,
                        "publication_date": publication_date,
                        "applicants": applicant_names,
                        "claims": claim_texts
                    },
                    relevance_score=self._calculate_relevance(patent)
                )

                evidence_items.append(evidence)

            except Exception as e:
                self.logger.warning(f"Failed to process patent: {e}")
                continue

        return evidence_items

    def _create_summary(
        self,
        title: str,
        abstract: str,
        applicants: List[str]
    ) -> str:
        """
        Create summary from patent information.

        Args:
            title: Patent title
            abstract: Patent abstract
            applicants: List of applicant names

        Returns:
            Summary string
        """
        # Start with title
        summary = title

        # Add applicant information
        if applicants:
            applicant_str = ", ".join(applicants)
            summary += f". Filed by {applicant_str}."

        # Add snippet from abstract if available
        if abstract:
            # Take first sentence from abstract
            first_sentence = abstract.split(". ")[0]
            if first_sentence and first_sentence != title:
                summary += f" {first_sentence}."

        return self._truncate_text(summary, max_length=400)

    def _calculate_relevance(self, patent: Dict[str, Any]) -> float:
        """
        Calculate relevance score for patent.

        Args:
            patent: Patent dictionary

        Returns:
            Relevance score (0-1)
        """
        score = 0.5  # Base score

        # Boost for recent patents
        filing_date = patent.get("filing_date", "")
        if filing_date:
            try:
                year = int(filing_date.split("-")[0])
                if year >= 2020:
                    score += 0.3
                elif year >= 2015:
                    score += 0.2
                elif year >= 2010:
                    score += 0.1
            except (ValueError, IndexError):
                pass

        # Boost for repurposing keywords in title/abstract
        title = patent.get("title", "").lower()
        abstract = patent.get("abstract", "").lower()
        combined = f"{title} {abstract}"

        repurposing_keywords = [
            "repurposing", "repositioning", "new indication",
            "therapeutic use", "treatment", "therapy"
        ]

        keyword_count = sum(1 for keyword in repurposing_keywords if keyword in combined)
        score += min(keyword_count * 0.1, 0.2)

        # Boost for multiple applicants (indicates broader interest)
        applicants = patent.get("applicants", [])
        if len(applicants) >= 3:
            score += 0.1

        return min(score, 1.0)
