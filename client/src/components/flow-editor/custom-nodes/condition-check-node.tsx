import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ConditionCheckNodeData } from "@shared/schema";

function ConditionCheckNode({ data }: NodeProps<ConditionCheckNodeData>) {
  const hasTimeCondition = data.conditions.some(c => c.condition === "HAS_TIME_PASSED");

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 node-condition-check min-w-[220px]">
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
      
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          {hasTimeCondition ? (
            <i className="fas fa-clock text-red-600 text-sm"></i>
          ) : (
            <i className="fas fa-check-circle text-red-600 text-sm"></i>
          )}
          <h3 className="font-medium text-xs">
            {hasTimeCondition ? "Time Check" : "Condition Check"}
          </h3>
        </div>
        
        <div className="space-y-1 text-xs">
          {data.conditions.map((condition, index) => (
            <div key={index} className="bg-gray-50 p-1 rounded">
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-muted-foreground">Condition:</span>
                <span className="font-mono text-xs">{condition.condition}</span>
              </div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-mono text-xs">{condition.value.toString()}</span>
              </div>
              {condition.timeInHours && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-mono text-xs">{condition.timeInHours} hours</span>
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
