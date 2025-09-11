import { useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowInstance,
  Controls,
  Background,
} from "reactflow";
import ActionNode from "./custom-nodes/action-node";
import ConditionNode from "./custom-nodes/condition-node";
import ConditionCheckNode from "./custom-nodes/condition-check-node";

const nodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
  condition_check: ConditionCheckNode,
};

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onInit: (instance: ReactFlowInstance) => void;
  deleteSelectedNode: () => void;
  hasSelectedNode: boolean;
  reactFlowInstance: ReactFlowInstance | null;
}

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onPaneClick,
  onDrop,
  onDragOver,
  onInit,
  deleteSelectedNode,
  hasSelectedNode,
  reactFlowInstance,
}: FlowCanvasProps) {
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

      // Create the edge with validation passed
      const newEdge = {
        ...params,
        id: `edge_${Date.now()}`,
      };

      onEdgesChange([{ type: "add", item: newEdge }]);
    },
    [nodes, onEdgesChange]
  );

  return (
    <div className="flex-1 relative">
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
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-800 flow-canvas"
        data-testid="flow-canvas"
      >
        <Background 
          variant="dots" 
          gap={20} 
          size={1}
          color="#374151"
        />
        
        <Controls 
          position="bottom-left"
          showInteractive={false}
        />

        {/* Floating toolbar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 floating-panel rounded-lg px-4 py-2 z-20">
          <div className="flex items-center space-x-4">
            <button
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Delete Selected"
              onClick={deleteSelectedNode}
              disabled={!hasSelectedNode}
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
            <button
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
              onClick={() => reactFlowInstance?.zoomIn()}
              data-testid="button-zoom-in"
            >
              <i className="fas fa-search-plus text-muted-foreground"></i>
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
              onClick={() => reactFlowInstance?.zoomOut()}
              data-testid="button-zoom-out"
            >
              <i className="fas fa-search-minus text-muted-foreground"></i>
            </button>
          </div>
        </div>
      </ReactFlow>
    </div>
  );
}
