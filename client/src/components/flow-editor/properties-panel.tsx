import { Node, Edge } from "reactflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionNodeData, ConditionNodeData, ConditionCheckNodeData, Condition } from "@shared/schema";

interface PropertiesPanelProps {
  selectedNode: Node | null;
  updateNodeData: (nodeId: string, newData: any) => void;
  nodes: Node[];
  edges: Edge[];
  firstNodeId?: string | null;
}

export default function PropertiesPanel({
  selectedNode,
  updateNodeData,
  nodes,
  edges,
  firstNodeId,
}: PropertiesPanelProps) {
  const getConnectedNodes = (nodeId: string) => {
    const inputs = edges.filter(edge => edge.target === nodeId).map(edge => edge.source);
    const outputs = edges.filter(edge => edge.source === nodeId).map(edge => edge.target);
    return { inputs, outputs };
  };

  const renderActionNodeProperties = (node: Node) => {
    let data = node.data as any;
    
    // Handle backward compatibility with old format
    if (data.actions && Array.isArray(data.actions)) {
      data = data.actions[0] || { action: "SEND_CONTACT_REQUEST", provider: "LINKEDIN" };
    }
    
    const updateAction = (field: string, value: any) => {
      updateNodeData(node.id, { ...data, [field]: value });
    };

    return (
      <div className="space-y-3">
        <div>
          <Label>Action Type</Label>
          <Select
            value={data.action}
            onValueChange={(value) => updateAction("action", value)}
          >
            <SelectTrigger data-testid="select-action-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEND_CONTACT_REQUEST">SEND_CONTACT_REQUEST</SelectItem>
              <SelectItem value="SEND_MESSAGE">SEND_MESSAGE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Provider</Label>
          <Select
            value={data.provider}
            onValueChange={(value) => updateAction("provider", value)}
          >
            <SelectTrigger data-testid="select-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOVA">NOVA</SelectItem>
              <SelectItem value="LINKEDIN">LINKEDIN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.action === "SEND_MESSAGE" && (
          <div>
            <Label>Message</Label>
            <Textarea
              value={data.message || ""}
              onChange={(e) => updateAction("message", e.target.value)}
              placeholder="Enter your message..."
              rows={3}
              data-testid="textarea-message"
            />
          </div>
        )}
      </div>
    );
  };

  const renderConditionCheckNodeProperties = (node: Node) => {
    const data = node.data as ConditionCheckNodeData;
    
    const addCondition = () => {
      const newCondition: Condition = {
        condition: "IS_LINKEDIN_CONTACT",
        value: true,
      };
      updateNodeData(node.id, {
        conditions: [...data.conditions, newCondition],
      });
    };

    const removeCondition = (index: number) => {
      const newConditions = data.conditions.filter((_, i) => i !== index);
      updateNodeData(node.id, { conditions: newConditions });
    };

    const updateCondition = (index: number, field: keyof Condition, value: any) => {
      const newConditions = data.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      );
      updateNodeData(node.id, { conditions: newConditions });
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Conditions</Label>
          <Button 
            size="sm" 
            onClick={addCondition}
            data-testid="button-add-condition"
          >
            Add
          </Button>
        </div>

        {data.conditions.map((condition, index) => (
          <div key={index} className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Condition {index + 1}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCondition(index)}
                data-testid={`button-remove-condition-${index}`}
              >
                Remove
              </Button>
            </div>

            <div>
              <Label>Condition Type</Label>
              <Select
                value={condition.condition}
                onValueChange={(value) => updateCondition(index, "condition", value)}
              >
                <SelectTrigger data-testid={`select-condition-type-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IS_NOVA">IS_NOVA</SelectItem>
                  <SelectItem value="IS_NOVA_CONTACT">IS_NOVA_CONTACT</SelectItem>
                  <SelectItem value="IS_LINKEDIN_CONTACT">IS_LINKEDIN_CONTACT</SelectItem>
                  <SelectItem value="HAS_TIME_PASSED">HAS_TIME_PASSED</SelectItem>
                  <SelectItem value="HAS_REJECTED_CONTACT_NOVA">HAS_REJECTED_CONTACT_NOVA</SelectItem>
                  <SelectItem value="HAS_REJECTED_CONTACT_LINKEDIN">HAS_REJECTED_CONTACT_LINKEDIN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Value</Label>
              <Select
                value={condition.value.toString()}
                onValueChange={(value) => updateCondition(index, "value", value === "true")}
              >
                <SelectTrigger data-testid={`select-condition-value-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {condition.condition === "HAS_TIME_PASSED" && (
              <div>
                <Label>Time in Hours</Label>
                <Input
                  type="number"
                  value={condition.timeInHours || ""}
                  onChange={(e) => updateCondition(index, "timeInHours", parseInt(e.target.value) || 0)}
                  placeholder="Enter hours"
                  data-testid={`input-time-hours-${index}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!selectedNode) {
    return (
      <aside className="w-80 bg-card border-l border-border overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Properties</h2>
          <div className="text-sm text-muted-foreground">
            Select a node to edit its properties
          </div>
        </div>
      </aside>
    );
  }

  const { inputs, outputs } = getConnectedNodes(selectedNode.id);

  return (
    <aside className="w-80 bg-card border-l border-border overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Properties</h2>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-3">
              {selectedNode.type === "action" && (
                <i className="fas fa-play text-emerald-600"></i>
              )}
              {selectedNode.type === "condition" && (
                <i className="fas fa-question-circle text-amber-600"></i>
              )}
              {selectedNode.type === "condition_check" && (
                <i className="fas fa-check-circle text-red-600"></i>
              )}
              <h3 className="font-medium capitalize">
                {selectedNode.type?.replace("_", " ")} Node
                {selectedNode.id === firstNodeId && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-bold">
                    FIRST
                  </span>
                )}
              </h3>
            </div>

            {selectedNode.type === "action" && renderActionNodeProperties(selectedNode)}
            {selectedNode.type === "condition_check" && renderConditionCheckNodeProperties(selectedNode)}
            {selectedNode.type === "condition" && (
              <div className="text-sm text-muted-foreground">
                Condition nodes link to condition checks
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Node ID</h3>
            <div 
              className="font-mono text-sm text-muted-foreground bg-muted p-2 rounded"
              data-testid="text-node-id"
            >
              {selectedNode.id}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Connections</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inputs:</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {inputs.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Outputs:</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {outputs.length}
                </span>
              </div>
              {selectedNode.id === firstNodeId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Node Type:</span>
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-bold">
                    FIRST NODE
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
