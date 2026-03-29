import logging
import os

from supabase import create_client, Client

logger = logging.getLogger("skillpath.db")


class DBError(Exception):
    pass


_url: str = os.getenv("SUPABASE_URL", "")
_key: str = os.getenv("SUPABASE_ANON_KEY", "")

if not _url or not _key:
    logger.warning("SUPABASE_URL or SUPABASE_ANON_KEY not set — DB calls will fail")

supabase: Client = create_client(_url, _key)


def create_session(target_skill: str) -> str:
    try:
        result = supabase.table("sessions").insert({"target_skill": target_skill}).execute()
        session_id = result.data[0]["id"]
        logger.info("Session %s created for skill: %s", session_id, target_skill)
        logger.debug("DB INSERT sessions — target_skill=%s", target_skill)
        return session_id
    except Exception as exc:
        logger.error("Failed to create session: %s", exc, exc_info=True)
        raise DBError(f"Failed to create session: {exc}") from exc


def get_session(session_id: str) -> dict:
    try:
        result = (
            supabase.table("sessions")
            .select("*")
            .eq("id", session_id)
            .single()
            .execute()
        )
        logger.debug("DB SELECT sessions — id=%s", session_id)
        return result.data
    except Exception as exc:
        logger.error("Failed to get session: %s", exc, exc_info=True)
        raise DBError(f"Failed to get session: {exc}") from exc


def store_graph(session_id: str, nodes: list, edges: list) -> str:
    try:
        result = (
            supabase.table("graphs")
            .insert({"session_id": session_id, "nodes": nodes, "edges": edges})
            .execute()
        )
        graph_id = result.data[0]["id"]
        logger.debug("DB INSERT graphs — session_id=%s", session_id)
        return graph_id
    except Exception as exc:
        logger.error("Failed to store graph: %s", exc, exc_info=True)
        raise DBError(f"Failed to store graph: {exc}") from exc


def get_graph(session_id: str) -> dict:
    try:
        result = (
            supabase.table("graphs")
            .select("nodes, edges")
            .eq("session_id", session_id)
            .single()
            .execute()
        )
        logger.debug("DB SELECT graphs — session_id=%s", session_id)
        return result.data
    except Exception as exc:
        logger.error("Failed to get graph: %s", exc, exc_info=True)
        raise DBError(f"Failed to get graph: {exc}") from exc


def create_quiz_state(session_id: str) -> str:
    try:
        result = (
            supabase.table("quiz_state")
            .insert({
                "session_id": session_id,
                "assessed_concepts": [],
                "known_concepts": [],
                "unknown_concepts": [],
                "completed": False,
                "current_correct": "",
            })
            .execute()
        )
        state_id = result.data[0]["id"]
        logger.debug("DB INSERT quiz_state — session_id=%s", session_id)
        return state_id
    except Exception as exc:
        logger.error("Failed to create quiz state: %s", exc, exc_info=True)
        raise DBError(f"Failed to create quiz state: {exc}") from exc


def get_quiz_state(session_id: str) -> dict:
    try:
        result = (
            supabase.table("quiz_state")
            .select("*")
            .eq("session_id", session_id)
            .single()
            .execute()
        )
        logger.debug("DB SELECT quiz_state — session_id=%s", session_id)
        return result.data
    except Exception as exc:
        logger.error("Failed to get quiz state: %s", exc, exc_info=True)
        raise DBError(f"Failed to get quiz state: {exc}") from exc


def update_quiz_state(
    session_id: str,
    assessed: list,
    known: list,
    unknown: list,
    completed: bool,
    current_correct: str = "",
) -> None:
    try:
        (
            supabase.table("quiz_state")
            .update({
                "assessed_concepts": assessed,
                "known_concepts": known,
                "unknown_concepts": unknown,
                "completed": completed,
                "current_correct": current_correct,
            })
            .eq("session_id", session_id)
            .execute()
        )
        logger.debug(
            "DB UPDATE quiz_state — session_id=%s, assessed=%d, known=%d, unknown=%d",
            session_id, len(assessed), len(known), len(unknown),
        )
    except Exception as exc:
        logger.error("Failed to update quiz state: %s", exc, exc_info=True)
        raise DBError(f"Failed to update quiz state: {exc}") from exc


def store_quiz_result(
    session_id: str,
    concept_id: str,
    question: str,
    user_answer: str,
    correct: bool,
) -> None:
    try:
        supabase.table("quiz_results").insert({
            "session_id": session_id,
            "concept_id": concept_id,
            "question": question,
            "user_answer": user_answer,
            "correct": correct,
        }).execute()
        logger.debug("DB INSERT quiz_results — session_id=%s, concept_id=%s", session_id, concept_id)
    except Exception as exc:
        logger.error("Failed to store quiz result: %s", exc, exc_info=True)
        raise DBError(f"Failed to store quiz result: {exc}") from exc


def store_path(session_id: str, steps: list) -> str:
    try:
        result = (
            supabase.table("paths")
            .insert({"session_id": session_id, "steps": steps})
            .execute()
        )
        path_id = result.data[0]["id"]
        logger.debug("DB INSERT paths — session_id=%s", session_id)
        return path_id
    except Exception as exc:
        logger.error("Failed to store path: %s", exc, exc_info=True)
        raise DBError(f"Failed to store path: {exc}") from exc


def get_path(session_id: str) -> dict:
    try:
        result = (
            supabase.table("paths")
            .select("steps")
            .eq("session_id", session_id)
            .single()
            .execute()
        )
        logger.debug("DB SELECT paths — session_id=%s", session_id)
        return result.data
    except Exception as exc:
        logger.error("Failed to get path: %s", exc, exc_info=True)
        raise DBError(f"Failed to get path: {exc}") from exc


def get_path_if_exists(session_id: str) -> dict | None:
    """Return the stored path row or *None* if no path exists yet."""
    try:
        result = (
            supabase.table("paths")
            .select("steps")
            .eq("session_id", session_id)
            .maybe_single()
            .execute()
        )
        logger.debug("DB SELECT paths (maybe) — session_id=%s", session_id)
        return result.data  # None when no row matched
    except Exception as exc:
        logger.error("Failed to check path: %s", exc, exc_info=True)
        raise DBError(f"Failed to check path: {exc}") from exc

