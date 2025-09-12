import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ConditionNodeData } from "@shared/schema";

function ConditionNode({ data }: NodeProps<ConditionNodeData>) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 node-condition min-w-[80px]">
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle input"
        data-testid="handle-condition-input"
        id="input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle output"
        data-testid="handle-condition-output"
        id="output"
      />
      
      <div className="p-1.5">
        <div className="flex items-center space-x-1 mb-1">
          <i className="fas fa-question-circle text-amber-600 text-xs"></i>
          <h3 className="font-medium text-xs">Condition</h3>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Links to checks
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionNode);
