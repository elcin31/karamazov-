"use client";
import { useEffect } from "react";
import {
  ReactFlow,
  useReactFlow,
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
      colorMode="light"
      ariaLabelConfig={{
        "controls.zoomIn.ariaLabel": "Увеличить",
        "controls.zoomOut.ariaLabel": "Уменьшить",
        "controls.fitView.ariaLabel": "Показать всю карту",
      }}
    >
      <ViewportUpdater signature={nodes.map((n) => n.id).join(",")} />
      <Background color="#bdb29e" gap={28} size={0.7} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(node) => (node.id === selected ? "#6c2933" : "#aa9c85")}
        maskColor="rgba(233,227,215,.7)"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}

function ViewportUpdater({ signature }: { signature: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const timer = setTimeout(() => {
      void fitView({ padding: 0.15, duration: 200, maxZoom: 1.2 });
    }, 60);
    return () => clearTimeout(timer);
  }, [signature, fitView]);
  return null;
}
