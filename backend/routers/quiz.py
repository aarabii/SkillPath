import logging

from fastapi import APIRouter, HTTPException

from db.supabase import (
    get_graph,
    create_quiz_state,
    get_quiz_state,
    update_quiz_state,
    store_quiz_result,
    DBError,
)
from models.schemas import (
    QuizStartRequest,
    QuizStartResponse,
    QuizAnswerRequest,
    QuizAnswerResponse,
    QuestionSchema,
)
from services.graph_engine import build_graph
from services.llm import generate_question, LLMError
from services.quiz_engine import get_next_concept

logger = logging.getLogger("skillpath.routers.quiz")

router = APIRouter(prefix="/quiz", tags=["quiz"])


def _make_question(
    concept_id: str,
    concept_label: str,
    concept_description: str,
    total_nodes: int,
    assessed_count: int,
) -> tuple[QuestionSchema, str]:
    q = generate_question(concept_label, concept_description)
    schema = QuestionSchema(
        question=q["question"],
        options=q["options"],
        correct=q["correct"],
        explanation=q["explanation"],
        concept_id=concept_id,
        concept_label=concept_label,
        progress={"assessed": assessed_count, "total": total_nodes},
    )
    return schema, q["correct"]


@router.post("/start", response_model=QuizStartResponse)
async def start_quiz(body: QuizStartRequest):
    session_id = body.session_id

    try:
        graph_data = get_graph(session_id)
    except DBError as exc:
        logger.error("DB error fetching graph: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    nodes = graph_data["nodes"]
    edges = graph_data["edges"]
    graph = build_graph(nodes, edges)

    try:
        create_quiz_state(session_id)
    except DBError as exc:
        logger.error("DB error creating quiz state: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    first_concept = get_next_concept(graph, assessed=[], known=[])
    if first_concept is None:
        raise HTTPException(
            status_code=422,
            detail={"detail": "Graph has no assessable concepts", "code": "EMPTY_GRAPH"},
        )

    attrs = graph.nodes[first_concept]
    label = attrs.get("label", first_concept)
    description = attrs.get("description", "")

    try:
        question, correct_answer = _make_question(
            first_concept, label, description,
            total_nodes=graph.number_of_nodes(),
            assessed_count=0,
        )
    except LLMError as exc:
        logger.error("LLM error generating question: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "GROQ_ERROR"})

    try:
        update_quiz_state(
            session_id,
            assessed=[],
            known=[],
            unknown=[],
            completed=False,
            current_correct=correct_answer,
        )
    except DBError as exc:
        logger.error("DB error updating current_correct: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    logger.info("Quiz started — session_id=%s, first_concept=%s", session_id, first_concept)
    return QuizStartResponse(question=question)


@router.post("/answer", response_model=QuizAnswerResponse)
async def answer_question(body: QuizAnswerRequest):
    session_id = body.session_id
    concept_id = body.concept_id
    user_answer = body.answer

    try:
        state = get_quiz_state(session_id)
        graph_data = get_graph(session_id)
    except DBError as exc:
        logger.error("DB error: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    nodes = graph_data["nodes"]
    edges = graph_data["edges"]
    graph = build_graph(nodes, edges)

    assessed = list(state.get("assessed_concepts", []))
    known = list(state.get("known_concepts", []))
    unknown = list(state.get("unknown_concepts", []))
    stored_correct = state.get("current_correct", "")

    is_correct = user_answer.strip().upper() == stored_correct.strip().upper()

    attrs = graph.nodes.get(concept_id, {})
    concept_label = attrs.get("label", concept_id)

    try:
        store_quiz_result(
            session_id=session_id,
            concept_id=concept_id,
            question=state.get("current_correct", ""),
            user_answer=user_answer,
            correct=is_correct,
        )
    except DBError as exc:
        logger.error("DB error storing quiz result: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    if concept_id not in assessed:
        assessed.append(concept_id)
    if is_correct:
        if concept_id not in known:
            known.append(concept_id)
    else:
        if concept_id not in unknown:
            unknown.append(concept_id)

    next_concept = get_next_concept(graph, assessed, known)

    if next_concept is not None:
        next_attrs = graph.nodes[next_concept]
        next_label = next_attrs.get("label", next_concept)
        next_description = next_attrs.get("description", "")

        try:
            next_question, next_correct = _make_question(
                next_concept, next_label, next_description,
                total_nodes=graph.number_of_nodes(),
                assessed_count=len(assessed),
            )
        except LLMError as exc:
            logger.error("LLM error generating next question: %s", exc)
            raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "GROQ_ERROR"})

        try:
            update_quiz_state(session_id, assessed, known, unknown, completed=False, current_correct=next_correct)
        except DBError as exc:
            logger.error("DB error updating quiz state: %s", exc)
            raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

        explanation = f"The correct answer was {stored_correct}."
        if is_correct:
            explanation = f"Correct! The answer is {stored_correct}."

        return QuizAnswerResponse(
            correct=is_correct,
            explanation=explanation,
            next_question=next_question,
            quiz_complete=False,
        )

    else:
        try:
            update_quiz_state(session_id, assessed, known, unknown, completed=True, current_correct="")
        except DBError as exc:
            logger.error("DB error finalising quiz state: %s", exc)
            raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

        explanation = f"The correct answer was {stored_correct}."
        if is_correct:
            explanation = f"Correct! The answer is {stored_correct}."

        logger.info(
            "Quiz complete — session_id=%s, known=%d, unknown=%d",
            session_id, len(known), len(unknown),
        )
        return QuizAnswerResponse(
            correct=is_correct,
            explanation=explanation,
            next_question=None,
            quiz_complete=True,
            known_count=len(known),
            unknown_count=len(unknown),
        )
