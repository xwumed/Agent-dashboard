import json
import os
from pathlib import Path

# Create a dummy input file
input_dir = Path("test_io")
input_dir.mkdir(exist_ok=True)
input_file = input_dir / "patient_001.json"

patient_data = {
    "id": "P001",
    "details": "Sample patient data"
}

with open(input_file, "w", encoding="utf-8") as f:
    json.dump(patient_data, f)

print(f"Created input file: {input_file}")

# We can't easily trigger the full orchestrator from here without a complex setup,
# but we can verify our new helper function directly.
import sys
sys.path.append(os.getcwd())

from server.services.orchestrator import save_output_file
from server.models import Topology, AgentNodeData, AgentEdge, InputNodeData, OutputNodeData, SimulationResult

# Mock topology and results
nodes = [AgentNodeData(id="agent1", name="Doctor", role="Reviewer", behaviorPreset="analytical", temperature=0.5, isOversight=False)]
edges = [AgentEdge(id="e1", source="agent1", target="out1", relationshipType="informs")]
input_nodes = [InputNodeData(id="in1", type="input", task="Process patient", input_path=str(input_file.absolute()))]
output_nodes = [OutputNodeData(id="out1", type="output", label="Conclusion")]

topology = Topology(name="Test", nodes=nodes, edges=edges, input_nodes=input_nodes, output_nodes=output_nodes)
results = {
    "agent1": SimulationResult(output="ALLL GOOD", model="gpt-4o", tokens={"prompt": 10, "completion": 5}, duration=100)
}

print("Running save_output_file...")
save_output_file(str(input_file.absolute()), topology, results)

output_file = input_file.with_suffix(".output")
if output_file.exists():
    with open(output_file, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"SUCCESS: Output file created with content:\n{content}")
else:
    print("FAILED: Output file not created")

# Cleanup
# input_file.unlink()
# if output_file.exists(): output_file.unlink()
# input_dir.rmdir()
