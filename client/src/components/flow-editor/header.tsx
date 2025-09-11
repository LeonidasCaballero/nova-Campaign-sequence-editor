import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  nodes: Node[];
  edges: Edge[];
  onExportJson: () => void;
  deleteSelectedNode: () => void;
  hasSelectedNode: boolean;
}

export default function Header({
  nodes,
  edges,
  onExportJson,
  deleteSelectedNode,
  hasSelectedNode,
}: HeaderProps) {
  const { toast } = useToast();

  const handleExportJson = () => {
    // Helper function to get connected nodes
    const getNextStepIds = (nodeId: string) => {
      return edges.filter(edge => edge.source === nodeId).map(edge => edge.target);
    };

    const getNextStepId = (nodeId: string) => {
      const outgoingEdges = getNextStepIds(nodeId);
      return outgoingEdges.length > 0 ? outgoingEdges[0] : null;
    };

    const flowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: node.data,
        nextStepId: getNextStepId(node.id), // For backward compatibility 
        nextStepIds: getNextStepIds(node.id), // All linked node IDs
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
    };
    
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `flow-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Flow exported successfully",
    });
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <i className="fas fa-project-diagram text-primary text-xl"></i>
          <h1 className="text-xl font-bold text-foreground">Flow Builder</h1>
        </div>
        <div className="text-sm text-muted-foreground">Visual Node Editor</div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          onClick={handleExportJson}
          data-testid="button-export-json"
        >
          <i className="fas fa-download mr-2"></i>
          Export JSON
        </Button>
      </div>
    </header>
  );
}
