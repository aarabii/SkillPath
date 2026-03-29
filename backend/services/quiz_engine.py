import logging
from collections import deque

import networkx as nx

logger = logging.getLogger("skillpath.quiz_engine")


def should_skip(graph: nx.DiGraph, concept_id: str, known: list[str]) -> bool:
    successors = list(graph.successors(concept_id))

    if not successors:
        return False

    skip = all(s in known for s in successors)
    if skip:
        logger.debug("Skipping concept %s — all successors known: %s", concept_id, successors)
    return skip


def get_next_concept(
    graph: nx.DiGraph,
    assessed: list[str],
    known: list[str],
) -> str | None:
    leaves = [n for n in graph.nodes() if graph.in_degree(n) == 0]

    visited = set()
    queue = deque(leaves)

    while queue:
        concept_id = queue.popleft()

        if concept_id in visited:
            continue
        visited.add(concept_id)

        if concept_id in assessed:
            for successor in graph.successors(concept_id):
                if successor not in visited:
                    queue.append(successor)
            continue

        if should_skip(graph, concept_id, known):
            logger.debug("BFS skip: %s (auto-skipped)", concept_id)
            for successor in graph.successors(concept_id):
                if successor not in visited:
                    queue.append(successor)
            continue

        logger.debug("BFS next concept: %s", concept_id)
        return concept_id

    logger.debug("BFS complete — no more concepts to assess")
    return None


def is_quiz_complete(
    graph: nx.DiGraph,
    assessed: list[str],
    known: list[str],
) -> bool:
    for node_id in graph.nodes():
        if node_id in assessed:
            continue
        if should_skip(graph, node_id, known):
            continue
        return False
    return True
