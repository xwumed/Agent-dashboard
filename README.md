# <img src="client/public/seed_logo.jpeg" width="60" align="center" alt="SEED Logo" /> SEED: Scalable and Evaluation-Driven Multi-Agent Framework

**v2.0 (Python Backend)**

SEED is a visual multi-agent orchestration platform designed for constructing, configuring, and executing networks of AI agents. Originally built for pharmaceutical R&D workflows, it provides a scalable, evaluation-driven environment for complex multi-agent reasoning tasks.

This version features a robust **Python/FastAPI backend** for improved performance, better async handling, and seamless integration with Python-based ML/AI tooling.

## Key Features

- **Visual Graph Editor**: Intuitive node-based interface for designing agent networks using Vue Flow.
- **Template Management**:
    - **Save/Load**: Persist complete experimental setups (nodes, edges, global settings) to the library.
    - **Import/Export**: Share templates as JSON files with colleagues.
    - **Global Persistence**: Automatically saves model selection, temperature, and thinking parameters.
- **Output Persistence**:
    - Automatically saves simulation results to `.output` files alongside source inputs.
    - Ensures reproducible research with file-based result tracking.
- **Configurable Agent Behaviors**: Analytical, creative, adversarial, or balanced presets.
- **Rich Relationship Types**: Define nuanced interactions (informs, critiques, validates, collaborates, reports-to).
- **Rogue Mode Testing**: Inject controlled failures (hallucination, omission) for stress-testing agent networks.
- **Parallel Execution**: Agents with no dependencies execute simultaneously using async Python.
- **Streaming Results**: Real-time NDJSON streaming of simulation progress with live status updates.

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Vue 3 | Reactive UI framework |
| TypeScript | Type safety & developer experience |
| Vite | High-performance build tool |
| Vue Flow | Graph visualization & interaction |
| Tailwind CSS | Utility-first styling |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Core runtime environment |
| FastAPI | Modern, high-performance async web framework |
| OpenAI SDK | LLM API integration (supports OpenAI, Local LLMs) |
| Pydantic | Data validation & serialization |
| Uvicorn | ASGI server |

## Project Structure

```
agentdashboardpy/
├── client/                      # Vue 3 frontend application
│   ├── src/
│   │   ├── components/          # Vue components (Canvas, Settings, etc.)
│   │   ├── composables/         # Vue composition logic (useTopology, etc.)
│   │   ├── scenarios/           # Pre-built scenarios
│   │   ├── types/               # TypeScript type definitions
│   │   └── App.vue              # Main application entry
│   └── ...
├── server/                      # Python FastAPI backend
│   ├── routes/
│   │   ├── templates.py         # Template management API
│   │   └── simulation.py        # Simulation execution API
│   ├── services/
│   │   ├── orchestrator.py      # Core topology execution engine
│   │   ├── template_store.py    # File-based template persistence
│   │   └── batch_processor.py   # Batch simulation logic
│   ├── models.py                # Pydantic data models
│   ├── main.py                  # FastAPI application entry point
│   └── requirements.txt
├── README.md
└── LICENSE
```

## Getting Started

### Prerequisites

- **Python** 3.11 or higher
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **OpenAI API key** (or compatible endpoint like LocalAI/vLLM)

### Installation

```bash
# Clone the repository
git clone https://github.com/KatherLab/agentdashboardpy.git
cd agentdashboardpy

# Set up Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r server/requirements.txt

# Install frontend dependencies
cd client
npm install
cd ..
```

### Development

Run both the frontend dev server and backend in separate terminals:

```bash
# Terminal 1: Start the Python backend
source venv/bin/activate
uvicorn server.main:app --reload --port 3006
# API Docs available at http://localhost:3006/docs

# Terminal 2: Start the frontend dev server
cd client
npm run dev
# Client runs on http://localhost:5173 (proxies /api to :3006)
```

### Production Build

```bash
# Build the frontend
cd client
npm run build
cd ..

# Start the production server (serves built client)
uvicorn server.main:app --host 0.0.0.0 --port 3006
```

## API Reference

### POST /api/simulate
Execute a simulation with an agent topology. Returns streaming NDJSON events.

### POST /api/templates
Save a new template to the library.

### GET /api/templates
List all available templates.

## Agent Configuration

| Property | Description | Options |
|----------|-------------|---------|
| **Behavior Preset** | Reasoning style | `analytical`, `creative`, `adversarial`, `balanced` |
| **Model** | LLM model to use | Supported models (GPT-4o, Local GLM, etc.) |
| **Temperature** | Response creativity | 0.0 - 2.0 |
| **Oversight Mode** | Senior reviewer capability | Boolean |
| **Suspicion Level** | Cross-checking behavior | `trusting`, `suspicious` |

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2026 Jakob Nikolas Kather (Kather Lab)
