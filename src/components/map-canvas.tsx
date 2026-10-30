"use client";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
export default function MapCanvas({
  nodes,
  edges,
  selected,
  onSelect,
}: {
  nodes: Node[];
  edges: Edge[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodeClick={(_, node) => onSelect(node.id)}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.25}
      maxZoom={1.5}
      nodesDraggable={false}
      nodesConnectable={false}
      attributionPosition="bottom-left"
      colorMode="dark"
      ariaLabelConfig={{
        "controls.zoomIn.ariaLabel": "Увеличить",
        "controls.zoomOut.ariaLabel": "Уменьшить",
        "controls.fitView.ariaLabel": "Показать всю карту",
      }}
    >
      <Background color="#474338" gap={28} size={0.7} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(node) => (node.id === selected ? "#b49c6b" : "#585043")}
        maskColor="rgba(20,20,17,.7)"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}
