import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ConditionNodeData } from "@shared/schema";

function ConditionNode({ data }: NodeProps<ConditionNodeData>) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 node-condition min-w-[160px]">
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle input"
        data-testid="handle-condition-input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle output"
        data-testid="handle-condition-output"
      />
      
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <i className="fas fa-question-circle text-amber-600 text-sm"></i>
          <h3 className="font-medium text-xs">Condition</h3>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Links to condition checks
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionNode);
