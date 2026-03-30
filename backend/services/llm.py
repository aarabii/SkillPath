import json
import logging
import os
import time

from groq import Groq

logger = logging.getLogger("vidyamarg.llm")


class LLMError(Exception):
    pass


_api_key = os.getenv("GROQ_API_KEY", "")
if not _api_key:
    logger.warning("GROQ_API_KEY not set — LLM calls will fail")

client = Groq(api_key=_api_key)

MODEL = "groq/compound-mini"


def _parse_json(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    return json.loads(text)


def _call_groq(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int,
    temperature: float,
) -> str:
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = response.choices[0].message.content
        token_count = response.usage.total_tokens if response.usage else "?"
        logger.debug("Groq API call — tokens: %s", token_count)
        return content
    except Exception as exc:
        if hasattr(exc, "status_code") and getattr(exc, "status_code", 0) == 429:
            logger.warning("Groq rate limited — waiting 2s and retrying")
            time.sleep(2)
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        raise


GRAPH_SYSTEM_PROMPT = (
    "You are a curriculum designer and knowledge graph expert.\n"
    "Given a target skill, return a knowledge dependency graph as JSON.\n"
    "Return ONLY valid JSON. No explanation. No markdown. No code blocks.\n"
    "Just the raw JSON object."
)

GRAPH_USER_TEMPLATE = """Target skill: {skill}

Return a JSON object in exactly this format:
{{
  "nodes": [
    {{"id": "node_1", "label": "Concept Name", "description": "One sentence max"}}
  ],
  "edges": [
    {{"source": "node_1", "target": "node_2", "relation": "prerequisite"}}
  ]
}}

Rules:
- 8 to 15 nodes total
- Edges go FROM prerequisite TO dependent (you must know source before target)
- The target skill "{skill}" must appear as exactly one node
- No cycles — this must be a valid DAG
- Node ids must be strings like "node_1", "node_2", etc.
- Keep descriptions under 15 words
- Return only the JSON object, nothing else"""


def generate_graph(skill: str) -> dict:
    user_prompt = GRAPH_USER_TEMPLATE.format(skill=skill)
    logger.info("Generating graph for skill: %s", skill)

    for attempt in range(2):
        try:
            raw = _call_groq(
                system_prompt=GRAPH_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                max_tokens=2000,
                temperature=0.3,
            )
            data = _parse_json(raw)

            if "nodes" not in data or "edges" not in data:
                raise ValueError("Missing 'nodes' or 'edges' in LLM response")

            logger.info("Graph parsed: %d nodes, %d edges", len(data["nodes"]), len(data["edges"]))
            return data

        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(
                "Graph JSON parse failed (attempt %d/2): %s", attempt + 1, exc
            )
            if attempt == 1:
                logger.error("Graph generation failed after 2 attempts")
                raise LLMError("LLM service unavailable — malformed response") from exc

    raise LLMError("LLM service unavailable")


QUESTION_SYSTEM_PROMPT = (
    "You are an expert educator creating adaptive quiz questions.\n"
    "Return ONLY valid JSON. No explanation. No markdown. No code blocks."
)

QUESTION_USER_TEMPLATE = """Generate one multiple choice question to test if someone understands: {concept_label}
Context: {concept_description}

Return exactly this JSON format:
{{
  "question": "A clear, practical question about {concept_label}",
  "options": {{
    "A": "option text",
    "B": "option text",
    "C": "option text",
    "D": "option text"
  }},
  "correct": "B",
  "explanation": "One sentence explaining why the correct answer is right"
}}

Rules:
- Test understanding, not memorization
- Make wrong options plausible but clearly incorrect on reflection
- Question must be answerable without external resources
- Keep the question under 30 words
- Return only the JSON object, nothing else"""


def generate_question(concept_label: str, concept_description: str) -> dict:
    user_prompt = QUESTION_USER_TEMPLATE.format(
        concept_label=concept_label,
        concept_description=concept_description,
    )
    logger.info("Generating question for concept: %s", concept_label)

    for attempt in range(2):
        try:
            raw = _call_groq(
                system_prompt=QUESTION_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                max_tokens=500,
                temperature=0.5,
            )
            data = _parse_json(raw)

            required = {"question", "options", "correct", "explanation"}
            if not required.issubset(data.keys()):
                raise ValueError(f"Missing keys: {required - set(data.keys())}")

            logger.info("Question generated for: %s", concept_label)
            return data

        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(
                "Question JSON parse failed (attempt %d/2): %s", attempt + 1, exc
            )
            if attempt == 1:
                logger.error("Question generation failed after 2 attempts for: %s", concept_label)
                raise LLMError("LLM service unavailable — malformed response") from exc

    raise LLMError("LLM service unavailable")
