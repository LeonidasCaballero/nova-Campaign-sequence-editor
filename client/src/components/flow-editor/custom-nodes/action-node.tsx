import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ActionNodeData } from "@shared/schema";

function ActionNode({ data }: NodeProps<ActionNodeData>) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 node-action min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle input"
        data-testid="handle-action-input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle output"
        data-testid="handle-action-output"
      />
      
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          {data.action === "SEND_MESSAGE" ? (
            <i className="fas fa-envelope text-emerald-600 text-sm"></i>
          ) : (
            <i className="fas fa-play text-emerald-600 text-sm"></i>
          )}
          <h3 className="font-medium text-xs">
            {data.action === "SEND_MESSAGE" ? "Send Message" : "Send Contact Request"}
          </h3>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Action:</span>
            <span className="font-mono text-xs">{data.action}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-mono text-xs">{data.provider}</span>
          </div>
          {data.message && (
            <div className="mt-1">
              <span className="text-muted-foreground text-xs">Message:</span>
              <div className="text-xs font-mono bg-gray-50 p-1 rounded mt-1 max-w-full break-words">
                "{data.message}"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ActionNode);
