import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download } from "lucide-react";
import { useState } from "react";

interface NodePaletteProps {
  nodes?: Node[];
  edges?: Edge[];
  showJsonExport?: boolean;
  firstNodeId?: string | null;
  onImportFlow?: (nodes: Node[], edges: Edge[], firstNodeId?: string) => void;
}

export default function NodePalette({ nodes = [], edges = [], showJsonExport = false, firstNodeId, onImportFlow }: NodePaletteProps) {
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
  // First node is always placed at the beginning of the array
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
          child: {
            action: data.action,
            provider: data.provider,
            ...(data.message && { data: { message: data.message } }),
            ...(data.nextStepId && { nextStepId: data.nextStepId }),
          }
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

    const allNodes = [...actionNodes, ...conditionNodes, ...standaloneConditionCheckNodes];
    
    // Move first node to the beginning of the array
    if (firstNodeId) {
      const firstNodeIndex = allNodes.findIndex(node => node.id === firstNodeId);
      if (firstNodeIndex > 0) {
        const firstNode = allNodes.splice(firstNodeIndex, 1)[0];
        allNodes.unshift(firstNode);
      }
    }
    
    // Collect position data for all nodes
    const positions: { [key: string]: { x: number; y: number } } = {};
    nodes.forEach(node => {
      positions[node.id] = { x: node.position.x, y: node.position.y };
    });
    
    return {
      nodes: allNodes,
      positions: positions
    };
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
      
      // First try strict JSON parsing
      try {
        importedData = JSON.parse(importJson);
      } catch (jsonError) {
        // If JSON parsing fails, try to convert JavaScript object notation to JSON
        try {
          // SAFE conversion of JavaScript object notation to JSON
          // This replaces unquoted property names with quoted ones
          const jsonString = importJson
            .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')  // Quote unquoted property names
            .replace(/'/g, '"');  // Replace single quotes with double quotes
          
          importedData = JSON.parse(jsonString);
        } catch (conversionError) {
          throw new Error("Invalid JSON or JavaScript object format");
        }
      }
      
      // Handle both old format (array) and new format (object with nodes and positions)
      let nodeData: any[];
      let positionData: { [key: string]: { x: number; y: number } } = {};
      
      if (Array.isArray(importedData)) {
        // Old format - just an array of nodes
        nodeData = importedData;
      } else if (typeof importedData === 'object' && importedData.nodes && Array.isArray(importedData.nodes)) {
        // New format - object with nodes and positions
        nodeData = importedData.nodes;
        positionData = importedData.positions || {};
      } else {
        throw new Error("Input must be an array of nodes or an object with 'nodes' property");
      }

      if (nodeData.length === 0) {
        throw new Error("Input array cannot be empty");
      }

      // Validate first node type - must be ACTION or CONDITION
      const firstItem = nodeData[0];
      if (!firstItem.type || (firstItem.type !== "ACTION" && firstItem.type !== "CONDITION")) {
        throw new Error("First node must be of type ACTION or CONDITION");
      }

      const { nodes: importedNodes, edges: importedEdges, firstNodeId: importedFirstNodeId } = convertJsonToFlow(nodeData, positionData);
      
      // Remove any edges that target the first node to enforce "no inputs to first node" rule
      const filteredEdges = importedEdges.filter(edge => edge.target !== importedFirstNodeId);
      
      if (onImportFlow) {
        onImportFlow(importedNodes, filteredEdges, importedFirstNodeId);
        toast({
          title: "Success",
          description: `Imported ${importedNodes.length} nodes successfully${importedFirstNodeId ? ' with first node' : ''}`,
        });
        setImportJson(""); // Clear the textarea after successful import
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const convertJsonToFlow = (jsonData: any[], savedPositions: { [key: string]: { x: number; y: number } } = {}) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // Default positioning for nodes without saved positions
    const startX = 100;
    const startY = 50; // Start higher for first node
    const verticalSpacing = 250; // More space between nodes vertically
    const horizontalSpacing = 350; // Space for condition checks to the right
    
    // The first item in the array is the first node
    const firstNodeId = jsonData.length > 0 ? jsonData[0].id : null;
    
    jsonData.forEach((item, index) => {
      // Use saved position if available, otherwise use default positioning
      const position = savedPositions[item.id] || { 
        x: startX, 
        y: startY + (index * verticalSpacing) 
      };
      nodePositions.set(item.id, position);
      
      if (item.type === "ACTION") {
        // Handle both old format (flat) and new format (with child property)
        const actionData = item.child || item;
        
        const node: Node = {
          id: item.id,
          type: "action",
          position,
          data: {
            action: actionData.action,
            provider: actionData.provider,
            ...(actionData.data?.message && { message: actionData.data.message }),
            ...(actionData.nextStepId && { nextStepId: actionData.nextStepId }),
          },
        };
        nodes.push(node);
        
        // Create edge if nextStepId exists
        if (actionData.nextStepId) {
          edges.push({
            id: `reactflow__edge-${item.id}output-${actionData.nextStepId}input`,
            source: item.id,
            sourceHandle: "output",
            target: actionData.nextStepId,
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
          const checkPosition = savedPositions[checkNodeId] || { 
            x: position.x + horizontalSpacing, 
            y: position.y + (childIndex * 120) // Slightly more vertical space between condition checks
          };
          
          const checkNode: Node = {
            id: checkNodeId,
            type: "condition_check",
            position: checkPosition,
            data: {
              conditions: (childData.checks || []).map((check: any) => ({
                condition: check.condition,
                value: check.value,
                ...(check.conditionExtraValue && { 
                  timeInHours: check.conditionExtraValue.timeInHours 
                })
              })),
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
            conditions: (item.conditions || []).map((check: any) => ({
              condition: check.condition,
              value: check.value,
              ...(check.conditionExtraValue && { 
                timeInHours: check.conditionExtraValue.timeInHours 
              })
            })),
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
    
    return { nodes, edges, firstNodeId };
  };

  return (
    <aside className="flex-1 overflow-y-auto nova-sidebar">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Nodes</h2>

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
