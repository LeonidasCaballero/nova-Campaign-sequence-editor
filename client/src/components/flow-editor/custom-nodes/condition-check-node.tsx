import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ConditionCheckNodeData } from "@shared/schema";

function ConditionCheckNode({ data }: NodeProps<ConditionCheckNodeData>) {
  const hasTimeCondition = data.conditions.some(c => c.condition === "HAS_TIME_PASSED");

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 node-condition-check min-w-[280px]">
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
      
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          {hasTimeCondition ? (
            <i className="fas fa-clock text-red-600"></i>
          ) : (
            <i className="fas fa-check-circle text-red-600"></i>
          )}
          <h3 className="font-semibold text-sm">
            {hasTimeCondition ? "Time Check" : "Condition Check"}
          </h3>
        </div>
        
        <div className="space-y-2 text-xs">
          {data.conditions.map((condition, index) => (
            <div key={index} className="bg-gray-50 p-2 rounded">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Condition:</span>
                <span className="font-mono">{condition.condition}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-mono">{condition.value.toString()}</span>
              </div>
              {condition.timeInHours && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-mono">{condition.timeInHours} hours</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionCheckNode);
