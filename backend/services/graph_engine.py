import logging

import networkx as nx

logger = logging.getLogger("skillpath.graph_engine")


def build_graph(nodes: list[dict], edges: list[dict]) -> nx.DiGraph:
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
    is_valid = nx.is_directed_acyclic_graph(graph)
    if not is_valid:
        cycles = list(nx.simple_cycles(graph))
        logger.warning("Graph has cycles: %s", cycles)
    else:
        logger.debug("DAG validation passed")
    return is_valid


def get_leaf_nodes(graph: nx.DiGraph) -> list[str]:
    leaves = [n for n in graph.nodes() if graph.in_degree(n) == 0]
    logger.debug("Leaf nodes (in_degree=0): %s", leaves)
    return leaves


def get_target_node(graph: nx.DiGraph, target_skill: str) -> str | None:
    target_lower = target_skill.lower()
    for node_id, attrs in graph.nodes(data=True):
        if attrs.get("label", "").lower() == target_lower:
            logger.debug("Target node found: %s (%s)", node_id, attrs["label"])
            return node_id
    logger.warning("Target node not found for skill: %s", target_skill)
    return None


def serialize_graph(graph: nx.DiGraph) -> dict:
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
