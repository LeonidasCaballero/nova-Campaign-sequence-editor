import { Node, Edge } from "reactflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionNodeData, ConditionNodeData, ConditionCheck, ConditionChild } from "@shared/schema";

interface PropertiesPanelProps {
  selectedNode: Node | null;
  updateNodeData: (nodeId: string, newData: any) => void;
  nodes: Node[];
  edges: Edge[];
}

export default function PropertiesPanel({
  selectedNode,
  updateNodeData,
  nodes,
  edges,
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

  const renderConditionNodeProperties = (node: Node) => {
    const data = node.data as ConditionNodeData;
    
    const addChild = () => {
      const newChild: ConditionChild = {
        nextStepId: null,
        checks: [{
          condition: "IS_LINKEDIN_CONTACT",
          value: true,
        }],
      };
      updateNodeData(node.id, {
        child: [...data.child, newChild],
      });
    };

    const removeChild = (index: number) => {
      const newChildren = data.child.filter((_, i) => i !== index);
      updateNodeData(node.id, { child: newChildren });
    };

    const updateChild = (childIndex: number, field: keyof ConditionChild, value: any) => {
      const newChildren = data.child.map((child, i) =>
        i === childIndex ? { ...child, [field]: value } : child
      );
      updateNodeData(node.id, { child: newChildren });
    };

    const addCheck = (childIndex: number) => {
      const newCheck: ConditionCheck = {
        condition: "IS_LINKEDIN_CONTACT",
        value: true,
      };
      const newChildren = data.child.map((child, i) =>
        i === childIndex ? { ...child, checks: [...child.checks, newCheck] } : child
      );
      updateNodeData(node.id, { child: newChildren });
    };

    const removeCheck = (childIndex: number, checkIndex: number) => {
      const newChildren = data.child.map((child, i) =>
        i === childIndex ? { ...child, checks: child.checks.filter((_, j) => j !== checkIndex) } : child
      );
      updateNodeData(node.id, { child: newChildren });
    };

    const updateCheck = (childIndex: number, checkIndex: number, field: keyof ConditionCheck, value: any) => {
      const newChildren = data.child.map((child, i) =>
        i === childIndex ? {
          ...child,
          checks: child.checks.map((check, j) =>
            j === checkIndex ? { ...check, [field]: value } : check
          )
        } : child
      );
      updateNodeData(node.id, { child: newChildren });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Condition Paths</Label>
          <Button 
            size="sm" 
            onClick={addChild}
            data-testid="button-add-child"
          >
            Add Path
          </Button>
        </div>

        {data.child.map((child, childIndex) => (
          <div key={childIndex} className="bg-muted p-3 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Path {childIndex + 1}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeChild(childIndex)}
                data-testid={`button-remove-child-${childIndex}`}
              >
                Remove
              </Button>
            </div>

            <div>
              <Label>Next Step ID</Label>
              <Input
                value={child.nextStepId || ""}
                onChange={(e) => updateChild(childIndex, "nextStepId", e.target.value || null)}
                placeholder="Enter next step ID or leave empty"
                data-testid={`input-next-step-${childIndex}`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Checks</Label>
                <Button 
                  size="sm" 
                  onClick={() => addCheck(childIndex)}
                  data-testid={`button-add-check-${childIndex}`}
                >
                  Add Check
                </Button>
              </div>

              {child.checks.map((check, checkIndex) => (
                <div key={checkIndex} className="bg-background p-2 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Check {checkIndex + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCheck(childIndex, checkIndex)}
                      data-testid={`button-remove-check-${childIndex}-${checkIndex}`}
                    >
                      Remove
                    </Button>
                  </div>

                  <div>
                    <Label>Condition Type</Label>
                    <Select
                      value={check.condition}
                      onValueChange={(value) => updateCheck(childIndex, checkIndex, "condition", value)}
                    >
                      <SelectTrigger data-testid={`select-condition-type-${childIndex}-${checkIndex}`}>
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
                      value={check.value.toString()}
                      onValueChange={(value) => updateCheck(childIndex, checkIndex, "value", value === "true")}
                    >
                      <SelectTrigger data-testid={`select-condition-value-${childIndex}-${checkIndex}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {check.condition === "HAS_TIME_PASSED" && (
                    <div>
                      <Label>Time in Hours</Label>
                      <Input
                        type="number"
                        value={check.conditionExtraValue?.timeInHours || ""}
                        onChange={(e) => updateCheck(childIndex, checkIndex, "conditionExtraValue", {
                          timeInHours: parseInt(e.target.value) || 0
                        })}
                        placeholder="Enter hours"
                        data-testid={`input-time-hours-${childIndex}-${checkIndex}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
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
              <h3 className="font-medium capitalize">
                {selectedNode.type?.replace("_", " ")} Node
              </h3>
            </div>

            {selectedNode.type === "action" && renderActionNodeProperties(selectedNode)}
            {selectedNode.type === "condition" && renderConditionNodeProperties(selectedNode)}
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
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
