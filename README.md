# <img src="client/public/seed_logo.jpeg" width="60" align="center" alt="SEED Logo" /> SEED: Scalable and Evaluation-Driven Multi-Agent Framework

**v2.0 (Python Backend)**

**SEED** is a state-of-the-art, visual multi-agent orchestration platform designed to streamline the construction, configuration, and execution of complex AI agent networks. Built with a focus on pharmaceutical R&D but adaptable to any domain, SEED empowers researchers to model intricate decision-making processes using a flexible graph-based interface.

This version leverages a high-performance **Python/FastAPI backend** to support asynchronous agent execution, batch processing, and seamless integration with the broader Python AI ecosystem.

## 🚀 Key Features

### 🧠 Visual Agent Orchestration
- **Graph-Based Editor**: Design complex workflows using an intuitive node-and-edge interface (powered by Vue Flow).
- **Flexible Topologies**: Create linear chains, hierarchical trees, or complex cyclic networks.
- **Rich Interaction Types**: Define how agents communicate (`Informs`, `Critiques`, `Validates`, `Collaborates`, `Reports To`).

### 📦 Comprehensive Template Management
- **Library System**: Save and load complete experimental setups from a persistent local library.
- **Metadata Tracking**: Automatically tracks agent count, model usage, and input types for every template.
- **Portable Experiments**: Import and export templates as JSON files to share with colleagues or version control.
- **State Persistence**: Global settings (Model, Temperature, Thinking Mode) are saved within templates, ensuring reproducibility.

### ⚡ Batch Processing & Input Handling
- **Batch Execution**: Run simulations across multiple input files simultaneously.
- **File & Folder Support**: Drag-and-drop support for individual text files or entire folders as input sources.
- **Persistent Outputs**: Simulation results are automatically saved as `.output` files alongside the source inputs, maintaining a clean audit trail.

### 🤖 Advanced Agent Configuration
- **Behavior Presets**: Quickly configure agents as `Analytical`, `Creative`, `Adversarial`, or `Balanced`.
- **Rogue Mode**: inject controlled failures (Hallucinations, Omissions, Contradictions) to stress-test your network's robustness.
- **Skills & Tools**: Equip agents with specialized capabilities (e.g., RAG tools, Web Search).
- **Oversight Roles**: Designate senior agents with "Suspicious" or "Trusting" oversight protocols.

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | **Vue 3** | Reactive, component-based UI framework. |
| | **TypeScript** | Ensures type safety and code reliability. |
| | **Vue Flow** | Powerful library for interactive graph visualization. |
| | **Tailwind CSS** | Utility-first styling for a modern, responsive design. |
| **Backend** | **Python 3.11+** | Core runtime environment. |
| | **FastAPI** | Modern, high-performance async web framework. |
| | **Pydantic** | Robust data validation and settings management. |
| | **OpenAI SDK** | Standardized interface for LLM calls (supports OpenAI, LocalAI, vLLM). |

## 📂 Project Structure

```bash
agentdashboardpy/
├── client/                      # Vue 3 Frontend
│   ├── src/
│   │   ├── components/          # UI Components (Canvas, Panels, Nodes)
│   │   ├── composables/         # Shared Logic (State Management)
│   │   ├── scenarios/           # Pre-built Medical R&D Scenarios
│   │   └── types/               # TypeScript Definitions
│   └── ...
├── server/                      # Python FastAPI Backend
│   ├── routes/                  # API Endpoints
│   │   ├── templates.py         # Template CRUD Operations
│   │   └── simulation.py        # Execution Triggers
│   ├── services/                # Business Logic
│   │   ├── orchestrator.py      # Async Graph Execution Engine
│   │   ├── batch_processor.py   # Bulk File Processing
│   │   └── template_store.py    # File-Based Persistence
│   ├── data/                    # Local Storage
│   │   └── templates/           # Saved JSON Templates
│   └── ...
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- **Python** 3.11+
- **Node.js** 18+ & **npm** 9+
- **OpenAI API Key** (or compatible local endpoint)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/KatherLab/agentdashboardpy.git
    cd agentdashboardpy
    ```

2.  **Backend Setup**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    pip install -r server/requirements.txt
    ```

3.  **Frontend Setup**
    ```bash
    cd client
    npm install
    cd ..
    ```

### Running the Application

Open two terminal windows:

**Terminal 1: Backend**
```bash
source venv/bin/activate
uvicorn server.main:app --reload --port 3006
# Swagger UI available at http://localhost:3006/docs
```

**Terminal 2: Frontend**
```bash
cd client
npm run dev
# Dashboard accessible at http://localhost:5173
```

## 🔌 API Reference

### Simulation
- `POST /api/simulate`: Trigger a single simulation run. Returns a streaming response (NDJSON).

### Templates
- `GET /api/templates`: List all templates with summary metadata.
- `GET /api/templates/{id}`: Retrieve full topology for a specific template.
- `POST /api/templates`: Save or update a template.
- `DELETE /api/templates/{id}`: Delete a template.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2026 Jakob Nikolas Kather (Kather Lab)
