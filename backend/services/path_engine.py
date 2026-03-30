import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import networkx as nx

from db.supabase import get_cached_resources, store_cached_resources

logger = logging.getLogger("skillpath.path_engine")

from duckduckgo_search import DDGS

def search_web_duckduckgo(query: str, max_results: int = 5) -> list[dict]:
    results = []
    try:
        with DDGS() as ddgs:
            ddg_results = ddgs.text(query, max_results=max_results)
            if ddg_results:
                for r in ddg_results:
                    href = r.get("href", "")
                    title = r.get("title", href)
                    if href:
                        results.append({"title": title, "url": href})
    except Exception as e:
        logger.warning("DuckDuckGo search failed for query '%s': %s", query, str(e))
    return results

def get_resources(concept_label: str) -> list[dict]:
    key = concept_label.strip()
    
    # 1. Check Database Cache
    cached = get_cached_resources(key)
    if cached:
        logger.info("Cache hit for concept resources: '%s'", key)
        return cached

    # 2. Perform Live Searches using DuckDuckGo
    results = search_web_duckduckgo(f"learn {key}", max_results=5)

    # 3. Store Database Cache
    if results:
        store_cached_resources(key, results)

    # 4. Deterministic Fallbacks if network search utterly fails
    if not results:
        results.append({"title": f"{key} Search", "url": f"https://www.google.com/search?q={quote_plus(key)}"})
    
    return results


def compute_full_path(
    graph: nx.DiGraph,
    target_node_id: str,
) -> list[str]:
    ancestors = nx.ancestors(graph, target_node_id)
    ancestors.add(target_node_id)

    path_nodes = list(ancestors)

    topo_order = list(nx.topological_sort(graph))
    topo_index = {node: i for i, node in enumerate(topo_order)}
    path_nodes.sort(key=lambda n: topo_index.get(n, 0))

    logger.info(
        "Full path computed: %d concepts total for target %s",
        len(path_nodes), target_node_id,
    )
    logger.debug("Path order: %s", path_nodes)
    return path_nodes
