import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download } from "lucide-react";
import { useState } from "react";

interface NodePaletteProps {
  nodes?: Node[];
  edges?: Edge[];
  showJsonExport?: boolean;
  onImportFlow?: (nodes: Node[], edges: Edge[]) => void;
}

export default function NodePalette({ nodes = [], edges = [], showJsonExport = false, onImportFlow }: NodePaletteProps) {
  const { toast } = useToast();
  const [importJson, setImportJson] = useState("");
  
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  // Get next step for a node
  const getNextStepId = (nodeId: string) => {
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    return outgoingEdges.length > 0 ? outgoingEdges[0].target : null;
  };

  // JSON export logic that groups condition checks under parent conditions
  const generateFlowData = () => {
    const conditionMap = new Map();
    const conditionCheckMap = new Map();
    const actionNodes: any[] = [];

    // First pass: collect all nodes by type
    nodes.forEach(node => {
      if (node.type === "condition") {
        conditionMap.set(node.id, { ...node, checks: [] });
      } else if (node.type === "condition_check") {
        conditionCheckMap.set(node.id, node);
      } else if (node.type === "action") {
        let data = node.data as any;
        // Handle backward compatibility with old format
        if (data.actions && Array.isArray(data.actions)) {
          data = data.actions[0] || { action: "SEND_CONTACT_REQUEST", provider: "LINKEDIN" };
        }
        
        actionNodes.push({
          id: node.id,
          type: "ACTION",
          action: data.action,
          provider: data.provider,
          ...(data.message && { data: { message: data.message } }),
          ...(data.nextStepId && { nextStepId: data.nextStepId }),
        });
      }
    });

    // Second pass: associate condition checks with their parent conditions
    edges.forEach(edge => {
      const sourceNode = conditionMap.get(edge.source);
      const targetNode = conditionCheckMap.get(edge.target);
      
      if (sourceNode && targetNode) {
        const conditionCheckData = targetNode.data as any;
        if (conditionCheckData.conditions) {
          const childData = {
            nextStepId: getNextStepId(edge.target),
            checks: conditionCheckData.conditions.map((condition: any) => ({
              condition: condition.condition,
              value: condition.value,
              ...(condition.timeInHours && {
                conditionExtraValue: { timeInHours: condition.timeInHours }
              })
            }))
          };
          sourceNode.checks.push(childData);
        }
      }
    });

    // Build final condition nodes with child structure
    const conditionNodes = Array.from(conditionMap.values()).map((conditionNode: any) => ({
      id: conditionNode.id,
      type: "CONDITION",
      child: conditionNode.checks
    }));

    // Handle standalone condition_check nodes (not connected to any condition)
    const connectedConditionCheckIds = new Set();
    edges.forEach(edge => {
      const sourceNode = conditionMap.get(edge.source);
      const targetNode = conditionCheckMap.get(edge.target);
      if (sourceNode && targetNode) {
        connectedConditionCheckIds.add(edge.target);
      }
    });

    const standaloneConditionCheckNodes = Array.from(conditionCheckMap.values())
      .filter((node: any) => !connectedConditionCheckIds.has(node.id))
      .map((node: any) => {
        const conditionCheckData = node.data as any;
        const nextStepId = getNextStepId(node.id);
        return {
          id: node.id,
          type: "CONDITION_CHECK",
          conditions: (conditionCheckData.conditions || []).map((condition: any) => ({
            condition: condition.condition,
            value: condition.value,
            ...(condition.timeInHours && {
              conditionExtraValue: { timeInHours: condition.timeInHours }
            })
          })),
          ...(nextStepId && { nextStepId })
        };
      });

    return [...actionNodes, ...conditionNodes, ...standaloneConditionCheckNodes];
  };

  const flowData = generateFlowData();
  const jsonString = showJsonExport ? JSON.stringify(flowData, null, 2) : "";


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

  const handleImportJson = () => {
    if (!importJson.trim()) {
      toast({
        title: "No JSON provided",
        description: "Please paste JSON content to import",
        variant: "destructive",
      });
      return;
    }

    try {
      let importedData;
      
      // Try multiple parsing strategies
      try {
        // First try: standard JSON parsing
        importedData = JSON.parse(importJson);
      } catch (jsonError) {
        try {
          // Second try: evaluate as JavaScript object
          // Use Function constructor for safer evaluation than eval()
          const func = new Function('return ' + importJson);
          importedData = func();
        } catch (jsError) {
          throw new Error("Invalid JSON or JavaScript object format");
        }
      }
      
      if (!Array.isArray(importedData)) {
        throw new Error("Input must be an array of nodes");
      }

      const { nodes: importedNodes, edges: importedEdges } = convertJsonToFlow(importedData);
      
      if (onImportFlow) {
        onImportFlow(importedNodes, importedEdges);
        toast({
          title: "Success",
          description: `Imported ${importedNodes.length} nodes successfully`,
        });
        setImportJson(""); // Clear the textarea after successful import
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid format",
        variant: "destructive",
      });
    }
  };

  const convertJsonToFlow = (jsonData: any[]) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // Position nodes in a grid layout
    let x = 100;
    let y = 100;
    const spacing = 200;
    
    jsonData.forEach((item, index) => {
      const position = { x: x + (index % 3) * spacing, y: y + Math.floor(index / 3) * spacing };
      nodePositions.set(item.id, position);
      
      if (item.type === "ACTION") {
        const node: Node = {
          id: item.id,
          type: "action",
          position,
          data: {
            action: item.action,
            provider: item.provider,
            ...(item.data?.message && { message: item.data.message }),
            ...(item.nextStepId && { nextStepId: item.nextStepId }),
          },
        };
        nodes.push(node);
        
        // Create edge if nextStepId exists
        if (item.nextStepId) {
          edges.push({
            id: `reactflow__edge-${item.id}output-${item.nextStepId}input`,
            source: item.id,
            sourceHandle: "output",
            target: item.nextStepId,
            targetHandle: "input",
          });
        }
      } else if (item.type === "CONDITION") {
        const node: Node = {
          id: item.id,
          type: "condition",
          position,
          data: {
            child: item.child || [],
          },
        };
        nodes.push(node);
        
        // Create condition check nodes and edges
        (item.child || []).forEach((childData: any, childIndex: number) => {
          const checkNodeId = `${item.id}_check_${childIndex}`;
          const checkPosition = { 
            x: position.x + spacing, 
            y: position.y + (childIndex * 100) 
          };
          
          const checkNode: Node = {
            id: checkNodeId,
            type: "condition_check",
            position: checkPosition,
            data: {
              conditions: childData.checks || [],
            },
          };
          nodes.push(checkNode);
          
          // Edge from condition to condition check
          edges.push({
            id: `reactflow__edge-${item.id}output-${checkNodeId}input`,
            source: item.id,
            sourceHandle: "output",
            target: checkNodeId,
            targetHandle: "input",
          });
          
          // Edge from condition check to next step
          if (childData.nextStepId) {
            edges.push({
              id: `reactflow__edge-${checkNodeId}output-${childData.nextStepId}input`,
              source: checkNodeId,
              sourceHandle: "output",
              target: childData.nextStepId,
              targetHandle: "input",
            });
          }
        });
      } else if (item.type === "CONDITION_CHECK") {
        const node: Node = {
          id: item.id,
          type: "condition_check",
          position,
          data: {
            conditions: item.conditions || [],
          },
        };
        nodes.push(node);
        
        // Create edge if nextStepId exists for standalone condition check
        if (item.nextStepId) {
          edges.push({
            id: `reactflow__edge-${item.id}output-${item.nextStepId}input`,
            source: item.id,
            sourceHandle: "output",
            target: item.nextStepId,
            targetHandle: "input",
          });
        }
      }
    });
    
    return { nodes, edges };
  };

  return (
    <aside className="w-80 bg-card border-r border-border overflow-y-auto flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Node Library</h2>

        <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Actions
          </h3>
          <div className="space-y-2">
            <div
              className="node-action bg-card border border-border rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow"
              draggable
              onDragStart={(event) => onDragStart(event, "action")}
              data-testid="palette-action"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-play text-emerald-600"></i>
                <div>
                  <div className="text-sm font-medium">Action</div>
                  <div className="text-xs text-muted-foreground">Single action step</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Conditions
          </h3>
          <div className="space-y-2">
            <div
              className="node-condition bg-card border border-border rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow"
              draggable
              onDragStart={(event) => onDragStart(event, "condition")}
              data-testid="palette-condition"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-question-circle text-amber-600"></i>
                <div>
                  <div className="text-sm font-medium">Condition</div>
                  <div className="text-xs text-muted-foreground">Conditional branching</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Condition Checks
          </h3>
          <div className="space-y-2">
            <div
              className="node-condition-check bg-card border border-border rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow"
              draggable
              onDragStart={(event) => onDragStart(event, "condition_check")}
              data-testid="palette-condition-check"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle text-red-600"></i>
                <div>
                  <div className="text-sm font-medium">Condition Check</div>
                  <div className="text-xs text-muted-foreground">Validate conditions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {showJsonExport && (
        <div className="border-t border-border p-4 bg-muted/50 flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">JSON Export</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToClipboard}
              title="Copy JSON to clipboard"
              data-testid="button-copy-json"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <div className="bg-gray-900 rounded-md p-3 overflow-y-auto h-64">
            <pre 
              className="text-green-400 font-mono text-xs leading-relaxed"
              data-testid="json-preview"
            >
              {jsonString}
            </pre>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground">Import JSON</h4>
              <Button
                size="sm"
                onClick={handleImportJson}
                disabled={!importJson.trim()}
                data-testid="button-import-json"
              >
                <Download className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste your JSON or JavaScript object here..."
              className="w-full h-32 p-3 text-xs font-mono bg-gray-900 text-green-400 rounded-md border border-border resize-none"
              data-testid="textarea-import-json"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
