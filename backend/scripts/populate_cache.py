"""
Cache Population Script
Pre-populate cache with demo drugs for guaranteed hackathon demo reliability.

Run this script 1 day before the demo to ensure instant results.

Usage:
    python scripts/populate_cache.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.graph.workflow import get_workflow
from app.cache.cache_manager import CacheManager
from app.utils.logger import get_logger

logger = get_logger("cache_population")

# Demo drugs with known repurposing opportunities
DEMO_DRUGS = [
    "Metformin",
    "Aspirin",
    "Ibuprofen",
    "Sildenafil",
    "Thalidomide",
    "Rapamycin",
    "Hydroxychloroquine",
    "Tamoxifen",
    "Valproic Acid",
    "Ketoconazole",
]


async def populate_single_drug(drug_name: str, workflow, cache: CacheManager) -> bool:
    """
    Populate cache for a single drug.

    Args:
        drug_name: Name of the drug
        workflow: Compiled LangGraph workflow
        cache: Cache manager instance

    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info(f"{'='*60}")
        logger.info(f"Processing: {drug_name}")
        logger.info(f"{'='*60}")

        # Check if already cached
        cached = await cache.get_cached_result(drug_name)
        if cached:
            logger.info(f"✓ {drug_name} already cached (skipping)")
            return True

        # Run workflow
        logger.info(f"Running workflow for {drug_name}...")
        result = await workflow.ainvoke({
            "drug_name": drug_name,
            "search_context": {},
            "session_id": f"cache-{drug_name.lower().replace(' ', '_')}"
        })

        # Cache the result
        await cache.cache_result(drug_name, result)

        # Log summary
        logger.info(f"✓ {drug_name} cached successfully")
        logger.info(f"  - Execution time: {result.get('execution_time', 0):.2f}s")
        logger.info(f"  - Evidence items: {len(result.get('all_evidence', []))}")
        logger.info(f"  - Indications found: {len(result.get('ranked_indications', []))}")

        if result.get('ranked_indications'):
            top_3 = result['ranked_indications'][:3]
            logger.info(f"  - Top opportunities:")
            for i, indication in enumerate(top_3, 1):
                logger.info(f"    {i}. {indication['indication']} (confidence: {indication['confidence_score']:.1f})")

        return True

    except Exception as e:
        logger.error(f"✗ Failed to cache {drug_name}: {e}", exc_info=True)
        return False


async def populate_all_drugs():
    """
    Populate cache for all demo drugs.
    """
    logger.info("=" * 60)
    logger.info("Drug Repurposing Platform - Cache Population")
    logger.info("=" * 60)
    logger.info(f"Total drugs to cache: {len(DEMO_DRUGS)}")
    logger.info("")

    # Initialize
    logger.info("Initializing workflow and cache manager...")
    workflow = get_workflow()
    cache = CacheManager()

    logger.info(f"Cache directory: {cache.cache_dir}")
    logger.info(f"Cache TTL: {cache.ttl.days} days")
    logger.info("")

    # Process each drug
    results = {
        "success": [],
        "failed": [],
        "skipped": []
    }

    for idx, drug_name in enumerate(DEMO_DRUGS, 1):
        logger.info(f"[{idx}/{len(DEMO_DRUGS)}] Processing {drug_name}...")

        success = await populate_single_drug(drug_name, workflow, cache)

        if success:
            results["success"].append(drug_name)
        else:
            results["failed"].append(drug_name)

        # Rate limiting: wait 5 seconds between drugs to respect API limits
        if idx < len(DEMO_DRUGS):
            logger.info("Waiting 5 seconds (rate limiting)...")
            await asyncio.sleep(5)

        logger.info("")

    # Print summary
    logger.info("=" * 60)
    logger.info("Cache Population Complete!")
    logger.info("=" * 60)
    logger.info(f"✓ Successfully cached: {len(results['success'])}")
    logger.info(f"✗ Failed: {len(results['failed'])}")

    if results["success"]:
        logger.info("\nSuccessfully cached drugs:")
        for drug in results["success"]:
            logger.info(f"  ✓ {drug}")

    if results["failed"]:
        logger.warning("\nFailed drugs:")
        for drug in results["failed"]:
            logger.warning(f"  ✗ {drug}")

    # Cache statistics
    stats = cache.get_cache_stats()
    logger.info(f"\nCache Statistics:")
    logger.info(f"  Total cached entries: {stats['total_entries']}")
    logger.info(f"  Cache directory: {stats['cache_dir']}")
    logger.info(f"  TTL: {stats['ttl_days']:.1f} days")

    logger.info("\n" + "=" * 60)
    logger.info("Ready for demo! 🚀")
    logger.info("=" * 60)


if __name__ == "__main__":
    try:
        asyncio.run(populate_all_drugs())
    except KeyboardInterrupt:
        logger.info("\nCache population interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\nCache population failed: {e}", exc_info=True)
        sys.exit(1)
