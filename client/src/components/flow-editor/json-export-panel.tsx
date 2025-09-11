import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface JsonExportPanelProps {
  nodes: Node[];
  edges: Edge[];
  onMinimize: () => void;
}

export default function JsonExportPanel({ nodes, edges, onMinimize }: JsonExportPanelProps) {
  const { toast } = useToast();

  // Helper function to get connected nodes
  const getNextStepId = (nodeId: string) => {
    const outgoingEdge = edges.find(edge => edge.source === nodeId);
    return outgoingEdge ? outgoingEdge.target : null;
  };

  const flowData = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      data: node.data,
      position: node.position,
      nextStepId: getNextStepId(node.id),
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })),
  };

  const jsonString = JSON.stringify(flowData, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      toast({
        title: "Success",
        description: "JSON copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy JSON",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 floating-panel rounded-lg max-h-96 z-30">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">JSON Export</h3>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToClipboard}
              title="Copy JSON"
              data-testid="button-copy-json"
            >
              <i className="fas fa-copy text-muted-foreground text-sm"></i>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMinimize}
              title="Minimize"
              data-testid="button-minimize-json"
            >
              <i className="fas fa-minus text-muted-foreground text-sm"></i>
            </Button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-md p-3 overflow-y-auto max-h-64">
          <pre 
            className="text-green-400 font-mono text-xs leading-relaxed"
            data-testid="json-preview"
          >
            {jsonString}
          </pre>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Live preview updates as you modify the flow
        </div>
      </div>
    </div>
  );
}
