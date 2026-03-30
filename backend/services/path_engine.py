import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import networkx as nx

from db.supabase import get_cached_resources, store_cached_resources

logger = logging.getLogger("vidyamarg.path_engine")

def search_web_google(query: str, max_results: int = 5) -> list[dict]:
    results = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36"
    }
    url = f"https://www.google.com/search?q={quote_plus(query)}&num={max_results+2}" # Request a couple extra to ensure we get 5 valid links
    try:
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, "html.parser")
        for g in soup.find_all('div', class_='g'):
            anchors = g.find_all('a')
            if anchors:
                link = anchors[0]['href']
                title_elem = g.find('h3')

                if title_elem and link and link.startswith('http'):
                    results.append({
                        "title": title_elem.text,
                        "url": link
                    })
            if len(results) >= max_results:
                break
    except Exception as e:
        logger.warning("Google search failed for query '%s': %s", query, str(e))
    return results

def get_resources(concept_label: str) -> list[dict]:
    key = concept_label.strip()

    # 1. Check Database Cache
    cached = get_cached_resources(key)
    if cached:
        logger.info("Cache hit for concept resources: '%s'", key)
        return cached

    # 2. Perform Live Searches using Google
    results = search_web_google(f"learn {key}", max_results=5)

    # 3. Store Database Cache
    if results:
        store_cached_resources(key, results)

    # 4. Deterministic Fallbacks if network search utterly fails
    if not results:
        base_url = "https://www.google.com/search?q="
        results = [
            {"title": f"Learn {key} - Beginner Tutorial", "url": f"{base_url}{quote_plus('learn ' + key + ' beginner tutorial')}"},
            {"title": f"{key} Official Documentation", "url": f"{base_url}{quote_plus(key + ' official documentation')}"},
            {"title": f"Best {key} Courses", "url": f"{base_url}{quote_plus('best ' + key + ' courses')}"},
            {"title": f"{key} Examples & Use Cases", "url": f"{base_url}{quote_plus(key + ' examples use cases')}"},
            {"title": f"{key} Interview Questions", "url": f"{base_url}{quote_plus(key + ' interview questions')}"},
        ]

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
