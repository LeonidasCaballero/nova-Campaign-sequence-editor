import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ConditionNodeData } from "@shared/schema";

interface ConditionNodeProps extends NodeProps<ConditionNodeData> {
  data: ConditionNodeData & { isFirstNode?: boolean };
}

function ConditionNode({ data }: ConditionNodeProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 node-condition min-w-[80px] ${data.isFirstNode ? 'node-first' : ''}`} data-testid={`node-condition${data.isFirstNode ? '-first' : ''}`}>
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
        {(data as any).title && (
          <div className="mb-1 text-xs font-semibold text-gray-800">
            {(data as any).title}
          </div>
        )}
        
        <div className="flex items-center space-x-1 mb-1">
          <i className="fas fa-question-circle text-amber-600 text-xs"></i>
          <h3 className="font-medium text-xs">
            Condition
          </h3>
        </div>
        
        {(data as any).description && (
          <div className="mb-1 text-xs text-gray-600">
            {(data as any).description.length > 50 ? (data as any).description.substring(0, 50) + "..." : (data as any).description}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Links to checks
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionNode);
