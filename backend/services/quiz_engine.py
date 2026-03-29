"""
SkillPath — Quiz Engine (Section 7 of architecture.txt)
BFS-driven adaptive quiz traversal with skip logic.
"""

import logging
from collections import deque

import networkx as nx

logger = logging.getLogger("skillpath.quiz_engine")


def should_skip(graph: nx.DiGraph, concept_id: str, known: list[str]) -> bool:
    """Check if a concept can be skipped.

    A concept is skippable if ALL of its successors (dependents) are in the
    known list — meaning the user demonstrably knows the things that depend
    on this concept, so they almost certainly know it too.

    Leaf-successor nodes (nodes with no successors themselves) are never
    auto-skipped — they must be assessed directly.
    """
    successors = list(graph.successors(concept_id))

    # If no successors, cannot infer knowledge — must assess
    if not successors:
        return False

    # Skip only if ALL successors are known
    skip = all(s in known for s in successors)
    if skip:
        logger.debug("Skipping concept %s — all successors known: %s", concept_id, successors)
    return skip


def get_next_concept(
    graph: nx.DiGraph,
    assessed: list[str],
    known: list[str],
) -> str | None:
    """BFS from leaf nodes to find the next unassessed concept.

    - Starts from foundational nodes (in_degree == 0)
    - Skips already assessed concepts
    - Applies skip logic: if all successors of a concept are known,
      the concept is auto-skipped
    - Returns next concept_id to ask about, or None if quiz is complete
    """
    # BFS starting points: leaf nodes (no prerequisites)
    leaves = [n for n in graph.nodes() if graph.in_degree(n) == 0]

    visited = set()
    queue = deque(leaves)

    while queue:
        concept_id = queue.popleft()

        if concept_id in visited:
            continue
        visited.add(concept_id)

        # Already assessed → move on
        if concept_id in assessed:
            # Enqueue successors for further traversal
            for successor in graph.successors(concept_id):
                if successor not in visited:
                    queue.append(successor)
            continue

        # Check skip logic
        if should_skip(graph, concept_id, known):
            logger.debug("BFS skip: %s (auto-skipped)", concept_id)
            # Treat as assessed+known for traversal purposes
            for successor in graph.successors(concept_id):
                if successor not in visited:
                    queue.append(successor)
            continue

        # This is the next concept to assess
        logger.debug("BFS next concept: %s", concept_id)
        return concept_id

    # All concepts have been assessed or skipped
    logger.debug("BFS complete — no more concepts to assess")
    return None


def is_quiz_complete(
    graph: nx.DiGraph,
    assessed: list[str],
    known: list[str],
) -> bool:
    """Check if all non-skippable nodes have been assessed.

    Returns True if the quiz is done.
    """
    for node_id in graph.nodes():
        if node_id in assessed:
            continue
        if should_skip(graph, node_id, known):
            continue
        # Found an unassessed, non-skippable node
        return False
    return True
