import logging
from urllib.parse import quote_plus

import networkx as nx

logger = logging.getLogger("skillpath.path_engine")


RESOURCE_MAP: dict[str, dict] = {
    "linear algebra": {
        "title": "Essence of Linear Algebra — 3Blue1Brown",
        "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab",
        "type": "video",
        "estimated_minutes": 120,
    },
    "python basics": {
        "title": "Python Official Tutorial",
        "url": "https://docs.python.org/3/tutorial/",
        "type": "doc",
        "estimated_minutes": 180,
    },
    "calculus": {
        "title": "Essence of Calculus — 3Blue1Brown",
        "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr",
        "type": "video",
        "estimated_minutes": 180,
    },
    "probability": {
        "title": "Khan Academy — Probability",
        "url": "https://www.khanacademy.org/math/statistics-probability/probability-library",
        "type": "article",
        "estimated_minutes": 90,
    },
    "statistics": {
        "title": "Khan Academy — Statistics",
        "url": "https://www.khanacademy.org/math/statistics-probability",
        "type": "article",
        "estimated_minutes": 120,
    },
    "neural networks": {
        "title": "Neural Networks — 3Blue1Brown",
        "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi",
        "type": "video",
        "estimated_minutes": 60,
    },
    "machine learning": {
        "title": "Stanford CS229 — Machine Learning",
        "url": "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU",
        "type": "video",
        "estimated_minutes": 300,
    },
    "deep learning": {
        "title": "Deep Learning Specialization — Andrew Ng",
        "url": "https://www.coursera.org/specializations/deep-learning",
        "type": "video",
        "estimated_minutes": 600,
    },
    "docker": {
        "title": "Docker Official Getting Started",
        "url": "https://docs.docker.com/get-started/",
        "type": "doc",
        "estimated_minutes": 60,
    },
    "sql": {
        "title": "SQLBolt — Interactive SQL Lessons",
        "url": "https://sqlbolt.com/",
        "type": "article",
        "estimated_minutes": 90,
    },
    "git": {
        "title": "Git — Official Book",
        "url": "https://git-scm.com/book/en/v2",
        "type": "doc",
        "estimated_minutes": 120,
    },
}


def get_resource(concept_label: str) -> dict:
    key = concept_label.lower().strip()

    if key in RESOURCE_MAP:
        logger.debug("Resource found in map: %s", key)
        return RESOURCE_MAP[key]

    for map_key, resource in RESOURCE_MAP.items():
        if map_key in key or key in map_key:
            logger.debug("Resource partial match: '%s' → '%s'", key, map_key)
            return resource

    encoded = quote_plus(concept_label)

    if any(kw in key for kw in ("basics", "introduction", "fundamental")):
        logger.debug("Resource heuristic: Khan Academy for '%s'", concept_label)
        return {
            "title": f"Khan Academy — {concept_label}",
            "url": f"https://www.khanacademy.org/search?referer=%2F&page_search_query={encoded}",
            "type": "article",
            "estimated_minutes": 30,
        }

    if any(kw in key for kw in ("python", "javascript", "typescript", "programming", "code", "api")):
        logger.debug("Resource heuristic: docs for '%s'", concept_label)
        return {
            "title": f"Official Documentation — {concept_label}",
            "url": f"https://www.google.com/search?q={encoded}+official+documentation",
            "type": "doc",
            "estimated_minutes": 45,
        }

    logger.debug("Resource heuristic: YouTube search for '%s'", concept_label)
    return {
        "title": f"YouTube — {concept_label}",
        "url": f"https://www.youtube.com/results?search_query={encoded}+tutorial",
        "type": "video",
        "estimated_minutes": 20,
    }


def compute_minimal_path(
    graph: nx.DiGraph,
    unknown_concepts: list[str],
    target_node_id: str,
) -> list[str]:
    ancestors = nx.ancestors(graph, target_node_id)
    ancestors.add(target_node_id)

    path_nodes = [c for c in unknown_concepts if c in ancestors]

    if target_node_id in unknown_concepts and target_node_id not in path_nodes:
        path_nodes.append(target_node_id)

    topo_order = list(nx.topological_sort(graph))
    topo_index = {node: i for i, node in enumerate(topo_order)}
    path_nodes.sort(key=lambda n: topo_index.get(n, 0))

    logger.info(
        "Minimal path computed: %d concepts to learn (out of %d unknown)",
        len(path_nodes), len(unknown_concepts),
    )
    logger.debug("Path order: %s", path_nodes)
    return path_nodes
