import logging

from fastapi import APIRouter, HTTPException

from db.supabase import create_session, store_graph, get_graph as db_get_graph, get_session, DBError
from models.schemas import GraphRequest, GraphResponse
from services.graph_engine import build_graph, validate_dag
from services.llm import generate_graph, LLMError

logger = logging.getLogger("skillpath.routers.graph")

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/{session_id}", response_model=GraphResponse)
async def get_graph(session_id: str):
    try:
        session = get_session(session_id)
    except DBError:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        graph_data = db_get_graph(session_id)
    except DBError:
        raise HTTPException(status_code=404, detail="Graph not found for this session")

    return GraphResponse(
        session_id=session_id,
        nodes=graph_data["nodes"],
        edges=graph_data["edges"],
    )


@router.post("", response_model=GraphResponse)
async def create_graph(body: GraphRequest):
    skill = body.skill

    try:
        raw = generate_graph(skill)
    except LLMError as exc:
        logger.error("LLM failed for skill=%s: %s", skill, exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "GROQ_ERROR"})

    nodes = raw["nodes"]
    edges = raw["edges"]

    graph = build_graph(nodes, edges)
    if not validate_dag(graph):
        raise HTTPException(
            status_code=422,
            detail={"detail": "Generated graph contains cycles", "code": "CYCLE_DETECTED"},
        )

    try:
        session_id = create_session(skill)
        store_graph(session_id, nodes, edges)
    except DBError as exc:
        logger.error("DB error: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    logger.info("Graph created — session_id=%s, nodes=%d", session_id, len(nodes))
    return GraphResponse(session_id=session_id, nodes=nodes, edges=edges)
