"""Tool definitions and registry for Agent Dashboard"""
from dataclasses import dataclass
from typing import Optional, List


@dataclass
class ToolDefinition:
    """Definition of an available tool"""
    id: str
    name: str
    description: str
    category: str
    requires_api_key: Optional[str] = None  # e.g., "ONCOKB_TOKEN", "TAVILY_API_KEY"


# Available tools registry
AVAILABLE_TOOLS: List[ToolDefinition] = [
    # RAG Tools
    ToolDefinition(
        id="rag_guideline",
        name="RAG Guidelines",
        description="Retrieve ESMO/NCCN/HEMA clinical guideline documents",
        category="RAG",
    ),
    ToolDefinition(
        id="rag_pathology",
        name="Pathology RAG",
        description="Retrieve pathology reference documents",
        category="RAG",
    ),
    ToolDefinition(
        id="rag_tool_who",
        name="WHO Classification",
        description="Retrieve WHO disease classification standards",
        category="RAG",
    ),
    ToolDefinition(
        id="rag_staging_uicc",
        name="UICC Staging",
        description="Retrieve UICC TNM staging criteria",
        category="RAG",
    ),
    # Gene Search Tools
    ToolDefinition(
        id="genesearch_batch_tool",
        name="Gene Search",
        description="Query CIViC and OncoKB databases for gene variant clinical evidence",
        category="Gene",
        requires_api_key="ONCOKB_TOKEN",
    ),
    # Literature Tools
    ToolDefinition(
        id="pubmed_query",
        name="PubMed Search",
        description="Search PubMed medical literature abstracts",
        category="Literature",
        requires_api_key="PUBMED_API_KEY",
    ),
    # Web Tools
    ToolDefinition(
        id="web_search_tool",
        name="Web Search",
        description="Perform web search using Tavily",
        category="Web",
        requires_api_key="TAVILY_API_KEY",
    ),
]


def get_tool_by_id(tool_id: str) -> Optional[ToolDefinition]:
    """Get a tool definition by its ID"""
    return next((t for t in AVAILABLE_TOOLS if t.id == tool_id), None)


def get_tools_by_category(category: str) -> List[ToolDefinition]:
    """Get all tools in a category"""
    return [t for t in AVAILABLE_TOOLS if t.category == category]
