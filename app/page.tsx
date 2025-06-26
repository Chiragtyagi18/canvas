"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd/dist/core/DndProvider";
import { useDrag } from 'react-dnd/dist/hooks/useDrag';
import { useDrop } from 'react-dnd/dist/hooks/useDrop';
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";


export type BlockType = "blockA" | "blockB";

export type Block = {
  id: string;
  type: BlockType;
  label: string;
  x: number;
  y: number;
  showMessage?: boolean;
};

const BLOCKS = [
  { id: "blockA", label: "Block A", type: "blockA" },
  { id: "blockB", label: "Block B", type: "blockB" },
] as const;

const DraggableBlock = ({ block }: { block: { id: string; label: string; type: BlockType } }) => {
  const [, drag] = useDrag(() => ({
    type: "block",
    item: { type: block.type },
  }));

  return drag(
    <div className="p-2 m-2 bg-blue-200 rounded cursor-move">
      {block.label}
    </div>
  );
};


const CanvasBlock = ({ block, moveBlock, registerRef, toggleMessage }: { block: Block; moveBlock: (id: string, x: number, y: number) => void; registerRef: (id: string, ref: HTMLDivElement | null) => void; toggleMessage: (id: string) => void; }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const position = useRef<{ x: number; y: number }>({ x: block.x, y: block.y });

  useEffect(() => {
    if (ref.current) registerRef(block.id, ref.current);
  }, [block.id, registerRef]);

  const [,drag] = useDrag(() => ({
    type: "canvasBlock",
    item: { id: block.id },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  const [, drop] = useDrop({
    accept: "canvasBlock",
    hover: (item: { id: string }, monitor) => {
      if (!ref.current) return;
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;
      const newX = position.current.x + delta.x;
      const newY = position.current.y + delta.y;
      moveBlock(item.id, newX, newY);
    },
    drop: (item: { id: string }, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return;
      position.current = {
        x: position.current.x + delta.x,
        y: position.current.y + delta.y,
      };
    }
  });

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleMessage(block.id);
  };

  return (
    <div
      ref={(node) => {
        ref.current = node;
        if (node) drag(drop(node));
      }}
      onContextMenu={handleRightClick}
      className="absolute p-2 bg-green-300 rounded cursor-move z-30"
      style={{ left: block.x, top: block.y }}
    >
      <div>{block.label}</div>
      {block.showMessage && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 text-xs bg-black text-white px-2 py-1 rounded shadow z-40">
          Hello World
        </div>
      )}
    </div>
  );
};

const ConnectionLines = ({ blocks, refs, canvasRef }: { 
  blocks: Block[]; 
  refs: { [id: string]: HTMLDivElement | null };
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [pairs, setPairs] = useState<[Block, Block][]>([]);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const updateConnections = () => {
      const newPairs: [Block, Block][] = [];
      const aBlocks = blocks.filter(b => b.type === "blockA");
      const bBlocks = blocks.filter(b => b.type === "blockB");

      bBlocks.forEach(b => {
        const nearestA = aBlocks.reduce((nearest, a) => {
          const aRef = refs[a.id];
          const bRef = refs[b.id];
          if (!aRef || !bRef) return nearest;
          
          const ax = aRef.offsetLeft;
          const ay = aRef.offsetTop;
          const bx = bRef.offsetLeft;
          const by = bRef.offsetTop;
          
          const dist = Math.hypot(ax - bx, ay - by);
          return !nearest || dist < nearest.dist ? { a, dist } : nearest;
        }, null as null | { a: Block; dist: number });

        if (nearestA) newPairs.push([nearestA.a, b]);
      });

      setPairs(newPairs);
      
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasOffset({ x: rect.left, y: rect.top });
      }
    };

    updateConnections();

    window.addEventListener('resize', updateConnections);
    return () => window.removeEventListener('resize', updateConnections);
  }, [blocks, refs, canvasRef]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="red" />
        </marker>
      </defs>
      {pairs.map(([a, b]) => {
        const aRef = refs[a.id];
        const bRef = refs[b.id];
        if (!aRef || !bRef) return null;

        const aRect = aRef.getBoundingClientRect();
        const bRect = bRef.getBoundingClientRect();

        return (
          <line
            key={`${a.id}-${b.id}`}
            x1={aRect.left + aRect.width/2 - (canvasOffset?.x || 0)}
            y1={aRect.top + aRect.height/2 - (canvasOffset?.y || 0)}
            x2={bRect.left + bRect.width/2 - (canvasOffset?.x || 0)}
            y2={bRect.top + bRect.height/2 - (canvasOffset?.y || 0)}
            stroke="red"
            strokeWidth={2}
            markerEnd="url(#arrow)"
          />
        );
      })}
    </svg>
  );
};


const Canvas = ({ 
  blocks, 
  moveBlock, 
  onDropBlock, 
  registerRef, 
  refs, 
  toggleMessage 
}: { 
  blocks: Block[]; 
  moveBlock: (id: string, x: number, y: number) => void; 
  onDropBlock: (type: BlockType, x: number, y: number) => void; 
  registerRef: (id: string, ref: HTMLDivElement | null) => void; 
  refs: { [id: string]: HTMLDivElement | null }; 
  toggleMessage: (id: string) => void; 
}) => {
   const canvasRef = useRef<HTMLDivElement | null>(null);

  const [, drop] = useDrop({
    accept: "block",
    drop: (item: { type: BlockType }, monitor) => {
      const offset = monitor.getClientOffset();
      if (canvasRef.current && offset) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = offset.x - rect.left;
        const y = offset.y - rect.top;
        onDropBlock(item.type, x, y);
      }
    },
  });

  useEffect(() => {
    if (canvasRef.current) drop(canvasRef.current);
  }, [drop]);

  return (
    <div ref={canvasRef} className="canvas-container flex-1 min-h-[500px] bg-white border relative overflow-hidden rounded">
      <ConnectionLines blocks={blocks} refs={refs} canvasRef={canvasRef} />
      {blocks.map((block) => (
        <CanvasBlock
          key={block.id}
          block={block}
          moveBlock={moveBlock}
          registerRef={registerRef}
          toggleMessage={toggleMessage}
        />
      ))}
    </div>
  );
};


export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [history, setHistory] = useState<Block[][]>([[]]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const blocksRef = useRef<Block[]>([]);
  const blockRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  const registerRef = useCallback((id: string, ref: HTMLDivElement | null) => {
    blockRefs.current[id] = ref;
  }, []);

  const moveBlock = (id: string, x: number, y: number) => {
    setBlocks((prev) => {
      const updated = prev.map((block) =>
        block.id === id ? { ...block, x, y } : block
      );
      blocksRef.current = updated;
      return updated;
    });
  };

  const toggleMessage = (id: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, showMessage: !block.showMessage } : block
      )
    );
  };

  const handleDropBlock = (type: BlockType, x: number, y: number) => {
    if (type === "blockB" && !blocks.some((b) => b.type === "blockA")) {
      alert("Block B requires Block A first!");
      return;
    }

    const newBlock: Block = {
      id: uuidv4(),
      type,
      label: `Block ${type === "blockA" ? "A" : "B"}`,
      x,
      y,
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    blocksRef.current = newBlocks;

    const updatedHistory = [...history.slice(0, currentIndex + 1), newBlocks];
    setHistory(updatedHistory);
    setCurrentIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const prevState = history[newIndex];
      setBlocks(prevState);
      blocksRef.current = prevState;
      setCurrentIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const nextState = history[newIndex];
      setBlocks(nextState);
      blocksRef.current = nextState;
      setCurrentIndex(newIndex);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen p-4 gap-2 bg-gray-900">
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
            moveBlock={moveBlock}
            onDropBlock={handleDropBlock}
            registerRef={registerRef}
            refs={blockRefs.current}
            toggleMessage={toggleMessage}
          />
          <div className="w-48 bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Toolbox</h2>
            {BLOCKS.map((block) => (
              <DraggableBlock key={block.id} block={block} />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
