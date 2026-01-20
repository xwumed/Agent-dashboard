"""
Simplified tool wrappers for openai-agents SDK.
These are stateless versions that don't require MedicalContext.
"""
from typing import Optional

# Lazy imports - only load when actually used
_agents_available = False
_rag_available = False

try:
    from agents import function_tool
    _agents_available = True
except ImportError:
    # Create a no-op decorator if agents not available
    def function_tool(*args, **kwargs):
        def decorator(func):
            return func
        if args and callable(args[0]):
            return args[0]
        return decorator


def _get_rag_dependencies():
    """Lazy load RAG dependencies to avoid import errors at startup."""
    global _rag_available
    try:
        import chromadb
        # Try relative import first (when used as part of package)
        try:
            from .rag_common import run_vector_rag
            from .config_manager import (
                external_client,
                ESMO_STORAGE, NCCN_STORAGE, HEMA_STORAGE,
                ESMO_DB_STORAGE, NCCN_DB_STORAGE, HEMA_DB_STORAGE,
            )
        except ImportError:
            # Fallback for direct execution (shouldn't happen in package context)
            from rag_common import run_vector_rag
            from config_manager import (
                external_client,
                ESMO_STORAGE, NCCN_STORAGE, HEMA_STORAGE,
                ESMO_DB_STORAGE, NCCN_DB_STORAGE, HEMA_DB_STORAGE,
            )
        _rag_available = True
        return {
            'chromadb': chromadb,
            'run_vector_rag': run_vector_rag,
            'external_client': external_client,
            'ESMO_STORAGE': ESMO_STORAGE,
            'NCCN_STORAGE': NCCN_STORAGE,
            'HEMA_STORAGE': HEMA_STORAGE,
            'ESMO_DB_STORAGE': ESMO_DB_STORAGE,
            'NCCN_DB_STORAGE': NCCN_DB_STORAGE,
            'HEMA_DB_STORAGE': HEMA_DB_STORAGE,
        }
    except ImportError as e:
        return None


# ================================ RAG GUIDELINE TOOL ================================ #

@function_tool(name_override="rag_guideline")
def rag_guideline_tool(query: str, patient_context: str = "") -> str:
    """
    Retrieve relevant clinical guideline information from ESMO/NCCN/HEMA databases.
    
    Args:
        query: The specific medical question to search for
        patient_context: Optional patient history for context-aware retrieval
    
    Returns:
        Retrieved guideline excerpts with citations
    """
    deps = _get_rag_dependencies()
    if deps is None:
        return "RAG dependencies not available. Please check chromadb and config_manager are installed."
    
    try:
        chromadb = deps['chromadb']
        run_vector_rag = deps['run_vector_rag']
        external_client = deps['external_client']
        ESMO_STORAGE = deps['ESMO_STORAGE']
        NCCN_STORAGE = deps['NCCN_STORAGE']
        HEMA_STORAGE = deps['HEMA_STORAGE']
        ESMO_DB_STORAGE = deps['ESMO_DB_STORAGE']
        NCCN_DB_STORAGE = deps['NCCN_DB_STORAGE']
        HEMA_DB_STORAGE = deps['HEMA_DB_STORAGE']
        
        esmo_client = chromadb.PersistentClient(path=str(ESMO_DB_STORAGE))
        nccn_client = chromadb.PersistentClient(path=str(NCCN_DB_STORAGE))
        hema_client = chromadb.PersistentClient(path=str(HEMA_DB_STORAGE))
        
        esmo_collection = esmo_client.get_or_create_collection(name="medical_collection")
        nccn_collection = nccn_client.get_or_create_collection(name="medical_collection")
        hema_collection = hema_client.get_or_create_collection(name="medical_collection")

        def build_citation(md: dict) -> str:
            citation = md.get("pdf_name", "Unknown")
            section = md.get("section")
            if section:
                citation += f', section "{section}"'
            return citation

        def _pdf_id(name: str) -> str:
            low = name.lower()
            return name[:-4] if low.endswith(".pdf") else name

        sources = {
            "ESMO": {
                "label": "ESMO",
                "storage_dir": ESMO_STORAGE,
                "suffixes": [".pdf"],
                "collection": esmo_collection,
                "where_key": "pdf_name",
                "id_transform": _pdf_id,
                "citation_builder": build_citation,
                "n_results": 20,
            },
            "NCCN": {
                "label": "NCCN",
                "storage_dir": NCCN_STORAGE,
                "suffixes": [".pdf"],
                "collection": nccn_collection,
                "where_key": "pdf_name",
                "id_transform": _pdf_id,
                "citation_builder": build_citation,
                "n_results": 20,
            },
            "HEMA": {
                "label": "HEMA",
                "storage_dir": HEMA_STORAGE,
                "suffixes": [".pdf"],
                "collection": hema_collection,
                "where_key": "pdf_name",
                "id_transform": _pdf_id,
                "citation_builder": build_citation,
                "n_results": 20,
            },
        }

        return run_vector_rag(
            tool_name="rag_guideline",
            patient_history=patient_context,
            query=query,
            role_hint=None,
            external_client=external_client,
            sources=sources,
            role_templates={},
            n_results=20,
            top_k=10,
            score_threshold=0.6,
        )
    except Exception as e:
        return f"Error retrieving guidelines: {str(e)}"


# ================================ GENE SEARCH TOOL ================================ #

@function_tool(name_override="gene_search")
def gene_search_tool(genes: str) -> str:
    """
    Search CIViC and OncoKB databases for gene variant clinical evidence.
    
    Args:
        genes: Comma-separated list of gene names (e.g., "BRAF,KRAS,EGFR")
    
    Returns:
        Clinical evidence for the specified genes
    """
    try:
        from .gene_search import search_genes_batch
    except ImportError:
        from gene_search import search_genes_batch
    
    gene_list = [g.strip() for g in genes.split(",") if g.strip()]
    if not gene_list:
        return "No genes specified"
    
    try:
        results = search_genes_batch(gene_list)
        return results
    except Exception as e:
        return f"Error searching genes: {str(e)}"


# ================================ PUBMED TOOL ================================ #

@function_tool(name_override="pubmed_query")
def pubmed_query_tool(query: str, max_results: int = 5) -> str:
    """
    Search PubMed for relevant medical literature.
    
    Args:
        query: PubMed search query string
        max_results: Maximum number of results to return (default 5)
    
    Returns:
        Abstracts and citations from matching publications
    """
    try:
        from .pubmedv4 import search_pubmed
    except ImportError:
        from pubmedv4 import search_pubmed
    
    try:
        results = search_pubmed(query, max_results=max_results)
        return results
    except Exception as e:
        return f"Error searching PubMed: {str(e)}"


# ================================ TOOL REGISTRY ================================ #

TOOL_REGISTRY = {
    "rag_guideline": rag_guideline_tool,
    "rag_pathology": rag_guideline_tool,  # Fallback to guideline for now
    "rag_tool_who": rag_guideline_tool,   # Fallback
    "rag_staging_uicc": rag_guideline_tool,  # Fallback
    "genesearch_batch_tool": gene_search_tool,
    "pubmed_query": pubmed_query_tool,
    "web_search_tool": None,  # TODO: Implement web search
}


def get_tools_for_node(tool_ids: list[str]) -> list:
    """Get tool functions for the specified tool IDs."""
    tools = []
    for tool_id in tool_ids:
        tool = TOOL_REGISTRY.get(tool_id)
        if tool is not None:
            tools.append(tool)
    return tools
