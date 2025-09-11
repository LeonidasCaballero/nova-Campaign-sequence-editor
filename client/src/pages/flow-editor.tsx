import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
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
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showJsonPanel, setShowJsonPanel] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => {
      // Validation rules for connections
      if (!params.source || !params.target) return;

      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      // Actions can connect to actions or condition checks
      if (sourceNode.type === "action" && targetNode.type === "condition") {
        return; // Not allowed
      }

      // Conditions can only connect to condition checks
      if (sourceNode.type === "condition" && targetNode.type !== "condition_check") {
        return; // Not allowed
      }

      setEdges((eds) => addEdge(params, eds));
    },
    [nodes, setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        nodes={nodes}
        edges={edges}
        onExportJson={() => {}}
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
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              fitView
              className="bg-slate-800 flow-canvas"
              data-testid="flow-canvas"
            >
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 floating-panel rounded-lg px-4 py-2 z-20">
                <div className="flex items-center space-x-4">
                  <button
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Delete Selected"
                    onClick={deleteSelectedNode}
                    disabled={!selectedNode}
                    data-testid="button-delete-selected"
                  >
                    <i className="fas fa-trash text-muted-foreground"></i>
                  </button>
                  <div className="w-px h-6 bg-border"></div>
                  <button
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Fit View"
                    onClick={() => reactFlowInstance?.fitView()}
                    data-testid="button-fit-view"
                  >
                    <i className="fas fa-expand-arrows-alt text-muted-foreground"></i>
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
