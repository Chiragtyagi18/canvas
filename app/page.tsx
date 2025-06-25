"use client";

import React, {
  useState,
  useRef,
  useEffect,
  type RefObject,
  type FC,
} from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// ---------- Types ----------
interface Block {
  id: string;
  label: string;
}

interface DraggableBlockProps {
  block: Block;
}

interface CanvasBlockProps {
  block: Block;
  onContextMenu: (x: number, y: number, block: Block) => void;
}

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
}

interface CanvasProps {
  onDropBlock: (block: Block) => void;
  blocks: Block[];
  onContextMenu: (x: number, y: number, block: Block) => void;
}

// ---------- Block Options ----------
const BLOCKS: Block[] = [
  { id: "blockA", label: "Block A" },
  { id: "blockB", label: "Block B" },
];

// ---------- Draggable Toolbox Block ----------
const DraggableBlock: FC<DraggableBlockProps> = ({ block }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "block",
    item: { ...block },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      drag(divRef);
    }
  }, [drag]);

  return (
    <div
      ref={divRef}
      className={`p-2 m-2 bg-blue-200 rounded cursor-move ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {block.label}
    </div>
  );
};

// ---------- Canvas Block ----------
const CanvasBlock: FC<CanvasBlockProps> = ({ block, onContextMenu }) => (
  <div
    onContextMenu={(e) => {
      e.preventDefault();
      onContextMenu(e.clientX, e.clientY, block);
    }}
    className="p-2 m-2 bg-green-300 rounded cursor-pointer"
  >
    {block.label}
  </div>
);

// ---------- Context Menu ----------
const ContextMenu: FC<ContextMenuProps> = ({ visible, x, y }) => {
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

// ---------- Canvas Area ----------
const Canvas: FC<CanvasProps> = ({ onDropBlock, blocks, onContextMenu }) => {
  const [, drop] = useDrop(() => ({
    accept: "block",
    drop: (item: Block) => onDropBlock(item),
  }));

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      drop(containerRef);
    }
  }, [drop]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-[400px] border border-dashed border-gray-500 p-4 relative bg-white rounded"

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


// ---------- Main Page ----------
export default function Home() {
  const blocksRef = useRef<Block[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [history, setHistory] = useState<Block[][]>([[]]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [context, setContext] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  const handleDropBlock = (block: Block) => {
    const ids = blocksRef.current.map((b) => b.id);

    if (block.id === "blockB" && !ids.includes("blockA")) {
      alert("Block B requires Block A first!");
      return;
    }

    const newBlocks = [...blocksRef.current, block];
    blocksRef.current = newBlocks;
    setBlocks(newBlocks);

    const newHistory = [...history.slice(0, currentIndex + 1), newBlocks];
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
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

  const handleContextMenu = (x: number, y: number, block: Block) => {
    setContext({ visible: true, x, y });
  };

  const closeContext = () => {
    setContext((prev) => ({ ...prev, visible: false }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
  onClick={closeContext}
  className="flex flex-col h-screen p-4 gap-2"
  style={{ backgroundColor: "#0f1042" }}
>

        {/* Undo/Redo Buttons */}
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


        {/* Main Content */}
        <div className="flex flex-1 gap-4">
          <Canvas
            onDropBlock={handleDropBlock}
            blocks={blocks}
            onContextMenu={handleContextMenu}
          />
          <div className="w-48 bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Toolbox</h2>
            {BLOCKS.map((block) => (
              <DraggableBlock key={block.id} block={block} />
            ))}
          </div>
          <ContextMenu {...context} />
        </div>
      </div>
    </DndProvider>
  );
}
