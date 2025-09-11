import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ActionNodeData } from "@shared/schema";

function ActionNode({ data }: NodeProps<ActionNodeData>) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 node-action min-w-[280px]">
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
      
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          {data.action === "SEND_MESSAGE" ? (
            <i className="fas fa-envelope text-emerald-600"></i>
          ) : (
            <i className="fas fa-play text-emerald-600"></i>
          )}
          <h3 className="font-semibold text-sm">
            {data.action === "SEND_MESSAGE" ? "Send Message" : "Send Contact Request"}
          </h3>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Action:</span>
            <span className="font-mono">{data.action}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-mono">{data.provider}</span>
          </div>
          {data.message && (
            <div className="mt-2">
              <span className="text-muted-foreground text-xs">Message:</span>
              <div className="text-xs font-mono bg-gray-50 p-2 rounded mt-1 max-w-full break-words">
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
