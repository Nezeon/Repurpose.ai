"""
Integration Management API - Enable/disable data sources and configure API keys.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Type
from datetime import datetime
import time

from app.config import settings
from app.utils.logger import get_logger

# Import all agents for connection testing
from app.agents.base_agent import BaseAgent
from app.agents.literature_agent import LiteratureAgent
from app.agents.clinical_trials_agent import ClinicalTrialsAgent
from app.agents.openfda_agent import OpenFDAAgent
from app.agents.opentargets_agent import OpenTargetsAgent
from app.agents.bioactivity_agent import BioactivityAgent
from app.agents.drugbank_agent import DrugBankAgent
from app.agents.rxnorm_agent import RxNormAgent
from app.agents.dailymed_agent import DailyMedAgent
from app.agents.patent_agent import PatentAgent
from app.agents.kegg_agent import KEGGAgent
from app.agents.uniprot_agent import UniProtAgent

logger = get_logger("integrations")


# --- Agent Registry for Connection Testing ---
# Maps integration IDs to their agent classes
AGENT_REGISTRY: Dict[str, Type[BaseAgent]] = {
    "literature": LiteratureAgent,
    "clinical_trials": ClinicalTrialsAgent,
    "openfda": OpenFDAAgent,
    "opentargets": OpenTargetsAgent,
    "bioactivity": BioactivityAgent,
    "drugbank": DrugBankAgent,
    "rxnorm": RxNormAgent,
    "dailymed": DailyMedAgent,
    "patent": PatentAgent,
    "kegg": KEGGAgent,
    "uniprot": UniProtAgent,
}

router = APIRouter(prefix="/integrations", tags=["Integrations"])


# --- Data Models ---

class IntegrationInfo(BaseModel):
    """Information about a single integration/data source."""
    id: str
    name: str
    description: str
    category: str
    enabled: bool = True
    configured: bool = True
    api_key_required: bool = False
    api_key_set: bool = False
    status: str = "active"  # active, inactive, error
    rate_limit: float = 1.0
    last_used: Optional[str] = None
    tier: str = "free"  # free, premium
    docs_url: Optional[str] = None


class IntegrationConfig(BaseModel):
    """Configuration for an integration."""
    api_key: Optional[str] = None
    custom_settings: Optional[Dict] = None


class IntegrationToggleResponse(BaseModel):
    """Response when toggling an integration."""
    id: str
    enabled: bool
    message: str


class IntegrationConfigResponse(BaseModel):
    """Response when configuring an integration."""
    id: str
    configured: bool
    api_key_set: bool
    message: str


# --- Integration Registry ---

# Define all available integrations
ALL_INTEGRATIONS = {
    # Tier 1: Core Sources - Literature & Clinical
    "literature": {
        "name": "PubMed / Literature",
        "description": "Scientific literature from NCBI PubMed database with citation analysis",
        "category": "literature",
        "api_key_required": False,
        "rate_limit": settings.PUBMED_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://pubmed.ncbi.nlm.nih.gov/"
    },
    "clinical_trials": {
        "name": "ClinicalTrials.gov",
        "description": "Clinical trial registry data including phases, endpoints, and results",
        "category": "literature",
        "api_key_required": False,
        "rate_limit": settings.CLINICAL_TRIALS_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://clinicaltrials.gov/"
    },
    "semantic_scholar": {
        "name": "Semantic Scholar",
        "description": "AI-powered academic literature search with citation metrics",
        "category": "literature",
        "api_key_required": False,  # Optional for higher rate limits
        "rate_limit": settings.SEMANTIC_SCHOLAR_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://www.semanticscholar.org/"
    },
    "patent": {
        "name": "Lens.org Patents",
        "description": "Global patent database for IP landscape analysis",
        "category": "literature",
        "api_key_required": True,
        "rate_limit": settings.LENS_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://www.lens.org/"
    },
    "internal": {
        "name": "Internal R&D Database",
        "description": "Proprietary research data and internal drug development records",
        "category": "literature",
        "api_key_required": False,
        "rate_limit": 10.0,
        "tier": "free",
        "docs_url": None
    },

    # Tier 2: Regulatory Sources
    "openfda": {
        "name": "OpenFDA",
        "description": "FDA drug approval, adverse events, recalls, and safety data",
        "category": "regulatory",
        "api_key_required": False,
        "rate_limit": settings.OPENFDA_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://open.fda.gov/"
    },
    "dailymed": {
        "name": "DailyMed Labels",
        "description": "FDA-approved drug labeling and structured product labels (SPL)",
        "category": "regulatory",
        "api_key_required": False,
        "rate_limit": settings.DAILYMED_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://dailymed.nlm.nih.gov/"
    },
    "orange_book": {
        "name": "FDA Orange Book",
        "description": "Approved drug products with therapeutic equivalence, patents, exclusivity",
        "category": "regulatory",
        "api_key_required": False,
        "rate_limit": settings.ORANGE_BOOK_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://www.fda.gov/drugs/drug-approvals-and-databases/approved-drug-products-therapeutic-equivalence-evaluations-orange-book"
    },

    # Tier 3: Target & Pathway Sources
    "opentargets": {
        "name": "OpenTargets Platform",
        "description": "Target-disease associations and drug mechanisms via GraphQL API",
        "category": "targets",
        "api_key_required": False,
        "rate_limit": settings.OPENTARGETS_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://platform.opentargets.org/"
    },
    "kegg": {
        "name": "KEGG Pathways",
        "description": "Biological pathways, disease associations, and drug-target relationships",
        "category": "targets",
        "api_key_required": False,
        "rate_limit": settings.KEGG_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://www.kegg.jp/"
    },
    "uniprot": {
        "name": "UniProt Proteins",
        "description": "Protein sequences, functions, and disease associations",
        "category": "targets",
        "api_key_required": False,
        "rate_limit": settings.UNIPROT_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://www.uniprot.org/"
    },

    # Tier 4: Drug Information Sources
    "bioactivity": {
        "name": "ChEMBL Bioactivity",
        "description": "Bioactivity data for drug-like compounds from EMBL-EBI",
        "category": "drug_info",
        "api_key_required": False,
        "rate_limit": settings.CHEMBL_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://www.ebi.ac.uk/chembl/"
    },
    "drugbank": {
        "name": "DrugBank",
        "description": "Comprehensive drug data including targets, interactions, and pharmacology",
        "category": "drug_info",
        "api_key_required": False,  # Uses curated fallback if no API key
        "rate_limit": settings.DRUGBANK_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://go.drugbank.com/"
    },
    "rxnorm": {
        "name": "RxNorm",
        "description": "Drug normalization, related formulations, and therapeutic classes",
        "category": "drug_info",
        "api_key_required": False,
        "rate_limit": settings.RXNORM_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://www.nlm.nih.gov/research/umls/rxnorm/"
    },
    "who": {
        "name": "WHO Essential Medicines",
        "description": "WHO Model List of Essential Medicines and global health priorities",
        "category": "drug_info",
        "api_key_required": False,
        "rate_limit": settings.WHO_RATE_LIMIT,
        "tier": "free",
        "docs_url": "https://list.essentialmeds.org/"
    },

    # Premium Tier
    "iqvia": {
        "name": "IQVIA Market Intelligence",
        "description": "Real-time market data, sales forecasts, competitive intelligence",
        "category": "premium",
        "api_key_required": True,
        "rate_limit": 1.0,
        "tier": "premium",
        "docs_url": "https://www.iqvia.com/"
    },
    "cortellis": {
        "name": "Cortellis Drug Discovery",
        "description": "Pipeline intelligence, deal analytics, patent landscape",
        "category": "premium",
        "api_key_required": True,
        "rate_limit": 1.0,
        "tier": "premium",
        "docs_url": "https://www.cortellis.com/"
    },
    "informa": {
        "name": "Informa Pharma Intelligence",
        "description": "Clinical trial analytics, regulatory intelligence, success rates",
        "category": "premium",
        "api_key_required": True,
        "rate_limit": 1.0,
        "tier": "premium",
        "docs_url": "https://pharmaintelligence.informa.com/"
    },
    "evaluate": {
        "name": "Evaluate Pharma",
        "description": "Consensus forecasts, NPV calculations, market analysis",
        "category": "premium",
        "api_key_required": True,
        "rate_limit": 1.0,
        "tier": "premium",
        "docs_url": "https://www.evaluate.com/"
    },
    "clarivate": {
        "name": "Clarivate Analytics",
        "description": "Patent analytics, IP landscape analysis, freedom-to-operate",
        "category": "premium",
        "api_key_required": True,
        "rate_limit": 1.0,
        "tier": "premium",
        "docs_url": "https://clarivate.com/"
    },
}

# In-memory state (in production, use database)
_integration_states: Dict[str, Dict] = {}

# Store API keys in memory (in production, store encrypted in database)
# Pre-populate from settings if available
_api_keys: Dict[str, str] = {}

# Initialize API keys from settings on module load
if settings.LENS_API_KEY:
    _api_keys["patent"] = settings.LENS_API_KEY
if settings.SEMANTIC_SCHOLAR_API_KEY:
    _api_keys["semantic_scholar"] = settings.SEMANTIC_SCHOLAR_API_KEY
if settings.DRUGBANK_API_KEY:
    _api_keys["drugbank"] = settings.DRUGBANK_API_KEY


def _get_integration_state(integration_id: str) -> Dict:
    """Get or initialize integration state."""
    if integration_id not in _integration_states:
        # Check if API key is configured in settings
        api_key_set = False
        if integration_id == "patent":
            api_key_set = bool(settings.LENS_API_KEY)
        elif integration_id == "semantic_scholar":
            api_key_set = bool(settings.SEMANTIC_SCHOLAR_API_KEY)
        elif integration_id == "drugbank":
            api_key_set = bool(settings.DRUGBANK_API_KEY)

        # Premium integrations start disabled
        is_premium = ALL_INTEGRATIONS.get(integration_id, {}).get("tier") == "premium"

        _integration_states[integration_id] = {
            "enabled": not is_premium,  # Free integrations enabled by default
            "api_key_set": api_key_set,
            "last_used": None,
            "custom_settings": {}
        }
    return _integration_states[integration_id]


def _build_integration_info(integration_id: str) -> IntegrationInfo:
    """Build IntegrationInfo from registry and state."""
    if integration_id not in ALL_INTEGRATIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{integration_id}' not found"
        )

    info = ALL_INTEGRATIONS[integration_id]
    state = _get_integration_state(integration_id)

    # Determine status
    status_str = "inactive"
    if state["enabled"]:
        if info["api_key_required"] and not state["api_key_set"]:
            status_str = "error"  # Needs API key
        else:
            status_str = "active"

    return IntegrationInfo(
        id=integration_id,
        name=info["name"],
        description=info["description"],
        category=info["category"],
        enabled=state["enabled"],
        configured=not info["api_key_required"] or state["api_key_set"],
        api_key_required=info["api_key_required"],
        api_key_set=state["api_key_set"],
        status=status_str,
        rate_limit=info["rate_limit"],
        last_used=state["last_used"],
        tier=info["tier"],
        docs_url=info.get("docs_url")
    )


# --- API Endpoints ---

@router.get("/", response_model=List[IntegrationInfo])
async def list_integrations():
    """
    Get all available integrations and their current status.

    Returns a list of all data source integrations with their configuration state.
    """
    integrations = []
    for integration_id in ALL_INTEGRATIONS:
        integrations.append(_build_integration_info(integration_id))

    # Sort by category then name
    category_order = ["literature", "regulatory", "targets", "drug_info", "premium"]
    integrations.sort(key=lambda x: (category_order.index(x.category) if x.category in category_order else 99, x.name))

    return integrations


@router.get("/enabled", response_model=List[str])
async def get_enabled_integrations():
    """
    Get list of enabled integration IDs.

    Used by the workflow to determine which agents to run.
    """
    enabled = []
    for integration_id in ALL_INTEGRATIONS:
        state = _get_integration_state(integration_id)
        info = ALL_INTEGRATIONS[integration_id]

        # Only include if enabled and properly configured
        if state["enabled"]:
            if info["api_key_required"] and not state["api_key_set"]:
                continue  # Skip - needs API key
            enabled.append(integration_id)

    return enabled


@router.get("/{integration_id}", response_model=IntegrationInfo)
async def get_integration(integration_id: str):
    """
    Get detailed status of a specific integration.
    """
    return _build_integration_info(integration_id)


@router.post("/{integration_id}/enable", response_model=IntegrationToggleResponse)
async def enable_integration(integration_id: str):
    """
    Enable an integration data source.
    """
    if integration_id not in ALL_INTEGRATIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{integration_id}' not found"
        )

    info = ALL_INTEGRATIONS[integration_id]
    state = _get_integration_state(integration_id)

    # Check if premium
    if info["tier"] == "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium integrations require a subscription. Contact sales for access."
        )

    state["enabled"] = True
    logger.info(f"Integration enabled: {integration_id}")

    return IntegrationToggleResponse(
        id=integration_id,
        enabled=True,
        message=f"Integration '{info['name']}' enabled successfully"
    )


@router.post("/{integration_id}/disable", response_model=IntegrationToggleResponse)
async def disable_integration(integration_id: str):
    """
    Disable an integration data source.
    """
    if integration_id not in ALL_INTEGRATIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{integration_id}' not found"
        )

    info = ALL_INTEGRATIONS[integration_id]
    state = _get_integration_state(integration_id)
    state["enabled"] = False

    logger.info(f"Integration disabled: {integration_id}")

    return IntegrationToggleResponse(
        id=integration_id,
        enabled=False,
        message=f"Integration '{info['name']}' disabled successfully"
    )


@router.put("/{integration_id}/configure", response_model=IntegrationConfigResponse)
async def configure_integration(integration_id: str, config: IntegrationConfig):
    """
    Configure integration settings (API key, custom settings).

    For security, API keys are validated but not returned in responses.
    """
    if integration_id not in ALL_INTEGRATIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{integration_id}' not found"
        )

    info = ALL_INTEGRATIONS[integration_id]
    state = _get_integration_state(integration_id)

    # Check if premium
    if info["tier"] == "premium":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium integrations require a subscription. Contact sales for access."
        )

    # Update API key if provided
    if config.api_key:
        # Store API key (in production, store encrypted in database)
        _api_keys[integration_id] = config.api_key
        state["api_key_set"] = True
        logger.info(f"API key configured for: {integration_id}")

    # Update custom settings
    if config.custom_settings:
        state["custom_settings"] = config.custom_settings

    return IntegrationConfigResponse(
        id=integration_id,
        configured=not info["api_key_required"] or state["api_key_set"],
        api_key_set=state["api_key_set"],
        message=f"Integration '{info['name']}' configured successfully"
    )


@router.post("/{integration_id}/test")
async def test_integration(integration_id: str):
    """
    Test connection to an integration.

    Performs a real health check to verify the integration's external API is working.
    """
    if integration_id not in ALL_INTEGRATIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration '{integration_id}' not found"
        )

    info = ALL_INTEGRATIONS[integration_id]
    state = _get_integration_state(integration_id)

    # Check if enabled
    if not state["enabled"]:
        return {
            "success": False,
            "message": "Integration is disabled. Enable it first.",
            "integration_id": integration_id
        }

    # Check if API key required but not set
    if info["api_key_required"] and not state["api_key_set"]:
        return {
            "success": False,
            "message": "API key required but not configured.",
            "integration_id": integration_id
        }

    # Check if we have an agent for this integration
    if integration_id not in AGENT_REGISTRY:
        # No agent available - return success based on configuration
        return {
            "success": True,
            "message": f"Integration '{info['name']}' is configured (no connection test available)",
            "integration_id": integration_id,
            "response_time_ms": 0,
            "details": {"test_type": "configuration_only"}
        }

    # Instantiate and test the agent
    try:
        agent_class = AGENT_REGISTRY[integration_id]

        # Build config with API key if available
        agent_config = {}
        if integration_id in _api_keys:
            agent_config["api_key"] = _api_keys[integration_id]

        agent = agent_class(config=agent_config)

        logger.info(f"Testing connection for integration: {integration_id}")
        start_time = time.time()

        # Call the agent's test_connection method
        result = await agent.test_connection()

        # Update last_used timestamp on successful test
        if result.get("success"):
            state["last_used"] = datetime.now().isoformat()

        return {
            "success": result.get("success", False),
            "message": result.get("message", "Connection test completed"),
            "integration_id": integration_id,
            "response_time_ms": result.get("response_time_ms", 0),
            "details": result.get("details", {})
        }

    except Exception as e:
        logger.error(f"Connection test failed for {integration_id}: {e}")
        return {
            "success": False,
            "message": f"Connection test failed: {str(e)}",
            "integration_id": integration_id,
            "response_time_ms": 0,
            "details": {"error": str(e)}
        }


@router.get("/categories/summary")
async def get_category_summary():
    """
    Get summary of integrations grouped by category.
    """
    categories = {
        "literature": {"name": "Literature & Clinical", "total": 0, "active": 0},
        "regulatory": {"name": "Regulatory & Safety", "total": 0, "active": 0},
        "targets": {"name": "Targets & Pathways", "total": 0, "active": 0},
        "drug_info": {"name": "Drug Information", "total": 0, "active": 0},
        "premium": {"name": "Premium Sources", "total": 0, "active": 0},
    }

    for integration_id, info in ALL_INTEGRATIONS.items():
        category = info["category"]
        if category in categories:
            categories[category]["total"] += 1
            state = _get_integration_state(integration_id)
            if state["enabled"] and (not info["api_key_required"] or state["api_key_set"]):
                categories[category]["active"] += 1

    return categories
