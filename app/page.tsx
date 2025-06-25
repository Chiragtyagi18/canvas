"use client";

import React, { useState, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type Block = {
  id: string;
  label: string;
};

const BLOCKS: Block[] = [
  { id: "blockA", label: "Block A" },
  { id: "blockB", label: "Block B" },
];

const DraggableBlock = ({ block }: { block: Block }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "block",
    item: block,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef}
      className={`p-2 m-2 bg-blue-200 rounded cursor-move ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {block.label}
    </div>
  );
};

const CanvasBlock = ({
  block,
  onContextMenu,
}: {
  block: Block;
  onContextMenu: (x: number, y: number) => void;
}) => {
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY);
      }}
      className="p-2 m-2 bg-green-300 rounded cursor-pointer"
    >
      {block.label}
    </div>
  );
};

const ContextMenu = ({
  visible,
  x,
  y,
}: {
  visible: boolean;
  x: number;
  y: number;
}) => {
  if (!visible) return null;
  return (
    <div
      className="absolute bg-white border shadow px-2 py-1 z-10"
      style={{ top: y, left: x }}
    >
      Hello World
    </div>
  );
};

const Canvas = ({
  blocks,
  onDropBlock,
  onContextMenu,
}: {
  blocks: Block[];
  onDropBlock: (block: Block) => void;
  onContextMenu: (x: number, y: number) => void;
}) => {
  const [, drop] = useDrop(() => ({
    accept: "block",
    drop: (item: Block) => onDropBlock(item),
  }));

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) drop(containerRef);
  }, [drop]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-[400px] bg-white border border-dashed border-gray-500 p-4 relative rounded"
    >
      <div className="flex flex-wrap">
        {blocks.map((block, index) => (
          <CanvasBlock
            key={index}
            block={block}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [history, setHistory] = useState<Block[][]>([[]]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const blocksRef = useRef<Block[]>([]);

  const handleDropBlock = (block: Block) => {
    const currentBlocks = blocksRef.current.map((b) => b.id);

    if (block.id === "blockB" && !currentBlocks.includes("blockA")) {
      alert("Block B requires Block A first!");
      return;
    }

    const newBlocks = [...blocksRef.current, block];
    blocksRef.current = newBlocks;
    setBlocks(newBlocks);

    const updatedHistory = [...history.slice(0, currentIndex + 1), newBlocks];
    setHistory(updatedHistory);
    setCurrentIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setBlocks(history[newIndex]);
      blocksRef.current = history[newIndex];
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setBlocks(history[newIndex]);
      blocksRef.current = history[newIndex];
    }
  };

  const handleContextMenu = (x: number, y: number) => {
    setContextMenu({ visible: true, x, y });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        onClick={closeContextMenu}
        className="flex flex-col h-screen p-4 gap-2"
        style={{ backgroundColor: "#0A0F10" }}
      >
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleUndo}
            className="bg-white text-black px-3 py-1 rounded disabled:opacity-50"
            disabled={currentIndex === 0}
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            className="bg-white text-black px-3 py-1 rounded disabled:opacity-50"
            disabled={currentIndex === history.length - 1}
          >
            Redo
          </button>
        </div>

        <div className="flex flex-1 gap-4">
          <Canvas
            blocks={blocks}
            onDropBlock={handleDropBlock}
            onContextMenu={handleContextMenu}
          />

          <div className="w-48 bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Toolbox</h2>
            {BLOCKS.map((block) => (
              <DraggableBlock key={block.id} block={block} />
            ))}
          </div>

          <ContextMenu {...contextMenu} />
        </div>
      </div>
    </DndProvider>
  );
}
