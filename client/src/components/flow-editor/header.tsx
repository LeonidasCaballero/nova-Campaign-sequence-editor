import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FlowSequence } from "@shared/schema";

interface HeaderProps {
  nodes: Node[];
  edges: Edge[];
  onSave: () => void;
  onLoad: () => void;
  onExportJson: () => void;
  deleteSelectedNode: () => void;
  hasSelectedNode: boolean;
}

export default function Header({
  nodes,
  edges,
  onSave,
  onLoad,
  onExportJson,
  deleteSelectedNode,
  hasSelectedNode,
}: HeaderProps) {
  const { toast } = useToast();

  const { data: flows } = useQuery<FlowSequence[]>({
    queryKey: ["/api/flows"],
  });

  const saveFlowMutation = useMutation({
    mutationFn: async () => {
      const flowData = {
        name: `Flow ${new Date().toISOString()}`,
        description: "Generated flow sequence",
        nodes: nodes,
        edges: edges,
      };
      return apiRequest("POST", "/api/flows", flowData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      toast({
        title: "Success",
        description: "Flow saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save flow",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveFlowMutation.mutate();
  };

  const handleExportJson = () => {
    const flowData = {
      nodes: nodes,
      edges: edges,
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
          variant="ghost"
          size="sm"
          onClick={onLoad}
          data-testid="button-open"
        >
          <i className="fas fa-folder-open mr-2"></i>
          Open
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saveFlowMutation.isPending}
          data-testid="button-save"
        >
          <i className="fas fa-save mr-2"></i>
          {saveFlowMutation.isPending ? "Saving..." : "Save"}
        </Button>
        
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
