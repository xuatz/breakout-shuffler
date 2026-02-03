import { useState, useRef, useEffect, useMemo } from 'react';
import { ReactSketchCanvas, type ReactSketchCanvasRef, type ReactSketchCanvasProps } from 'react-sketch-canvas';
import { Modal } from './Modal';

interface GroupLayoutMapProps {
  roomId: string;
  isHost: boolean;
  layoutData?: string; // JSON string of canvas paths
  onSave?: (data: string) => void;
}

// Canvas configuration
const CANVAS_CONFIG: Partial<ReactSketchCanvasProps> = {
  width: '100%',
  height: '400px',
  strokeWidth: 2,
  strokeColor: 'black',
  canvasColor: 'white',
  style: { borderRadius: '0.375rem' },
};

// Detect if the device is desktop (non-touch or has a mouse)
const isDesktop = () => {
  // Check if the device supports hover (typically desktops/laptops)
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
};

export function GroupLayoutMap({
  roomId,
  isHost,
  layoutData,
  onSave,
}: GroupLayoutMapProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  
  // Memoize desktop check to avoid recalculating on every render
  const desktop = useMemo(() => isDesktop(), []);

  // Load existing layout data when component mounts or layoutData changes
  useEffect(() => {
    if (layoutData && canvasRef.current) {
      try {
        const paths = JSON.parse(layoutData);
        canvasRef.current.loadPaths(paths);
      } catch (e) {
        console.error('Failed to load layout data:', e);
      }
    }
  }, [layoutData]);

  const handleSave = async () => {
    if (canvasRef.current) {
      const paths = await canvasRef.current.exportPaths();
      const pathsString = JSON.stringify(paths);
      onSave?.(pathsString);
      setIsDrawing(false);
      setShowModal(false);
    }
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
  };

  // Don't show the draw button for non-hosts or on mobile devices
  if (!isHost || !desktop) {
    // Still show the layout map if there's data
    if (layoutData) {
      return (
        <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Group Layout Map
          </h3>
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded">
            <ReactSketchCanvas
              ref={canvasRef}
              {...CANVAS_CONFIG}
            />
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Group Layout Map
          </h3>
          <button
            onClick={() => {
              setShowModal(true);
              setIsDrawing(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            {layoutData ? 'Edit Map' : 'Draw Map'}
          </button>
        </div>

        {layoutData && !showModal && (
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded">
            <ReactSketchCanvas
              ref={canvasRef}
              {...CANVAS_CONFIG}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        title="Draw Group Layout Map"
        onClose={() => {
          setShowModal(false);
          setIsDrawing(false);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded">
            <ReactSketchCanvas
              ref={canvasRef}
              {...CANVAS_CONFIG}
            />
          </div>

          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Undo
              </button>
              <button
                onClick={handleRedo}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Redo
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
              >
                Clear
              </button>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
