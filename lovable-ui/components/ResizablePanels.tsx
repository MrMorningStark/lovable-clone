"use client";

import { useState, useRef, useEffect, ReactNode, useCallback } from "react";

interface ResizablePanelsProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  initialLeftWidth?: number; // percentage
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
}

export default function ResizablePanels({
  leftPanel,
  rightPanel,
  initialLeftWidth = 30,
  minLeftWidth = 20,
  maxLeftWidth = 80,
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    // Cancel previous animation frame if it exists
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates and throttling
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Clamp between min and max
      const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
      
      setLeftWidth(clampedWidth);
      rafRef.current = null;
    });
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="flex h-full w-full relative"
    >
      {/* Left Panel */}
      <div 
        className="flex flex-col bg-gray-900 border-r border-gray-700 transition-none"
        style={{ 
          width: `${leftWidth}%`,
          willChange: isDragging ? 'width' : 'auto',
          transform: isDragging ? 'translate3d(0, 0, 0)' : 'none'
        }}
      >
        {leftPanel}
      </div>

      {/* Resizer */}
      <div
        className={`
          w-1 bg-gray-700 hover:bg-gray-600 cursor-col-resize relative
          flex items-center justify-center group transition-colors select-none
          ${isDragging ? 'bg-blue-500' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle */}
        <div className="absolute inset-y-0 -left-2 -right-2 flex items-center justify-center">
          <div className={`
            w-1 h-8 bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 
            transition-opacity duration-200
            ${isDragging ? 'opacity-100 bg-blue-500' : ''}
          `} />
        </div>
      </div>

      {/* Right Panel */}
      <div 
        className="flex flex-col bg-gray-800 transition-none"
        style={{ 
          width: `${100 - leftWidth}%`,
          willChange: isDragging ? 'width' : 'auto',
          transform: isDragging ? 'translate3d(0, 0, 0)' : 'none'
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}