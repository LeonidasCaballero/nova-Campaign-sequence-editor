export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 bg-card border-r border-border p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-foreground mb-4">Node Library</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Actions
          </h3>
          <div className="space-y-2">
            <div
              className="node-action bg-card border border-border rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow"
              draggable
              onDragStart={(event) => onDragStart(event, "action")}
              data-testid="palette-action"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-play text-emerald-600"></i>
                <div>
                  <div className="text-sm font-medium">Action</div>
                  <div className="text-xs text-muted-foreground">Single action step</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Conditions
          </h3>
          <div className="space-y-2">
            <div
              className="node-condition bg-card border border-border rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow"
              draggable
              onDragStart={(event) => onDragStart(event, "condition")}
              data-testid="palette-condition"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-question-circle text-amber-600"></i>
                <div>
                  <div className="text-sm font-medium">Condition</div>
                  <div className="text-xs text-muted-foreground">Conditional branching</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Condition Checks
          </h3>
          <div className="space-y-2">
            <div
              className="node-condition-check bg-card border border-border rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow"
              draggable
              onDragStart={(event) => onDragStart(event, "condition_check")}
              data-testid="palette-condition-check"
            >
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle text-red-600"></i>
                <div>
                  <div className="text-sm font-medium">Condition Check</div>
                  <div className="text-xs text-muted-foreground">Validate conditions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
