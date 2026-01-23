"""
Abstract base class for all agents.
Defines common interface and functionality for data fetching and processing.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any
import time
from app.models.schemas import AgentResponse, EvidenceItem
from app.utils.logger import get_logger

logger = get_logger("agents")


class BaseAgent(ABC):
    """Abstract base class for all agents."""

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize agent.

        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        self.name = self.__class__.__name__
        self.cache_enabled = self.config.get("cache_enabled", True)
        self.logger = get_logger(f"agents.{self.name}")

    @abstractmethod
    async def fetch_data(self, drug_name: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fetch raw data from external API or data source.

        Args:
            drug_name: Name of the drug to search for
            context: Additional context for the search

        Returns:
            List of raw data dictionaries

        Raises:
            Exception: On fetch failure
        """
        pass

    @abstractmethod
    async def process_data(self, raw_data: List[Dict[str, Any]]) -> List[EvidenceItem]:
        """
        Process raw data into structured evidence items.

        Args:
            raw_data: List of raw data dictionaries from fetch_data

        Returns:
            List of processed EvidenceItem objects

        Raises:
            Exception: On processing failure
        """
        pass

    async def run(self, drug_name: str, context: Dict[str, Any] = None) -> AgentResponse:
        """
        Main execution method for the agent.
        Orchestrates fetching and processing of data.

        Args:
            drug_name: Name of the drug to search for
            context: Optional additional context

        Returns:
            AgentResponse with evidence items and execution metadata
        """
        context = context or {}
        start_time = time.time()

        self.logger.info(f"Running {self.name} for drug: {drug_name}")

        try:
            # Fetch raw data
            raw_data = await self.fetch_data(drug_name, context)
            self.logger.debug(f"{self.name} fetched {len(raw_data)} raw items")

            # Process into evidence items
            evidence = await self.process_data(raw_data)
            self.logger.info(f"{self.name} processed {len(evidence)} evidence items")

            execution_time = time.time() - start_time

            return AgentResponse(
                agent_name=self.name,
                status="success",
                evidence=evidence,
                metadata={
                    "raw_count": len(raw_data),
                    "processed_count": len(evidence),
                    "execution_time": execution_time
                },
                execution_time=execution_time
            )

        except Exception as e:
            execution_time = time.time() - start_time
            self.logger.error(f"{self.name} failed: {str(e)}", exc_info=True)

            return AgentResponse(
                agent_name=self.name,
                status="error",
                evidence=[],
                error=str(e),
                metadata={"execution_time": execution_time},
                execution_time=execution_time
            )

    def _extract_indication(self, text: str) -> str:
        """
        Extract disease/indication from text using simple keyword matching.
        Override in subclasses for more sophisticated extraction.

        Args:
            text: Text to extract indication from

        Returns:
            Extracted indication or "Unknown"
        """
        # Common disease keywords
        disease_keywords = [
            "diabetes", "cancer", "cardiovascular", "alzheimer", "parkinson",
            "hypertension", "obesity", "depression", "anxiety", "arthritis",
            "asthma", "copd", "epilepsy", "migraine", "schizophrenia",
            "bipolar", "multiple sclerosis", "crohn", "colitis", "psoriasis",
            "lupus", "fibromyalgia", "osteoporosis", "thyroid", "kidney",
            "liver", "heart", "stroke", "infection", "inflammation",
            "pain", "longevity", "aging", "metabolic syndrome"
        ]

        text_lower = text.lower()

        for keyword in disease_keywords:
            if keyword in text_lower:
                return keyword.title()

        return "Unknown Indication"

    def _sanitize_drug_name(self, drug_name: str) -> str:
        """
        Sanitize drug name for API queries.

        Args:
            drug_name: Raw drug name

        Returns:
            Sanitized drug name
        """
        # Remove special characters, keep alphanumeric and spaces
        sanitized = ''.join(c for c in drug_name if c.isalnum() or c.isspace())
        return sanitized.strip()

    def _truncate_text(self, text: str, max_length: int = 500) -> str:
        """
        Truncate text to maximum length with ellipsis.

        Args:
            text: Text to truncate
            max_length: Maximum length

        Returns:
            Truncated text
        """
        if len(text) <= max_length:
            return text
        return text[:max_length - 3] + "..."
