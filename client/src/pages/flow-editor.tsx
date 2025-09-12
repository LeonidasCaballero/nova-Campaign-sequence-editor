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
import { useToast } from "@/hooks/use-toast";
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
  const [firstNodeId, setFirstNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const { toast } = useToast();

  // Enhanced nodes with first node information (moved after firstNodeId declaration)
  const enhancedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      isFirstNode: node.id === firstNodeId
    }
  }));

  const onConnect = useCallback(
    (params: Connection) => {
      // Validation rules for connections
      if (!params.source || !params.target) return;

      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // Prevent connections TO the first node
      if (targetNode.id === firstNodeId) {
        toast({
          title: "Connection not allowed",
          description: "Cannot connect to the first node. First nodes can only have outputs.",
          variant: "destructive",
        });
        return;
      }

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
    [nodes, setEdges, setNodes, firstNodeId, toast]
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
    setContextMenu(null); // Close context menu when clicking elsewhere
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setContextMenu(null); // Close context menu when clicking elsewhere
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
      // Clear first node if deleting the first node
      if (selectedNode.id === firstNodeId) {
        setFirstNodeId(null);
      }
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
      );
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges, firstNodeId]);

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

  // First node management functions
  const isNodeEligibleForFirst = useCallback((node: Node) => {
    // Only actions and conditions can be first nodes, not condition checks
    if (node.type === "condition_check") return false;
    
    // Node must not have any incoming connections
    const hasIncomingConnections = edges.some(edge => edge.target === node.id);
    return !hasIncomingConnections;
  }, [edges]);

  const setNodeAsFirst = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (!isNodeEligibleForFirst(node)) {
      toast({
        title: "Cannot set as first node",
        description: "Only action or condition nodes without inputs can be set as first nodes.",
        variant: "destructive",
      });
      return;
    }

    setFirstNodeId(nodeId);
    toast({
      title: "First node set",
      description: `${node.type === "action" ? "Action" : "Condition"} node is now the first node.`,
    });
  }, [nodes, isNodeEligibleForFirst, toast]);

  const clearFirstNode = useCallback(() => {
    setFirstNodeId(null);
    toast({
      title: "First node cleared",
      description: "No node is set as the first node.",
    });
  }, [toast]);

  const handleImportFlow = useCallback((importedNodes: Node[], importedEdges: Edge[], importedFirstNodeId?: string) => {
    setNodes(importedNodes);
    setEdges(importedEdges);
    setFirstNodeId(importedFirstNodeId || null);
    setSelectedNode(null);
    setSelectedEdge(null);
    
    // Fit view to show all imported nodes
    setTimeout(() => {
      reactFlowInstance?.fitView();
    }, 100);
  }, [setNodes, setEdges, reactFlowInstance]);

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
          firstNodeId={firstNodeId}
          onImportFlow={handleImportFlow}
        />

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={enhancedNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeContextMenu={onNodeContextMenu}
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
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <PropertiesPanel
          selectedNode={selectedNode}
          updateNodeData={updateNodeData}
          nodes={nodes}
          edges={edges}
          firstNodeId={firstNodeId}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          data-testid="context-menu"
        >
          {(() => {
            const node = nodes.find(n => n.id === contextMenu.nodeId);
            const isEligible = node && isNodeEligibleForFirst(node);
            const isCurrentlyFirst = contextMenu.nodeId === firstNodeId;
            
            return (
              <>
                {isCurrentlyFirst ? (
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                    onClick={() => {
                      clearFirstNode();
                      setContextMenu(null);
                    }}
                    data-testid="button-clear-first-node"
                  >
                    Remove as First Node
                  </button>
                ) : isEligible ? (
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-blue-600"
                    onClick={() => {
                      setNodeAsFirst(contextMenu.nodeId);
                      setContextMenu(null);
                    }}
                    data-testid="button-set-first-node"
                  >
                    Set as First Node
                  </button>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Cannot set as first node
                    <div className="text-xs text-gray-500 mt-1">
                      {node?.type === "condition_check" 
                        ? "Condition checks cannot be first nodes"
                        : "Node has incoming connections"}
                    </div>
                  </div>
                )}
              </>
            );
          })()} 
        </div>
      )}
      
      {/* JSON export is now integrated into the sidebar */}
    </div>
  );
}
