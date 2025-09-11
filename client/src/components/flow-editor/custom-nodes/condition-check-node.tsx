import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ConditionCheckNodeData } from "@shared/schema";

function ConditionCheckNode({ data }: NodeProps<ConditionCheckNodeData>) {
  const conditionCount = data.conditions.length;
  const hasTimeCondition = data.conditions.some(c => c.condition === "HAS_TIME_PASSED");

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 node-condition-check min-w-[80px]">
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle input"
        data-testid="handle-condition-check-input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle output"
        data-testid="handle-condition-check-output"
      />
      
      <div className="p-1.5">
        <div className="flex items-center space-x-1 mb-1">
          <i className="fas fa-check-circle text-red-600 text-xs"></i>
          <h3 className="font-medium text-xs">Check</h3>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {conditionCount} condition{conditionCount !== 1 ? 's' : ''}
          {hasTimeCondition && (
            <div className="flex items-center space-x-1 mt-0.5">
              <i className="fas fa-clock text-xs"></i>
              <span>Time</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionCheckNode);