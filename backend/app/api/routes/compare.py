"""
Drug Comparison Endpoint

Compares 2-3 drugs using cached pipeline results.
Returns overlapping indications, score comparisons, and unique findings.
"""

import logging
from typing import List, Dict, Any, Optional
from collections import Counter

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from app.cache.cache_manager import CacheManager

logger = logging.getLogger(__name__)
router = APIRouter()

cache_manager = CacheManager()


# --- Request/Response Models ---

class CompareRequest(BaseModel):
    """Drug comparison request."""
    drug_names: List[str]

    @field_validator("drug_names")
    @classmethod
    def validate_drug_names(cls, v):
        if len(v) < 2 or len(v) > 3:
            raise ValueError("Must provide 2-3 drug names")
        return [name.strip() for name in v if name.strip()]


class DrugScores(BaseModel):
    """Average 4D scores for a drug."""
    overall: float = 0
    scientific_evidence: float = 0
    market_opportunity: float = 0
    competitive_landscape: float = 0
    development_feasibility: float = 0


class DrugComparisonItem(BaseModel):
    """Comparison data for a single drug."""
    drug_name: str
    cached: bool = False
    indication_count: int = 0
    evidence_count: int = 0
    scores: DrugScores = DrugScores()
    indications: List[str] = []


class CompareResponse(BaseModel):
    """Drug comparison response."""
    drugs: List[DrugComparisonItem]
    overlapping_indications: List[str] = []
    unique_indications: Dict[str, List[str]] = {}
    comparison_summary: str = ""


# --- Helpers ---

def _compute_avg_scores(enhanced_indications: List[Dict]) -> DrugScores:
    """Compute average 4D scores from enhanced indications."""
    if not enhanced_indications:
        return DrugScores()

    def avg(field: str, is_subscore: bool = True) -> float:
        values = []
        for ind in enhanced_indications:
            cs = ind.get("composite_score", {})
            if not cs:
                continue
            if is_subscore:
                sub = cs.get(field, {})
                if isinstance(sub, dict):
                    val = sub.get("score", 0)
                elif isinstance(sub, (int, float)):
                    val = sub
                else:
                    continue
            else:
                val = cs.get(field, 0)
            if isinstance(val, (int, float)):
                values.append(val)
        return round(sum(values) / len(values), 1) if values else 0

    return DrugScores(
        overall=avg("overall_score", is_subscore=False),
        scientific_evidence=avg("scientific_evidence"),
        market_opportunity=avg("market_opportunity"),
        competitive_landscape=avg("competitive_landscape"),
        development_feasibility=avg("development_feasibility"),
    )


def _extract_indications(cached_result: Dict) -> List[str]:
    """Extract indication names from cached result."""
    enhanced = cached_result.get("enhanced_indications", [])
    if enhanced:
        return [ind.get("indication", "") for ind in enhanced if ind.get("indication")]

    ranked = cached_result.get("ranked_indications", [])
    return [ind.get("indication", "") for ind in ranked if ind.get("indication")]


# --- Endpoint ---

@router.post("/compare", response_model=CompareResponse)
async def compare_drugs(request: CompareRequest):
    """
    Compare 2-3 drugs using cached pipeline results.

    Returns overlapping indications, score comparisons, and unique findings
    for each drug. Only uses cached data — does not trigger new pipeline runs.
    """
    drug_items = []

    for drug_name in request.drug_names:
        cached = await cache_manager.get_cached_result(drug_name)

        if cached:
            enhanced = cached.get("enhanced_indications", [])
            all_evidence = cached.get("all_evidence", [])
            indications = _extract_indications(cached)
            scores = _compute_avg_scores(enhanced)

            drug_items.append(DrugComparisonItem(
                drug_name=drug_name,
                cached=True,
                indication_count=len(indications),
                evidence_count=len(all_evidence),
                scores=scores,
                indications=indications,
            ))
        else:
            drug_items.append(DrugComparisonItem(
                drug_name=drug_name,
                cached=False,
                indication_count=0,
                evidence_count=0,
                scores=DrugScores(),
                indications=[],
            ))

    # Find overlapping indications (appear in 2+ drugs)
    all_indications = []
    for item in drug_items:
        all_indications.extend([ind.lower() for ind in item.indications])

    indication_counts = Counter(all_indications)
    overlapping = [
        ind for ind, count in indication_counts.items() if count >= 2
    ]

    # Find unique indications per drug
    unique_indications = {}
    overlap_set = set(overlapping)
    for item in drug_items:
        unique = [
            ind for ind in item.indications
            if ind.lower() not in overlap_set
        ]
        unique_indications[item.drug_name] = unique

    # Build summary
    cached_count = sum(1 for d in drug_items if d.cached)
    summary_parts = [
        f"Compared {len(drug_items)} drugs ({cached_count} with cached data)."
    ]
    if overlapping:
        summary_parts.append(
            f"Found {len(overlapping)} overlapping indication(s)."
        )
    if any(d.scores.overall > 0 for d in drug_items):
        best = max(drug_items, key=lambda d: d.scores.overall)
        summary_parts.append(
            f"Highest overall score: {best.drug_name} ({best.scores.overall})."
        )

    return CompareResponse(
        drugs=drug_items,
        overlapping_indications=overlapping,
        unique_indications=unique_indications,
        comparison_summary=" ".join(summary_parts),
    )
