import { Node, Edge } from "reactflow";

interface HeaderProps {
  nodes: Node[];
  edges: Edge[];
  deleteSelectedNode: () => void;
  hasSelectedNode: boolean;
}

export default function Header({
  nodes,
  edges,
  deleteSelectedNode,
  hasSelectedNode,
}: HeaderProps) {

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <i className="fas fa-project-diagram text-primary text-xl"></i>
          <h1 className="text-xl font-bold text-foreground">Flow Builder</h1>
        </div>
        <div className="text-sm text-muted-foreground">Visual Node Editor</div>
      </div>

    </header>
  );
}
