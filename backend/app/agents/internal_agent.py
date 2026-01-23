"""
Internal Agent - Simulates proprietary R&D database for demonstration purposes.
Returns mock internal research data to showcase enterprise capability.
"""

from typing import Dict, List, Any
import asyncio
from app.agents.base_agent import BaseAgent
from app.models.schemas import EvidenceItem


class InternalAgent(BaseAgent):
    """Agent for simulating internal proprietary data."""

    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)

        # Mock internal database - maps drug names to internal research data
        self.internal_database = {
            "metformin": {
                "indications": ["Longevity", "Cancer Prevention", "Neuroprotection"],
                "notes": [
                    "Phase 1 longevity trial showing promising AMPK activation (Q3 2024)",
                    "Safety profile excellent for cardiovascular patients - 5-year study confirms",
                    "Research team hypothesis: anti-cancer properties via metabolic pathway modulation"
                ],
                "priority": "high"
            },
            "aspirin": {
                "indications": ["Colorectal Cancer Prevention", "Alzheimer's Prevention"],
                "notes": [
                    "Meta-analysis of internal trials shows 20% reduction in colorectal cancer risk",
                    "Preliminary data suggests anti-inflammatory effects may slow cognitive decline",
                    "Long-term safety monitoring ongoing for low-dose regimens"
                ],
                "priority": "medium"
            },
            "ibuprofen": {
                "indications": ["Alzheimer's Prevention", "Parkinson's Disease"],
                "notes": [
                    "Epidemiological data suggests reduced AD risk with long-term use",
                    "Neuroprotective mechanisms under investigation in animal models",
                    "Clinical trial planning for preventive use in at-risk populations"
                ],
                "priority": "medium"
            },
            "sildenafil": {
                "indications": ["Pulmonary Hypertension", "Raynaud's Phenomenon"],
                "notes": [
                    "Already approved for pulmonary arterial hypertension - expanding indications",
                    "Phase 2 trial for Raynaud's shows improvement in digital blood flow",
                    "Investigating potential benefits for heart failure with preserved ejection fraction"
                ],
                "priority": "high"
            },
            "thalidomide": {
                "indications": ["Multiple Myeloma", "Leprosy"],
                "notes": [
                    "Successful redemption story - now key treatment for multiple myeloma",
                    "Strict REMS program in place due to teratogenicity",
                    "Exploring immunomodulatory effects for other hematologic malignancies"
                ],
                "priority": "high"
            },
            "rapamycin": {
                "indications": ["Longevity", "Age-related Diseases"],
                "notes": [
                    "mTOR inhibition shows life-extension in multiple animal models",
                    "Internal aging research program investigating optimal dosing for humans",
                    "Preliminary data on cognitive benefits in older adults"
                ],
                "priority": "high"
            },
            "hydroxychloroquine": {
                "indications": ["Lupus", "Rheumatoid Arthritis"],
                "notes": [
                    "Well-established for autoimmune conditions with good safety profile",
                    "Investigating combination therapies for refractory cases",
                    "Long-term retinal monitoring protocols optimized"
                ],
                "priority": "medium"
            },
            "tamoxifen": {
                "indications": ["Breast Cancer Prevention", "Bipolar Disorder"],
                "notes": [
                    "Proven efficacy in breast cancer - exploring psychiatric applications",
                    "Small pilot study suggests mood-stabilizing effects",
                    "Mechanism may involve estrogen modulation in brain"
                ],
                "priority": "low"
            },
            "valproic acid": {
                "indications": ["Cancer", "HIV Latency Reversal"],
                "notes": [
                    "HDAC inhibitor properties suggest anti-cancer potential",
                    "Preclinical data for glioblastoma combination therapy",
                    "HIV cure research exploring latency reversal mechanisms"
                ],
                "priority": "medium"
            },
            "ketoconazole": {
                "indications": ["Prostate Cancer", "Cushing's Syndrome"],
                "notes": [
                    "Anti-androgen effects useful in castration-resistant prostate cancer",
                    "Steroid synthesis inhibition for hypercortisolism",
                    "Monitoring liver function essential with prolonged use"
                ],
                "priority": "medium"
            }
        }

    async def fetch_data(self, drug_name: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fetch mock internal data.

        Args:
            drug_name: Drug name to search for
            context: Additional search context

        Returns:
            List of internal research records
        """
        # Simulate database query latency
        await asyncio.sleep(0.5)

        drug_name_lower = drug_name.lower().strip()

        # Check if we have internal data for this drug
        if drug_name_lower in self.internal_database:
            data = self.internal_database[drug_name_lower]
            self.logger.info(f"Found internal data for: {drug_name}")

            # Structure data as research records
            records = []
            for i, (indication, note) in enumerate(zip(data["indications"], data["notes"])):
                records.append({
                    "indication": indication,
                    "note": note,
                    "priority": data["priority"],
                    "record_id": f"INT-{drug_name_lower.upper()}-{i+1}",
                    "last_updated": "2024-01-15"
                })

            return records
        else:
            # Return generic placeholder data for any other drug
            self.logger.info(f"No specific internal data for {drug_name}, returning generic data")
            return [
                {
                    "indication": "Under Investigation",
                    "note": f"Internal research ongoing for {drug_name}. No conclusive data yet.",
                    "priority": "low",
                    "record_id": f"INT-GENERIC-001",
                    "last_updated": "2024-01-15"
                }
            ]

    async def process_data(self, raw_data: List[Dict[str, Any]]) -> List[EvidenceItem]:
        """
        Process internal records into evidence items.

        Args:
            raw_data: List of internal research records

        Returns:
            List of EvidenceItem objects
        """
        evidence_items = []

        for record in raw_data:
            try:
                record_id = record.get("record_id", "")
                indication = record.get("indication", "Unknown")

                evidence = EvidenceItem(
                    source="internal",
                    indication=indication,
                    summary=record.get("note", ""),
                    date=record.get("last_updated", ""),
                    url=None,  # Internal data - no public URL
                    title=f"Internal Research: {indication}",
                    metadata={
                        "record_id": record_id,
                        "priority": record.get("priority", "low"),
                        "source_type": "proprietary_database",
                        "confidential": True
                    },
                    relevance_score=self._calculate_relevance(record)
                )

                evidence_items.append(evidence)

            except Exception as e:
                self.logger.warning(f"Failed to process internal record: {e}")
                continue

        return evidence_items

    def _calculate_relevance(self, record: Dict[str, Any]) -> float:
        """
        Calculate relevance score for internal record.

        Args:
            record: Internal research record

        Returns:
            Relevance score (0-1)
        """
        # Base score on priority level
        priority = record.get("priority", "low")

        priority_scores = {
            "high": 0.8,
            "medium": 0.6,
            "low": 0.4
        }

        return priority_scores.get(priority, 0.5)
