import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ActionNodeData } from "@shared/schema";

interface ActionNodeProps extends NodeProps<ActionNodeData> {
  data: ActionNodeData & { isFirstNode?: boolean };
}

function ActionNode({ data }: ActionNodeProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 node-action min-w-[100px] ${data.isFirstNode ? 'node-first' : ''}`} data-testid={`node-action${data.isFirstNode ? '-first' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle input"
        data-testid="handle-action-input"
        id="input"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle output"
        data-testid="handle-action-output"
        id="output"
      />
      
      <div className="p-1.5">
        {(data as any).title && (
          <div className="mb-1 text-xs font-semibold text-gray-800">
            {(data as any).title}
          </div>
        )}
        
        <div className="flex items-center space-x-1 mb-1">
          {data.action === "SEND_MESSAGE" ? (
            <i className="fas fa-envelope text-emerald-600 text-xs"></i>
          ) : (
            <i className="fas fa-play text-emerald-600 text-xs"></i>
          )}
          <h3 className="font-normal text-[10px] text-gray-500">
            {data.action === "SEND_MESSAGE" ? "Message" : "Contact Request"}
          </h3>
        </div>
        
        {(data as any).description && (
          <div className="mb-1 text-xs text-gray-600">
            {(data as any).description.length > 50 ? (data as any).description.substring(0, 50) + "..." : (data as any).description}
          </div>
        )}
        
        <div className="space-y-0.5 text-xs">
          <div className="bg-emerald-50 p-1 rounded border-l-2 border-emerald-500">
            <div className="font-semibold text-emerald-800 text-xs mb-0.5">
              {data.action === "SEND_MESSAGE" ? "Send Message" : "Send Contact Request"}
            </div>
            <div className="text-emerald-700 text-xs">
              via {data.provider === "NOVA" ? "Nova" : "LinkedIn"}
            </div>
            {data.message && (
              <div className="mt-1 text-emerald-600 text-xs italic">
                "{data.message.length > 30 ? data.message.substring(0, 30) + "..." : data.message}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ActionNode);
