import { Editor, Box } from 'tldraw';

export const WINDOW_SHAPE_TYPES = [
  'video-node',
  'audio-node',
  'image-node',
  'web-embed-node',
  'code-runner-node',
  'pdf-node',
  'table-node',
  'todo-node',
  'note-node',
];

/**
 * Organizes scattered canvas windows into an elegant, non-overlapping grid layout
 * and smoothly animates the camera to frame all windows in view.
 */
export function cleanUpCanvas(editor: Editor) {
  if (!editor) return;

  const allShapes = editor.getCurrentPageShapes();
  // Filter for interactive window nodes
  const windowShapes = allShapes.filter((s) => WINDOW_SHAPE_TYPES.includes(s.type));

  if (windowShapes.length === 0) {
    // If no window shapes, reset zoom to origin
    editor.resetZoom();
    return;
  }

  const N = windowShapes.length;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Determine optimal column count based on item count and aspect ratio
  let numCols = 1;
  if (isMobile) {
    numCols = 1;
  } else if (N >= 7) {
    numCols = 3;
  } else if (N >= 3) {
    numCols = 2;
  } else if (N === 2) {
    numCols = 2;
  } else {
    numCols = 1;
  }

  const numRows = Math.ceil(N / numCols);
  const GAP_X = isMobile ? 24 : 48;
  const GAP_Y = isMobile ? 32 : 48;

  // Group shapes by cell [row][col]
  const grid: (typeof windowShapes[0] | null)[][] = Array.from({ length: numRows }, () =>
    Array(numCols).fill(null)
  );

  windowShapes.forEach((shape, idx) => {
    const r = Math.floor(idx / numCols);
    const c = idx % numCols;
    grid[r][c] = shape;
  });

  // Calculate maximum column widths and row heights
  const colWidths: number[] = Array(numCols).fill(0);
  const rowHeights: number[] = Array(numRows).fill(0);

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const shape = grid[r][c];
      if (shape) {
        const w = (shape.props as any)?.w || 500;
        const h = (shape.props as any)?.h || 400;
        colWidths[c] = Math.max(colWidths[c], w);
        rowHeights[r] = Math.max(rowHeights[r], h);
      }
    }
  }

  // Calculate total grid width and height
  const totalWidth = colWidths.reduce((a, b) => a + b, 0) + (numCols - 1) * GAP_X;
  const totalHeight = rowHeights.reduce((a, b) => a + b, 0) + (numRows - 1) * GAP_Y;

  // Center the grid around origin (0, 0)
  const startX = -Math.round(totalWidth / 2);
  const startY = -Math.round(totalHeight / 2);

  // Compute column starting X positions
  const colXOffsets: number[] = [];
  let curX = startX;
  for (let c = 0; c < numCols; c++) {
    colXOffsets.push(curX);
    curX += colWidths[c] + GAP_X;
  }

  // Compute row starting Y positions
  const rowYOffsets: number[] = [];
  let curY = startY;
  for (let r = 0; r < numRows; r++) {
    rowYOffsets.push(curY);
    curY += rowHeights[r] + GAP_Y;
  }

  // Create shape updates
  const updates: any[] = [];
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const shape = grid[r][c];
      if (shape) {
        const cellX = colXOffsets[c];
        const cellY = rowYOffsets[r];
        const shapeW = (shape.props as any)?.w || 500;
        // Center shape horizontally within column if smaller than column max
        const offsetX = Math.round((colWidths[c] - shapeW) / 2);

        updates.push({
          id: shape.id,
          type: shape.type,
          x: cellX + offsetX,
          y: cellY,
        });
      }
    }
  }

  // Apply batch update in a single atomic history transaction
  editor.run(() => {
    editor.updateShapes(updates);
  });

  // Clear selection so user does not accidentally mass delete arranged windows with Backspace
  editor.selectNone();

  // Smoothly zoom camera to frame the organized layout with 80px breathing margin
  setTimeout(() => {
    try {
      const margin = 80;
      const targetBox = new Box(
        startX - margin,
        startY - margin,
        totalWidth + margin * 2,
        totalHeight + margin * 2
      );
      editor.zoomToBounds(targetBox, {
        animation: { duration: 420 },
        targetZoom: Math.min(1.0, editor.getZoomLevel()),
      });
    } catch {
      editor.zoomToSelection({ animation: { duration: 420 } });
    }
  }, 20);
}
