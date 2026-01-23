"""
Evidence Scorer - Scores and ranks drug repurposing opportunities.
Uses weighted algorithm to assess evidence quality from multiple sources.
"""

from typing import List, Dict
from collections import defaultdict
import numpy as np
from app.models.schemas import EvidenceItem, IndicationResult
from app.utils.logger import get_logger

logger = get_logger("scoring")


class EvidenceScorer:
    """Scores and ranks evidence for drug repurposing opportunities."""

    def __init__(self):
        """Initialize scorer with evidence source weights."""
        # Base scores for each data source (out of 100)
        # These represent the inherent value of evidence from each source
        self.source_base_scores = {
            "clinical_trials": 70,  # Clinical validation is most valuable
            "literature": 60,       # Peer-reviewed research
            "bioactivity": 55,      # Molecular/experimental data
            "patent": 50,           # Commercial interest indicator
            "internal": 50          # Proprietary data
        }

    def score_evidence(self, evidence: EvidenceItem) -> float:
        """
        Calculate confidence score (0-100) for a single evidence item.

        Args:
            evidence: Evidence item to score

        Returns:
            Confidence score (0-100)
        """
        # Base score from source type
        base_score = self.source_base_scores.get(evidence.source, 50)

        # Apply quality multipliers based on source-specific factors
        if evidence.source == "clinical_trials":
            base_score = self._score_clinical_trial(evidence, base_score)
        elif evidence.source == "literature":
            base_score = self._score_literature(evidence, base_score)
        elif evidence.source == "bioactivity":
            base_score = self._score_bioactivity(evidence, base_score)
        elif evidence.source == "patent":
            base_score = self._score_patent(evidence, base_score)
        elif evidence.source == "internal":
            base_score = self._score_internal(evidence, base_score)

        # Add bonus for high relevance score (additive, not multiplicative)
        if evidence.relevance_score and evidence.relevance_score > 0:
            # Add up to 15 points for high relevance
            relevance_bonus = evidence.relevance_score * 15
            base_score += relevance_bonus

        return min(base_score, 100.0)

    def _score_clinical_trial(self, evidence: EvidenceItem, base_score: float) -> float:
        """Score clinical trial evidence."""
        metadata = evidence.metadata

        # Boost for completed trials (+15 points)
        status = metadata.get("status", "").lower()
        if "completed" in status:
            base_score += 15
        elif "active" in status or "recruiting" in status:
            base_score += 10

        # Boost for later phase trials
        phase = metadata.get("phase", "").lower()
        if "phase 4" in phase or "phase iv" in phase or "4" in phase:
            base_score += 20  # Phase 4 = post-market, very high confidence
        elif "phase 3" in phase or "phase iii" in phase or "3" in phase:
            base_score += 15  # Phase 3 = efficacy trials
        elif "phase 2" in phase or "phase ii" in phase or "2" in phase:
            base_score += 10  # Phase 2 = dose-finding
        elif "phase 1" in phase or "phase i" in phase or "1" in phase:
            base_score += 5   # Phase 1 = safety

        return base_score

    def _score_literature(self, evidence: EvidenceItem, base_score: float) -> float:
        """Score literature evidence."""
        metadata = evidence.metadata

        # Boost for recent publications
        year = metadata.get("year")
        if year:
            try:
                year_int = int(year)
                if year_int >= 2023:
                    base_score += 20  # Very recent
                elif year_int >= 2020:
                    base_score += 15  # Recent
                elif year_int >= 2015:
                    base_score += 10  # Moderately recent
                elif year_int >= 2010:
                    base_score += 5   # Older but still relevant
            except (ValueError, TypeError):
                pass

        # Boost for high-impact papers (using citations as proxy)
        citations = metadata.get("citations", 0)
        if citations > 100:
            base_score += 10
        elif citations > 50:
            base_score += 5

        return base_score

    def _score_bioactivity(self, evidence: EvidenceItem, base_score: float) -> float:
        """Score bioactivity evidence."""
        metadata = evidence.metadata

        # Boost for strong activity (low IC50)
        ic50 = metadata.get("avg_ic50_nm")
        if ic50:
            try:
                ic50_float = float(ic50)
                if ic50_float < 100:  # Very potent (<100nM)
                    base_score += 25
                elif ic50_float < 1000:  # Potent (<1uM)
                    base_score += 15
                elif ic50_float < 10000:  # Moderate (<10uM)
                    base_score += 10
            except (ValueError, TypeError):
                pass

        # Boost for multiple activity records
        activity_count = metadata.get("activity_count", 0)
        if activity_count >= 10:
            base_score += 10
        elif activity_count >= 5:
            base_score += 5

        return base_score

    def _score_patent(self, evidence: EvidenceItem, base_score: float) -> float:
        """Score patent evidence."""
        metadata = evidence.metadata

        # Boost for recent patents
        filing_date = metadata.get("filing_date", "")
        if filing_date:
            try:
                year = int(filing_date.split("-")[0])
                if year >= 2022:
                    base_score += 20
                elif year >= 2020:
                    base_score += 15
                elif year >= 2015:
                    base_score += 10
            except (ValueError, IndexError):
                pass

        # Boost for multiple applicants (broader interest)
        applicants = metadata.get("applicants", [])
        if len(applicants) >= 3:
            base_score += 10
        elif len(applicants) >= 2:
            base_score += 5

        return base_score

    def _score_internal(self, evidence: EvidenceItem, base_score: float) -> float:
        """Score internal evidence."""
        metadata = evidence.metadata

        # Boost based on priority
        priority = metadata.get("priority", "low")
        if priority == "high":
            base_score += 20
        elif priority == "medium":
            base_score += 10
        # Low priority gets no bonus

        return base_score

    def rank_indications(self, evidence_list: List[EvidenceItem]) -> List[IndicationResult]:
        """
        Group evidence by indication and rank by confidence.

        Args:
            evidence_list: List of all evidence items

        Returns:
            Ranked list of indications with aggregated evidence
        """
        logger.info(f"Ranking {len(evidence_list)} evidence items...")

        # Group evidence by indication
        indication_map = defaultdict(list)

        for evidence in evidence_list:
            indication = evidence.indication or "Unknown Indication"
            score = self.score_evidence(evidence)
            indication_map[indication].append((evidence, score))

        # Aggregate scores per indication
        results = []
        for indication, items in indication_map.items():
            evidence_items = [e for e, _ in items]
            scores = [s for _, s in items]

            # Calculate combined confidence
            if scores:
                # Use weighted combination of max, mean, and count bonuses
                max_score = max(scores)
                mean_score = float(np.mean(scores))

                # Start with weighted average favoring the best evidence
                base_confidence = (max_score * 0.6) + (mean_score * 0.4)
            else:
                base_confidence = 0.0

            # Evidence count bonus: more evidence = higher confidence
            evidence_count = len(evidence_items)
            if evidence_count >= 10:
                count_bonus = 15
            elif evidence_count >= 5:
                count_bonus = 10
            elif evidence_count >= 3:
                count_bonus = 5
            else:
                count_bonus = 0

            # Diversity bonus: reward evidence from multiple sources
            unique_sources = len(set(e.source for e in evidence_items))
            diversity_bonus = min(unique_sources * 5, 20)  # Max +20 for 4+ sources

            # Calculate final confidence
            confidence = min(base_confidence + count_bonus + diversity_bonus, 100.0)

            results.append(IndicationResult(
                indication=indication,
                confidence_score=round(confidence, 1),
                evidence_count=len(evidence_items),
                evidence_items=evidence_items,
                supporting_sources=list(set(e.source for e in evidence_items))
            ))

        # Sort by confidence score (descending)
        ranked_results = sorted(results, key=lambda x: x.confidence_score, reverse=True)

        logger.info(f"Identified {len(ranked_results)} unique indications")
        if ranked_results:
            logger.info(f"Top indication: {ranked_results[0].indication} with score {ranked_results[0].confidence_score}")

        return ranked_results
