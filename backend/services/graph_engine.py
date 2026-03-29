"""
SkillPath — Graph Engine (Section 7 of architecture.txt)
NetworkX DAG construction, validation, and utility functions.
"""

import logging

import networkx as nx

logger = logging.getLogger("skillpath.graph_engine")


def build_graph(nodes: list[dict], edges: list[dict]) -> nx.DiGraph:
    """Build a NetworkX DiGraph from node/edge lists.

    Nodes: [{"id": "node_1", "label": "...", "description": "..."}]
    Edges: [{"source": "node_1", "target": "node_2", "relation": "prerequisite"}]

    Edge direction: source → target means source is prerequisite of target.
    """
    G = nx.DiGraph()

    for node in nodes:
        G.add_node(node["id"], label=node["label"], description=node["description"])
        logger.debug("Added node: %s (%s)", node["id"], node["label"])

    for edge in edges:
        G.add_edge(edge["source"], edge["target"], relation=edge.get("relation", "prerequisite"))
        logger.debug("Added edge: %s → %s", edge["source"], edge["target"])

    logger.info("Graph built: %d nodes, %d edges", G.number_of_nodes(), G.number_of_edges())
    return G


def validate_dag(graph: nx.DiGraph) -> bool:
    """Return True if the graph is a valid DAG (no cycles)."""
    is_valid = nx.is_directed_acyclic_graph(graph)
    if not is_valid:
        cycles = list(nx.simple_cycles(graph))
        logger.warning("Graph has cycles: %s", cycles)
    else:
        logger.debug("DAG validation passed")
    return is_valid


def get_leaf_nodes(graph: nx.DiGraph) -> list[str]:
    """Return node IDs with in_degree == 0 (foundational / no prerequisites).

    These are the BFS starting points for the quiz.
    """
    leaves = [n for n in graph.nodes() if graph.in_degree(n) == 0]
    logger.debug("Leaf nodes (in_degree=0): %s", leaves)
    return leaves


def get_target_node(graph: nx.DiGraph, target_skill: str) -> str | None:
    """Find the node whose label matches target_skill (case-insensitive).

    Returns node ID or None if not found.
    """
    target_lower = target_skill.lower()
    for node_id, attrs in graph.nodes(data=True):
        if attrs.get("label", "").lower() == target_lower:
            logger.debug("Target node found: %s (%s)", node_id, attrs["label"])
            return node_id
    logger.warning("Target node not found for skill: %s", target_skill)
    return None


def serialize_graph(graph: nx.DiGraph) -> dict:
    """Convert NetworkX DiGraph back to the nodes/edges JSON format.

    Returns: {"nodes": [...], "edges": [...]}
    """
    nodes = []
    for node_id, attrs in graph.nodes(data=True):
        nodes.append({
            "id": node_id,
            "label": attrs.get("label", ""),
            "description": attrs.get("description", ""),
        })

    edges = []
    for source, target, attrs in graph.edges(data=True):
        edges.append({
            "source": source,
            "target": target,
            "relation": attrs.get("relation", "prerequisite"),
        })

    logger.debug("Graph serialised: %d nodes, %d edges", len(nodes), len(edges))
    return {"nodes": nodes, "edges": edges}
