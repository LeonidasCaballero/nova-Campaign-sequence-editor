import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  EdgeChange,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlowProvider,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import Header from "@/components/flow-editor/header";
import NodePalette from "@/components/flow-editor/node-palette";
import PropertiesPanel from "@/components/flow-editor/properties-panel";
// JsonExportPanel now integrated into NodePalette
import ActionNode from "@/components/flow-editor/custom-nodes/action-node";
import ConditionNode from "@/components/flow-editor/custom-nodes/condition-node";
import ConditionCheckNode from "@/components/flow-editor/custom-nodes/condition-check-node";
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
  condition_check: ConditionCheckNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function FlowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, defaultOnEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showJsonPanel, setShowJsonPanel] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => {
      // Validation rules for connections
      if (!params.source || !params.target) return;

      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // Actions can ONLY connect to conditions
      if (sourceNode.type === "action" && targetNode.type !== "condition") {
        return; // Not allowed
      }

      // Conditions can ONLY connect to condition checks
      if (sourceNode.type === "condition" && targetNode.type !== "condition_check") {
        return; // Not allowed
      }

      // Condition checks can ONLY connect to actions or conditions
      if (sourceNode.type === "condition_check" && 
          targetNode.type !== "action" && 
          targetNode.type !== "condition") {
        return; // Not allowed
      }
      
      // Add the edge
      setEdges((eds) => addEdge(params, eds));
      
      // If action is connecting to condition, add nextStepId to the action
      if (sourceNode.type === "action" && targetNode.type === "condition") {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.source) {
              return {
                ...node,
                data: {
                  ...node.data,
                  nextStepId: params.target
                }
              };
            }
            return node;
          })
        );
      }
    },
    [nodes, setEdges, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Handle edge deletions to remove nextStepId from actions
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const edgeToRemove = edges.find(edge => edge.id === change.id);
          if (edgeToRemove) {
            const sourceNode = nodes.find(n => n.id === edgeToRemove.source);
            if (sourceNode && sourceNode.type === 'action') {
              setNodes((nds) =>
                nds.map((node) => {
                  if (node.id === edgeToRemove.source) {
                    const { nextStepId, ...restData } = node.data;
                    return {
                      ...node,
                      data: restData
                    };
                  }
                  return node;
                })
              );
            }
          }
        }
      });
      
      defaultOnEdgesChange(changes);
    },
    [defaultOnEdgesChange, edges, nodes, setNodes],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: uuidv4(),
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case "action":
        return {
          action: "SEND_CONTACT_REQUEST",
          provider: "LINKEDIN",
        };
      case "condition":
        return {};
      case "condition_check":
        return {
          conditions: [
            {
              condition: "IS_LINKEDIN_CONTACT",
              value: true,
            },
          ],
        };
      default:
        return {};
    }
  };

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updatedNode = { ...node, data: { ...node.data, ...newData } };
            // Update selectedNode if it's the same node being updated
            if (selectedNode && selectedNode.id === nodeId) {
              setSelectedNode(updatedNode);
            }
            return updatedNode;
          }
          return node;
        })
      );
    },
    [setNodes, selectedNode]
  );

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
      );
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge) {
      // Trigger the same logic as onEdgesChange but for manual deletion
      const sourceNode = nodes.find(n => n.id === selectedEdge.source);
      if (sourceNode && sourceNode.type === 'action') {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === selectedEdge.source) {
              const { nextStepId, ...restData } = node.data;
              return {
                ...node,
                data: restData
              };
            }
            return node;
          })
        );
      }
      
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  }, [selectedEdge, nodes, setNodes, setEdges]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        nodes={nodes}
        edges={edges}
        deleteSelectedNode={deleteSelectedNode}
        hasSelectedNode={!!selectedNode}
      />

      <div className="flex flex-1 overflow-hidden">
        <NodePalette 
          nodes={nodes}
          edges={edges}
          showJsonExport={showJsonPanel}
        />

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              deleteKeyCode="Delete"
              multiSelectionKeyCode="Meta"
              fitView
              className="bg-slate-800 flow-canvas"
              data-testid="flow-canvas"
            >
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-sm z-20">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-muted-foreground font-medium">Controls</span>
                  <div className="w-px h-4 bg-border"></div>
                  <button
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="Delete Selected"
                    onClick={() => {
                      if (selectedNode) deleteSelectedNode();
                      if (selectedEdge) deleteSelectedEdge();
                    }}
                    disabled={!selectedNode && !selectedEdge}
                    data-testid="button-delete-selected"
                  >
                    <i className="fas fa-trash text-muted-foreground text-sm"></i>
                  </button>
                  <button
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="Fit View"
                    onClick={() => reactFlowInstance?.fitView()}
                    data-testid="button-fit-view"
                  >
                    <i className="fas fa-expand-arrows-alt text-muted-foreground text-sm"></i>
                  </button>
                </div>
              </div>
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <PropertiesPanel
          selectedNode={selectedNode}
          updateNodeData={updateNodeData}
          nodes={nodes}
          edges={edges}
        />
      </div>

      {/* JSON export is now integrated into the sidebar */}
    </div>
  );
}
