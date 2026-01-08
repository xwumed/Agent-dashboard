# Agent Dashboard (Python Backend)

A visual multi-agent orchestration platform for constructing, configuring, and executing networks of AI agents. Built for pharmaceutical R&D workflows but adaptable to any domain requiring complex multi-agent reasoning.

This version features a **Python/FastAPI backend** for improved performance, better async handling, and easier integration with Python-based ML/AI tooling.

## Features

- **Visual Graph Editor**: Node-based interface for designing agent networks using Vue Flow
- **Configurable Agent Behaviors**: Analytical, creative, adversarial, or balanced presets
- **Relationship Types**: Define how agents interact (informs, critiques, validates, collaborates, reports-to)
- **Rogue Mode Testing**: Inject controlled failures for stress-testing agent networks
- **Parallel Execution**: Agents with no dependencies execute simultaneously using async Python
- **Pre-built Templates**: Ready-to-use pharmaceutical R&D scenarios
- **Streaming Results**: Real-time NDJSON streaming of simulation progress

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Vue 3 | Reactive UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Vue Flow | Graph visualization & editing |
| Tailwind CSS | Utility-first styling |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Runtime environment |
| FastAPI | Modern async web framework |
| OpenAI SDK | LLM API integration |
| Pydantic | Data validation & serialization |
| Uvicorn | ASGI server |

## Project Structure

```
agentdashboardpy/
├── client/                      # Vue 3 frontend
│   ├── src/
│   │   ├── components/          # Vue components
│   │   ├── composables/         # Vue composition functions
│   │   ├── scenarios/           # Pre-built scenarios
│   │   ├── types/               # TypeScript definitions
│   │   └── App.vue              # Main application
│   ├── package.json
│   └── vite.config.ts
├── server/                      # Python FastAPI backend
│   ├── routes/
│   │   └── simulation.py        # API endpoints
│   ├── services/
│   │   ├── orchestrator.py      # Topology execution engine
│   │   └── prompt_builder.py    # Agent prompt construction
│   ├── models.py                # Pydantic data models
│   ├── main.py                  # FastAPI application
│   └── requirements.txt
├── README.md
└── LICENSE
```

## Getting Started

### Prerequisites

- **Python** 3.11 or higher
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **OpenAI API key** (or compatible endpoint)

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

**Request Body:**
```json
{
  "topology": {
    "name": "My Simulation",
    "nodes": [...],
    "edges": [...],
    "inputNodes": [...],
    "outputNodes": [...]
  },
  "apiKey": "sk-...",
  "apiEndpoint": "https://api.openai.com"
}
```

**Streaming Events:**
- `phase-start`: When a new execution phase begins
- `node-complete`: When a node finishes successfully
- `node-error`: When a node encounters an error
- `complete`: Final completion with all results

### GET /api/health

Health check endpoint.

```json
{"status": "ok", "timestamp": "2026-01-08T12:00:00.000Z"}
```

## Agent Configuration

| Property | Description | Options |
|----------|-------------|---------|
| **Name** | Agent identifier | Custom string |
| **Role** | Professional role/expertise | Custom string |
| **Behavior Preset** | Reasoning style | `analytical`, `creative`, `adversarial`, `balanced` |
| **Model** | LLM model to use | `gpt-4o`, `gpt-4o-mini`, `gpt-5-nano`, etc. |
| **Temperature** | Response creativity | 0.0 - 1.0+ |
| **Oversight Mode** | Senior reviewer capability | Boolean |
| **Suspicion Level** | Cross-checking behavior | `trusting`, `suspicious` |

## Relationship Types

- **informs**: Provides context to downstream agent
- **critiques**: Evaluates and challenges the source agent's output
- **validates**: Verifies and approves conclusions
- **collaborates**: Works jointly, combining perspectives
- **reports-to**: Hierarchical reporting structure

## Rogue Mode Profiles

For adversarial testing:
- **hallucination**: Inject plausible but false information
- **omission**: Deliberately skip critical details
- **contradiction**: Undermine other agents' conclusions
- **ignore-constraints**: Violate safety or scope requirements

## Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y nodejs npm

# Copy and build frontend
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Install Python dependencies
COPY server/requirements.txt ./server/
RUN pip install --no-cache-dir -r server/requirements.txt
COPY server/ ./server/

EXPOSE 3006

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "3006"]
```

Build and run:
```bash
docker build -t agentdashboardpy .
docker run -p 3006:3006 agentdashboardpy
```

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2026 Jakob Nikolas Kather
