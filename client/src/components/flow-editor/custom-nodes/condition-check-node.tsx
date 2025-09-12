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
        
        <div className="space-y-1">
          {data.conditions.slice(0, 3).map((condition, index) => (
            <div key={index} className="bg-red-50 p-1 rounded border-l-2 border-red-500">
              <div className="flex items-center space-x-1">
                {condition.condition === "HAS_TIME_PASSED" && (
                  <i className="fas fa-clock text-red-600 text-xs"></i>
                )}
                {condition.condition.includes("LINKEDIN") && (
                  <i className="fab fa-linkedin text-red-600 text-xs"></i>
                )}
                {condition.condition.includes("NOVA") && (
                  <i className="fas fa-star text-red-600 text-xs"></i>
                )}
                <span className="text-red-800 text-xs font-medium">
                  {condition.condition.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
              <div className="text-red-700 text-xs">
                = {condition.value.toString()}
                {condition.timeInHours && (
                  <span className="ml-1">({condition.timeInHours}h)</span>
                )}
              </div>
            </div>
          ))}
          {conditionCount > 3 && (
            <div className="text-xs text-muted-foreground italic">
              +{conditionCount - 3} more condition{conditionCount - 3 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionCheckNode);