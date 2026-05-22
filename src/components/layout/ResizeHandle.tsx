"use client";

import { useState } from "react";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function ResizeHandle({ onMouseDown }: ResizeHandleProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 w-1 cursor-col-resize select-none group"
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="absolute inset-0 transition-colors duration-150"
        style={{
          backgroundColor: hovered
            ? "var(--color-scriva-accent)"
            : "var(--border)",
        }}
      />
      {/* Wider invisible hit area for easier grabbing */}
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}
