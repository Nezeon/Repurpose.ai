"""
Master Agent - Conversation Orchestrator for EY Techathon.

Interprets user queries, classifies intent, extracts entities,
routes to appropriate worker agents, and synthesizes responses.
"""

import json
import uuid
from typing import Dict, Any, List, Optional, Tuple
from app.llm.llm_factory import LLMFactory
from app.utils.logger import get_logger

logger = get_logger("agents.master")

# Intent types the Master Agent can detect
INTENTS = [
    "drug_analysis",       # Full drug repurposing analysis (triggers 15-agent pipeline)
    "market_query",        # Market size, CAGR, competitor data (IQVIA-style)
    "patent_lookup",       # Patent landscape, expiry, FTO
    "exim_data",           # Import-export trade data
    "clinical_trials",     # Clinical trial pipeline queries
    "web_search",          # Guidelines, news, RWE
    "file_summary",        # Summarize uploaded documents
    "comparison",          # Compare drugs, indications, or markets
    "general_question",    # General pharma knowledge
    "clarification_needed" # Ambiguous query needing clarification
]

# EY agent name mapping (internal → display)
EY_AGENT_NAMES = {
    "market": "IQVIA Insights Agent",
    "exim": "EXIM Trade Agent",
    "patent": "Patent Landscape Agent",
    "clinical_trials": "Clinical Trials Agent",
    "internal": "Internal Knowledge Agent",
    "web": "Web Intelligence Agent",
    "report": "Report Generator Agent",
    "pipeline": "Multi-Agent Pipeline",
}

INTENT_CLASSIFICATION_PROMPT = """You are the Master Agent (Conversation Orchestrator) for a pharmaceutical drug repurposing platform.

Your job is to interpret user queries and classify them so the system can route to the right worker agents.

Given the user's message and conversation history, output a JSON object with:
1. "intent": one of {intents}
2. "entities": extracted entities as object with optional keys:
   - "drug_names": list of drug names mentioned
   - "indications": list of diseases/indications mentioned
   - "regions": list of countries/regions mentioned
   - "time_period": time range if mentioned
   - "competitors": competitor drugs mentioned
3. "agents_needed": list of agent keys to invoke: {agent_keys}
4. "clarification_questions": list of questions if the query is ambiguous (empty list if clear)
5. "reasoning": brief explanation of why you classified this way

Rules:
- If user says "analyze [drug]" or "search [drug]" or "find repurposing opportunities for [drug]", intent is "drug_analysis"
- If user asks about market size, growth, CAGR, competition, or IQVIA-style data, intent is "market_query"
- If user asks about patents, IP, FTO, exclusivity, or biosimilar opportunity, intent is "patent_lookup"
- If user asks about import/export, EXIM, trade data, API sourcing, intent is "exim_data"
- If user asks about clinical trials, pipeline, ongoing studies, intent is "clinical_trials"
- If user asks about guidelines, news, publications, real-world evidence, intent is "web_search"
- If user asks to summarize a document or references uploaded files, intent is "file_summary"
- If user asks to compare drugs, markets, or indications, intent is "comparison"
- If query is too vague (e.g. "show me data" without specifying what), intent is "clarification_needed"
- For "comparison" intent, include all relevant agent keys

Conversation history:
{history}

User message: {message}

Respond with ONLY a valid JSON object, no markdown, no explanation outside the JSON."""

SYNTHESIS_PROMPT = """You are a senior pharmaceutical strategist. Synthesize the following data from multiple agents into a clear, actionable response for the user.

User's question: {question}

Data from agents:
{agent_data}

Instructions:
- Provide a clear, structured answer to the user's question
- Use specific numbers, names, and data points from the agent results
- If there are tables of data, describe the key takeaways
- Suggest 2-3 follow-up questions the user might want to ask
- Keep the response concise but data-rich (3-5 paragraphs max)
- If data is insufficient, say so and suggest what additional queries might help
- Write in a professional tone suitable for pharma business development

Respond in plain text (markdown formatting is OK). At the end, add a section "## Suggested Follow-ups" with 2-3 bullet points."""


class MasterAgent:
    """
    Conversation orchestrator that interprets user queries,
    routes to worker agents, and synthesizes responses.
    """

    def __init__(self):
        self.llm = None

    def _get_llm(self):
        if self.llm is None:
            self.llm = LLMFactory.get_llm()
        return self.llm

    async def interpret_query(
        self,
        message: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Interpret a user query and classify intent + extract entities.

        Returns dict with: intent, entities, agents_needed, clarification_questions, reasoning
        """
        llm = self._get_llm()
        if llm is None:
            return self._fallback_classify(message)

        # Format conversation history
        history_text = "No previous messages."
        if conversation_history:
            history_lines = []
            for msg in conversation_history[-6:]:  # Last 6 messages for context
                role = msg.get("role", "user")
                content = msg.get("content", "")[:200]
                history_lines.append(f"{role}: {content}")
            history_text = "\n".join(history_lines)

        prompt = INTENT_CLASSIFICATION_PROMPT.format(
            intents=json.dumps(INTENTS),
            agent_keys=json.dumps(list(EY_AGENT_NAMES.keys())),
            history=history_text,
            message=message
        )

        try:
            response = await llm.generate(prompt)
            # Parse JSON from response (handle markdown code blocks)
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("```")[1]
                if json_str.startswith("json"):
                    json_str = json_str[4:]
            json_str = json_str.strip()
            result = json.loads(json_str)

            # Validate required fields
            if "intent" not in result:
                result["intent"] = "general_question"
            if "entities" not in result:
                result["entities"] = {}
            if "agents_needed" not in result:
                result["agents_needed"] = self._default_agents_for_intent(result["intent"])
            if "clarification_questions" not in result:
                result["clarification_questions"] = []

            return result

        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"LLM classification failed, using fallback: {e}")
            return self._fallback_classify(message)

    def _fallback_classify(self, message: str) -> Dict[str, Any]:
        """Rule-based fallback when LLM is unavailable."""
        msg = message.lower().strip()
        entities = {"drug_names": [], "indications": [], "regions": []}

        # Simple keyword-based intent detection
        if any(kw in msg for kw in ["analyze", "search", "repurpos", "find opportunities", "find indications"]):
            intent = "drug_analysis"
            agents = ["pipeline"]
        elif any(kw in msg for kw in ["market", "iqvia", "cagr", "growth", "market size", "sales"]):
            intent = "market_query"
            agents = ["market"]
        elif any(kw in msg for kw in ["patent", "ip ", "fto", "exclusiv", "biosimilar", "uspto"]):
            intent = "patent_lookup"
            agents = ["patent"]
        elif any(kw in msg for kw in ["exim", "export", "import", "trade", "sourcing"]):
            intent = "exim_data"
            agents = ["exim"]
        elif any(kw in msg for kw in ["trial", "clinical", "pipeline", "phase ", "ongoing stud"]):
            intent = "clinical_trials"
            agents = ["clinical_trials"]
        elif any(kw in msg for kw in ["guideline", "news", "publication", "real-world", "rwe"]):
            intent = "web_search"
            agents = ["web"]
        elif any(kw in msg for kw in ["summarize", "upload", "document", "pdf", "file"]):
            intent = "file_summary"
            agents = ["internal"]
        elif any(kw in msg for kw in ["compare", "versus", " vs ", "difference between"]):
            intent = "comparison"
            agents = ["market", "clinical_trials", "patent"]
        else:
            intent = "general_question"
            agents = ["web"]

        # Extract drug names (simple pattern: capitalize words that might be drug names)
        common_drugs = [
            "metformin", "sildenafil", "aspirin", "ibuprofen", "atorvastatin",
            "omeprazole", "amlodipine", "lisinopril", "metoprolol", "simvastatin",
            "losartan", "gabapentin", "sertraline", "montelukast", "pantoprazole",
            "thalidomide", "minoxidil", "adalimumab", "pembrolizumab", "semaglutide",
            "keytruda", "humira", "ozempic", "mounjaro", "wegovy", "dupixent",
            "rituximab", "trastuzumab", "bevacizumab", "nivolumab", "paclitaxel",
        ]
        for drug in common_drugs:
            if drug in msg:
                entities["drug_names"].append(drug.capitalize())

        return {
            "intent": intent,
            "entities": entities,
            "agents_needed": agents,
            "clarification_questions": [],
            "reasoning": "Keyword-based classification (LLM unavailable)"
        }

    def _default_agents_for_intent(self, intent: str) -> List[str]:
        """Get default agent list for an intent."""
        mapping = {
            "drug_analysis": ["pipeline"],
            "market_query": ["market"],
            "patent_lookup": ["patent"],
            "exim_data": ["exim"],
            "clinical_trials": ["clinical_trials"],
            "web_search": ["web"],
            "file_summary": ["internal"],
            "comparison": ["market", "clinical_trials", "patent"],
            "general_question": ["web"],
            "clarification_needed": [],
        }
        return mapping.get(intent, ["web"])

    async def execute_agents(
        self,
        intent: str,
        entities: Dict[str, Any],
        agents_needed: List[str],
        message: str,
        uploaded_file_ids: List[str] = None
    ) -> Dict[str, Any]:
        """
        Execute the appropriate worker agents based on intent and entities.

        Returns dict of agent_key → result data.
        """
        results = {}

        for agent_key in agents_needed:
            try:
                if agent_key == "pipeline":
                    results["pipeline"] = await self._run_drug_pipeline(entities)
                elif agent_key == "market":
                    results["market"] = await self._run_market_agent(entities, message)
                elif agent_key == "exim":
                    results["exim"] = await self._run_exim_agent(entities, message)
                elif agent_key == "patent":
                    results["patent"] = await self._run_patent_agent(entities, message)
                elif agent_key == "clinical_trials":
                    results["clinical_trials"] = await self._run_clinical_trials_agent(entities, message)
                elif agent_key == "web":
                    results["web"] = await self._run_web_agent(entities, message)
                elif agent_key == "internal":
                    results["internal"] = await self._run_internal_agent(entities, message, uploaded_file_ids)
                elif agent_key == "report":
                    results["report"] = await self._run_report_agent(entities, results)
            except Exception as e:
                logger.error(f"Agent {agent_key} failed: {e}", exc_info=True)
                results[agent_key] = {"error": str(e), "status": "error"}

        return results

    async def synthesize_response(
        self,
        message: str,
        intent: str,
        agent_results: Dict[str, Any],
        entities: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesize agent results into a final user-facing response.

        Returns dict with: content, tables, charts, pdf_url, suggestions
        """
        llm = self._get_llm()

        # Collect tables and charts from agent results
        tables = []
        charts = []
        pdf_url = None

        for key, result in agent_results.items():
            if isinstance(result, dict):
                if "tables" in result:
                    tables.extend(result["tables"])
                if "charts" in result:
                    charts.extend(result["charts"])
                if "pdf_url" in result:
                    pdf_url = result["pdf_url"]

        # Build agent data summary for LLM
        agent_data_parts = []
        for key, result in agent_results.items():
            agent_name = EY_AGENT_NAMES.get(key, key)
            if isinstance(result, dict) and "error" not in result:
                # Summarize the result for the LLM
                summary = result.get("summary", "")
                if not summary and "data" in result:
                    summary = json.dumps(result["data"], indent=2, default=str)[:2000]
                elif not summary:
                    summary = json.dumps(result, indent=2, default=str)[:2000]
                agent_data_parts.append(f"### {agent_name}\n{summary}")
            elif isinstance(result, dict) and "error" in result:
                agent_data_parts.append(f"### {agent_name}\nError: {result['error']}")

        agent_data_text = "\n\n".join(agent_data_parts) if agent_data_parts else "No agent data collected."

        # Generate synthesis with LLM
        suggestions = []
        if llm:
            try:
                prompt = SYNTHESIS_PROMPT.format(
                    question=message,
                    agent_data=agent_data_text
                )
                response_text = await llm.generate(prompt)

                # Extract suggestions from response
                if "## Suggested Follow-ups" in response_text:
                    parts = response_text.split("## Suggested Follow-ups")
                    content = parts[0].strip()
                    suggestion_text = parts[1].strip()
                    for line in suggestion_text.split("\n"):
                        line = line.strip().lstrip("-•* ")
                        if line and len(line) > 5:
                            suggestions.append(line)
                else:
                    content = response_text.strip()
            except Exception as e:
                logger.error(f"Synthesis failed: {e}")
                content = agent_data_text
        else:
            content = agent_data_text

        if not suggestions:
            suggestions = self._generate_default_suggestions(intent, entities)

        return {
            "content": content,
            "tables": tables,
            "charts": charts,
            "pdf_url": pdf_url,
            "suggestions": suggestions[:3],
        }

    def _generate_default_suggestions(self, intent: str, entities: Dict) -> List[str]:
        """Generate default follow-up suggestions based on intent."""
        drug_names = entities.get("drug_names", [])
        drug = drug_names[0] if drug_names else "the drug"

        suggestion_map = {
            "drug_analysis": [
                f"What is the patent landscape for {drug}?",
                f"Show EXIM trade data for {drug}",
                f"Generate a detailed PDF report for {drug}",
            ],
            "market_query": [
                "Which segments have the highest unmet need?",
                f"What clinical trials are ongoing in this space?",
                "Show the competitive filing heatmap",
            ],
            "patent_lookup": [
                "Are there any biosimilar opportunities?",
                f"What is the EXIM trend for {drug}?",
                "Show ongoing clinical trials for this molecule",
            ],
            "exim_data": [
                "Which countries are the top exporters?",
                f"What is the patent status for {drug}?",
                "Show market growth trends for this molecule",
            ],
            "clinical_trials": [
                "What are the Phase 3 trials?",
                "Which sponsors are most active?",
                "Show patent expiry timelines for competing drugs",
            ],
        }
        return suggestion_map.get(intent, [
            "Analyze a specific drug for repurposing opportunities",
            "Show market data for a therapeutic area",
            "Check the patent landscape for a molecule",
        ])

    # =====================================================
    # Worker Agent Runners
    # =====================================================

    async def _run_drug_pipeline(self, entities: Dict) -> Dict:
        """Trigger the full 15-agent drug analysis pipeline with 4D scoring."""
        drug_names = entities.get("drug_names", [])
        if not drug_names:
            return {
                "summary": "No drug name detected. Please specify a drug to analyze.",
                "status": "needs_input"
            }

        drug_name = drug_names[0]

        try:
            from app.graph.workflow import get_workflow
            workflow = get_workflow()

            session_id = f"chat-{uuid.uuid4().hex[:8]}"
            initial_state = {
                "drug_name": drug_name,
                "search_context": {},
                "session_id": session_id,
            }

            result = await workflow.ainvoke(initial_state)

            # Extract key data for chat response
            enhanced = result.get("enhanced_indications", [])
            synthesis = result.get("synthesis", "")
            evidence_count = len(result.get("all_evidence", []))

            # Build summary tables with 4D scoring dimensions
            tables = []
            charts = []

            if enhanced:
                rows = []
                chart_labels = []
                chart_scores = []

                for ind in enhanced[:10]:
                    score_data = ind.get("composite_score") if isinstance(ind, dict) else getattr(ind, "composite_score", None)
                    if score_data is None:
                        continue

                    # Handle both dict and Pydantic model
                    if isinstance(score_data, dict):
                        overall = score_data.get("overall_score", 0)
                        confidence = score_data.get("confidence_level", "N/A")
                        sci = score_data.get("scientific_evidence", {}).get("score", 0)
                        mkt = score_data.get("market_opportunity", {}).get("score", 0)
                        comp = score_data.get("competitive_landscape", {}).get("score", 0)
                        feas = score_data.get("development_feasibility", {}).get("score", 0)
                    else:
                        overall = getattr(score_data, "overall_score", 0)
                        confidence = getattr(score_data, "confidence_level", "N/A")
                        sci = getattr(getattr(score_data, "scientific_evidence", None), "score", 0)
                        mkt = getattr(getattr(score_data, "market_opportunity", None), "score", 0)
                        comp = getattr(getattr(score_data, "competitive_landscape", None), "score", 0)
                        feas = getattr(getattr(score_data, "development_feasibility", None), "score", 0)

                    indication_name = ind.get("indication", "Unknown") if isinstance(ind, dict) else getattr(ind, "indication", "Unknown")
                    ev_count = ind.get("evidence_count", 0) if isinstance(ind, dict) else getattr(ind, "evidence_count", 0)

                    rows.append({
                        "#": len(rows) + 1,
                        "Indication": indication_name,
                        "Score": f"{overall:.1f}",
                        "Scientific": f"{sci:.0f}",
                        "Market": f"{mkt:.0f}",
                        "Competition": f"{comp:.0f}",
                        "Feasibility": f"{feas:.0f}",
                        "Confidence": str(confidence).replace("_", " ").title(),
                        "Evidence": ev_count,
                    })

                    if len(chart_labels) < 6:
                        chart_labels.append(indication_name[:18])
                        chart_scores.append(round(overall, 1))

                if rows:
                    tables.append({
                        "title": f"Top Repurposing Opportunities for {drug_name}",
                        "columns": [
                            {"key": "#", "label": "#"},
                            {"key": "Indication", "label": "Indication"},
                            {"key": "Score", "label": "Score"},
                            {"key": "Scientific", "label": "Scientific"},
                            {"key": "Market", "label": "Market"},
                            {"key": "Competition", "label": "Competition"},
                            {"key": "Feasibility", "label": "Feasibility"},
                            {"key": "Confidence", "label": "Confidence"},
                            {"key": "Evidence", "label": "Evidence"},
                        ],
                        "rows": rows,
                    })

                if chart_labels:
                    charts.append({
                        "title": f"Opportunity Scores — {drug_name}",
                        "type": "bar",
                        "labels": chart_labels,
                        "datasets": [{"label": "Overall Score", "data": chart_scores}],
                    })

            # Run decision rules engine on pipeline results
            try:
                from app.decision.rules_engine import RulesEngine
                rules = RulesEngine()
                enhanced_opps = result.get("enhanced_opportunities", {})

                opportunity_flags = []
                for indication_name, opp_data in enhanced_opps.items():
                    market_data = {}
                    segment = getattr(opp_data, "market_segment", None)
                    if segment:
                        market_data = {
                            "unmet_need_score": getattr(segment, "unmet_need_score", 50) or 50,
                            "market_size_billions": 10,
                            "patient_population_millions": 50,
                        }

                    detected = rules.analyze(
                        market_data=market_data or None,
                        trial_data={"trial_count": 5},
                        drug_name=drug_name,
                        indication=indication_name,
                    )

                    for d in detected:
                        opportunity_flags.append(
                            f"**{d['title']}** ({d['confidence']}): {d['reasoning'][:150]}"
                        )

                if opportunity_flags:
                    synthesis += "\n\n### Decision Intelligence Flags\n" + "\n".join(f"- {f}" for f in opportunity_flags[:5])
            except Exception as e:
                logger.warning(f"Decision rules engine failed: {e}")

            return {
                "summary": synthesis or f"Analysis complete for {drug_name}. Found {len(enhanced)} opportunities from {evidence_count} evidence items.",
                "data": {
                    "drug_name": drug_name,
                    "opportunities": len(enhanced),
                    "evidence_count": evidence_count,
                },
                "tables": tables,
                "charts": charts,
                "full_results": result,
                "status": "success",
            }

        except Exception as e:
            logger.error(f"Drug pipeline failed: {e}", exc_info=True)
            return {"summary": f"Analysis failed: {str(e)}", "status": "error", "error": str(e)}

    async def _run_market_agent(self, entities: Dict, message: str) -> Dict:
        """Run IQVIA Insights (market data) agent."""
        try:
            from app.market.market_analyzer import MarketAnalyzer
            from app.market.segment_analyzer import MarketSegmentAnalyzer
            from app.market.competitor_tracker import CompetitorTracker

            analyzer = MarketAnalyzer()
            segment_analyzer = MarketSegmentAnalyzer()

            indications = entities.get("indications", [])
            drug_names = entities.get("drug_names", [])
            drug = drug_names[0] if drug_names else "Unknown"

            if not indications:
                # Try to extract from message
                indications = self._extract_therapeutic_areas(message)

            tables = []
            charts = []
            summaries = []

            for indication in indications[:5]:
                market_data_obj = await analyzer.analyze_market(indication, drug)
                market_data = market_data_obj.to_dict() if hasattr(market_data_obj, 'to_dict') else (market_data_obj if isinstance(market_data_obj, dict) else {})
                segment = await segment_analyzer.identify_segment(indication)

                mkt_size_b = round(market_data.get('estimated_market_size_usd', 0) / 1_000_000_000, 1)
                summaries.append(
                    f"**{indication}**: Market size ${mkt_size_b}B, "
                    f"CAGR {market_data.get('cagr_percent', 0)}%, "
                    f"Unmet Need: {market_data.get('unmet_need_score', 0)}/100"
                )

            if indications:
                # Build market comparison table
                rows = []
                chart_labels = []
                chart_sizes = []
                chart_cagrs = []

                for indication in indications[:5]:
                    market_data_obj = await analyzer.analyze_market(indication, drug)
                    market_data = market_data_obj.to_dict() if hasattr(market_data_obj, 'to_dict') else (market_data_obj if isinstance(market_data_obj, dict) else {})
                    mkt_size_b = round(market_data.get('estimated_market_size_usd', 0) / 1_000_000_000, 1)
                    rows.append({
                        "indication": indication,
                        "market_size": f"${mkt_size_b}B",
                        "cagr": f"{market_data.get('cagr_percent', 0)}%",
                        "patients": f"{round(market_data.get('patient_population_global', 0) / 1_000_000, 1)}M",
                        "unmet_need": f"{market_data.get('unmet_need_score', 0)}/100",
                        "pricing": f"{market_data.get('potential_price_premium', 1.0)}x",
                    })
                    chart_labels.append(indication[:20])
                    chart_sizes.append(mkt_size_b)
                    chart_cagrs.append(market_data.get("cagr_percent", 0))

                tables.append({
                    "title": "Market Overview",
                    "columns": [
                        {"key": "indication", "label": "Indication"},
                        {"key": "market_size", "label": "Market Size"},
                        {"key": "cagr", "label": "CAGR"},
                        {"key": "patients", "label": "Patients"},
                        {"key": "unmet_need", "label": "Unmet Need"},
                        {"key": "pricing", "label": "Pricing"},
                    ],
                    "rows": rows
                })

                charts.append({
                    "chart_type": "bar",
                    "title": "Market Size Comparison ($B)",
                    "labels": chart_labels,
                    "datasets": [
                        {"label": "Market Size ($B)", "data": chart_sizes, "color": "#00D4AA"},
                        {"label": "CAGR (%)", "data": chart_cagrs, "color": "#FFE600"},
                    ]
                })

            return {
                "summary": "\n".join(summaries) if summaries else "No market data found for the specified indications.",
                "tables": tables,
                "charts": charts,
                "status": "success"
            }

        except Exception as e:
            logger.error(f"Market agent failed: {e}", exc_info=True)
            return {"summary": f"Market analysis failed: {str(e)}", "status": "error", "error": str(e)}

    async def _run_exim_agent(self, entities: Dict, message: str) -> Dict:
        """Run EXIM Trade Agent with mock data."""
        try:
            from app.agents.exim_agent import EXIMAgent
            agent = EXIMAgent()

            drug_names = entities.get("drug_names", [])
            drug = drug_names[0] if drug_names else None

            if not drug:
                # Try to extract from message
                drug = self._extract_drug_from_message(message)

            result = await agent.get_trade_data(drug or "Metformin")
            return result

        except Exception as e:
            logger.error(f"EXIM agent failed: {e}", exc_info=True)
            return {"summary": f"EXIM data lookup failed: {str(e)}", "status": "error", "error": str(e)}

    async def _run_patent_agent(self, entities: Dict, message: str) -> Dict:
        """Run Patent Landscape Agent (USPTO PatentsView)."""
        try:
            from app.agents.patent_agent import PatentAgent
            agent = PatentAgent()

            drug_names = entities.get("drug_names", [])
            drug = drug_names[0] if drug_names else self._extract_drug_from_message(message)

            if not drug:
                return {"summary": "No drug specified for patent lookup.", "status": "needs_input"}

            # Use the rich get_patent_landscape method (tables, charts, FTO, expiry)
            result = await agent.get_patent_landscape(drug)
            return result

        except Exception as e:
            logger.error(f"Patent agent failed: {e}", exc_info=True)
            return {"summary": f"Patent lookup failed: {str(e)}", "status": "error", "error": str(e)}

    async def _run_clinical_trials_agent(self, entities: Dict, message: str) -> Dict:
        """Run Clinical Trials Agent."""
        try:
            from app.agents.clinical_trials_agent import ClinicalTrialsAgent
            agent = ClinicalTrialsAgent()

            drug_names = entities.get("drug_names", [])
            drug = drug_names[0] if drug_names else self._extract_drug_from_message(message)

            if not drug:
                return {"summary": "No drug specified for clinical trial search.", "status": "needs_input"}

            response = await agent.run(drug, {})

            tables = []
            if response and response.evidence:
                rows = []
                for ev in response.evidence[:15]:
                    meta = ev.metadata or {}
                    rows.append({
                        "title": (ev.title or ev.summary or "")[:50],
                        "phase": meta.get("phase", "N/A"),
                        "status": meta.get("status", "N/A"),
                        "indication": (ev.indication or "N/A")[:30],
                        "date": ev.date or "N/A",
                    })
                if rows:
                    tables.append({
                        "title": f"Clinical Trials for {drug}",
                        "columns": [
                            {"key": "title", "label": "Trial"},
                            {"key": "phase", "label": "Phase"},
                            {"key": "status", "label": "Status"},
                            {"key": "indication", "label": "Indication"},
                            {"key": "date", "label": "Date"},
                        ],
                        "rows": rows
                    })

            evidence_count = len(response.evidence) if response else 0
            return {
                "summary": f"Found {evidence_count} clinical trials for {drug}.",
                "tables": tables,
                "status": "success"
            }

        except Exception as e:
            logger.error(f"Clinical trials agent failed: {e}", exc_info=True)
            return {"summary": f"Clinical trials search failed: {str(e)}", "status": "error", "error": str(e)}

    async def _run_web_agent(self, entities: Dict, message: str) -> Dict:
        """Run Web Intelligence Agent."""
        try:
            from app.agents.web_intelligence_agent import WebIntelligenceAgent
            agent = WebIntelligenceAgent()
            result = await agent.search(message, entities)
            return result
        except Exception as e:
            logger.error(f"Web agent failed: {e}", exc_info=True)
            return {"summary": f"Web search failed: {str(e)}", "status": "error", "error": str(e)}

    async def _run_internal_agent(self, entities: Dict, message: str, file_ids: List[str] = None) -> Dict:
        """Run Internal Knowledge Agent."""
        try:
            from app.vector_store import get_knowledge_base
            kb = get_knowledge_base()

            drug_names = entities.get("drug_names", [])
            indications = entities.get("indications", [])

            query = message
            if drug_names:
                query = f"{drug_names[0]} {query}"

            results = kb.query(query, n_results=5)

            summaries = []
            for doc in results:
                if isinstance(doc, dict):
                    summaries.append(doc.get("document", doc.get("content", ""))[:200])
                elif isinstance(doc, str):
                    summaries.append(doc[:200])

            return {
                "summary": "\n\n".join(summaries) if summaries else "No relevant internal documents found.",
                "status": "success"
            }

        except Exception as e:
            logger.error(f"Internal agent failed: {e}", exc_info=True)
            return {"summary": f"Internal search failed: {str(e)}", "status": "error", "error": str(e)}

    async def _run_report_agent(self, entities: Dict, collected_results: Dict) -> Dict:
        """Generate a PDF report from collected results."""
        # This will be wired to the existing PDF generation pipeline
        return {
            "summary": "Report generation will be integrated with the existing PDF pipeline.",
            "status": "pending"
        }

    # =====================================================
    # Utility methods
    # =====================================================

    def _extract_therapeutic_areas(self, message: str) -> List[str]:
        """Extract therapeutic areas from a message using keyword matching."""
        areas = {
            "oncology": "Cancer", "cancer": "Cancer", "tumor": "Cancer",
            "diabetes": "Type 2 Diabetes", "metabolic": "Type 2 Diabetes",
            "cardiovascular": "Cardiovascular Disease", "heart": "Heart Failure",
            "respiratory": "Asthma", "lung": "Lung Cancer", "copd": "COPD",
            "neurolog": "Alzheimer", "alzheimer": "Alzheimer", "parkinson": "Parkinson",
            "depression": "Depression", "psychiatr": "Depression",
            "autoimmune": "Rheumatoid Arthritis", "arthritis": "Rheumatoid Arthritis",
            "immunolog": "Rheumatoid Arthritis",
            "obesity": "Obesity", "nash": "NASH", "liver": "NASH",
            "infectious": "HIV", "hiv": "HIV",
            "rare disease": "Rare Disease", "orphan": "Rare Disease",
        }

        found = []
        msg = message.lower()
        for keyword, area in areas.items():
            if keyword in msg and area not in found:
                found.append(area)

        return found if found else ["Cancer", "Type 2 Diabetes", "Cardiovascular Disease"]

    def _extract_drug_from_message(self, message: str) -> Optional[str]:
        """Try to extract a drug name from the message text."""
        common_drugs = [
            "metformin", "sildenafil", "aspirin", "ibuprofen", "atorvastatin",
            "omeprazole", "amlodipine", "lisinopril", "metoprolol", "simvastatin",
            "losartan", "gabapentin", "sertraline", "thalidomide", "minoxidil",
            "adalimumab", "pembrolizumab", "semaglutide", "rituximab",
            "trastuzumab", "bevacizumab", "nivolumab", "paclitaxel",
            "keytruda", "humira", "ozempic", "mounjaro", "wegovy",
        ]
        msg = message.lower()
        for drug in common_drugs:
            if drug in msg:
                return drug.capitalize()
        return None
