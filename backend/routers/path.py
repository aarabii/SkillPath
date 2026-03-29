import logging

from fastapi import APIRouter, HTTPException

from db.supabase import get_session, get_quiz_state, get_graph, store_path, get_path_if_exists, DBError
from models.schemas import PathRequest, PathResponse, PathStepSchema
from services.graph_engine import build_graph, get_target_node
from services.path_engine import compute_minimal_path, get_resource

logger = logging.getLogger("skillpath.routers.path")

router = APIRouter(prefix="/path", tags=["path"])


# ---------------------------------------------------------------------------
# Shared helper: compute a path from quiz state + graph, store it, return it
# ---------------------------------------------------------------------------

def _compute_and_store_path(session_id: str) -> PathResponse:
    """Run the full path computation pipeline and persist the result."""
    try:
        session = get_session(session_id)
        state = get_quiz_state(session_id)
        graph_data = get_graph(session_id)
    except DBError as exc:
        logger.error("DB error: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    target_skill = session["target_skill"]
    known = list(state.get("known_concepts", []))
    unknown = list(state.get("unknown_concepts", []))

    nodes = graph_data["nodes"]
    edges = graph_data["edges"]
    graph = build_graph(nodes, edges)

    total_concepts = graph.number_of_nodes()

    target_node_id = get_target_node(graph, target_skill)
    if target_node_id is None:
        raise HTTPException(
            status_code=422,
            detail={
                "detail": f"Target skill '{target_skill}' not found in graph",
                "code": "TARGET_NOT_FOUND",
            },
        )

    path_node_ids = compute_minimal_path(graph, unknown, target_node_id)

    steps: list[PathStepSchema] = []
    for order, node_id in enumerate(path_node_ids, start=1):
        attrs = graph.nodes[node_id]
        label = attrs.get("label", node_id)

        successors = list(graph.successors(node_id))
        if successors:
            dependent_label = graph.nodes[successors[0]].get("label", successors[0])
            reason = f"Required for {dependent_label}"
        else:
            reason = "Target skill"

        resource = get_resource(label)

        steps.append(PathStepSchema(
            order=order,
            concept_id=node_id,
            concept_label=label,
            reason=reason,
            resource_title=resource["title"],
            resource_url=resource["url"],
            resource_type=resource["type"],
            estimated_minutes=resource["estimated_minutes"],
        ))

    concepts_known = len(known)
    concepts_to_learn = len(steps)
    reduction_percentage = round((concepts_known / total_concepts) * 100, 1) if total_concepts > 0 else 0.0

    try:
        store_path(session_id, [s.model_dump() for s in steps])
    except DBError as exc:
        logger.error("DB error storing path: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    logger.info(
        "Path created — session_id=%s, steps=%d, reduction=%.1f%%",
        session_id, len(steps), reduction_percentage,
    )
    return PathResponse(
        session_id=session_id,
        total_concepts_in_graph=total_concepts,
        concepts_already_known=concepts_known,
        concepts_to_learn=concepts_to_learn,
        reduction_percentage=reduction_percentage,
        steps=steps,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=PathResponse)
async def create_path(body: PathRequest):
    return _compute_and_store_path(body.session_id)


@router.get("/{session_id}", response_model=PathResponse)
async def get_path(session_id: str):
    """Return an existing path if cached, otherwise compute and store it."""

    # 1. Check if a path already exists in the DB
    try:
        existing = get_path_if_exists(session_id)
    except DBError as exc:
        logger.error("DB error checking path: %s", exc)
        raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

    if existing is not None:
        # Reconstruct the full PathResponse from the stored steps
        steps_raw = existing["steps"]
        steps = [PathStepSchema(**s) for s in steps_raw]

        try:
            session = get_session(session_id)
            state = get_quiz_state(session_id)
            graph_data = get_graph(session_id)
        except DBError as exc:
            logger.error("DB error: %s", exc)
            raise HTTPException(status_code=500, detail={"detail": str(exc), "code": "DB_ERROR"})

        graph = build_graph(graph_data["nodes"], graph_data["edges"])
        total_concepts = graph.number_of_nodes()
        concepts_known = len(list(state.get("known_concepts", [])))
        reduction_percentage = round((concepts_known / total_concepts) * 100, 1) if total_concepts > 0 else 0.0

        logger.info("Path cache hit — session_id=%s", session_id)
        return PathResponse(
            session_id=session_id,
            total_concepts_in_graph=total_concepts,
            concepts_already_known=concepts_known,
            concepts_to_learn=len(steps),
            reduction_percentage=reduction_percentage,
            steps=steps,
        )

    # 2. No cached path — compute from scratch
    logger.info("Path cache miss — computing for session_id=%s", session_id)
    return _compute_and_store_path(session_id)

