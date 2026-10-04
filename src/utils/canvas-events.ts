import React, { useEffect, RefObject } from 'react';

/**
 * Stops pointer and mouse events from bubbling up to the tldraw canvas.
 * Prevents tldraw's SelectTool from capturing pointerdown and canceling clicks or focus.
 */
export const stopCanvasPropagation = (
  e: React.SyntheticEvent | React.PointerEvent | React.MouseEvent | React.TouchEvent | any
) => {
  if (!e) return;
  e.stopPropagation();
  if (e.nativeEvent) {
    e.nativeEvent.stopPropagation?.();
    e.nativeEvent.stopImmediatePropagation?.();
  }
};

/**
 * Stops wheel events from bubbling up to the tldraw canvas.
 */
export const stopCanvasWheelPropagation = (
  e: React.WheelEvent | WheelEvent | any
) => {
  if (!e) return;
  e.stopPropagation();
  if (e.nativeEvent) {
    e.nativeEvent.stopPropagation?.();
    e.nativeEvent.stopImmediatePropagation?.();
  }
};

/**
 * React hook to isolate mouse wheel and trackpad scroll events to a tool or window frame.
 * Prevents tldraw's canvas (.tl-canvas) from capturing the wheel event and zooming or panning
 * the entire canvas while the user is hovering over this tool.
 *
 * If the element directly under the cursor is not already a scrollable container (e.g. tool header,
 * window controls, or frame border), it automatically scrolls the primary scrollable viewport
 * inside the tool so scrolling is always responsive anywhere over the tool.
 */
export function useIsolateCanvasWheel(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // 1. Prevent the wheel event from bubbling to tldraw's canvas (.tl-canvas)
      e.stopPropagation();

      // 2. Check if the hovered element or any of its ancestors up to el is already scrollable
      let target: Element | null = e.target as Element;
      let hasScrollable = false;

      while (target && target !== el) {
        if (target instanceof HTMLElement) {
          const style = window.getComputedStyle(target);
          const canScrollY =
            (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            target.scrollHeight > target.clientHeight;
          const canScrollX =
            (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
            target.scrollWidth > target.clientWidth;

          if (canScrollY || canScrollX) {
            hasScrollable = true;
            break;
          }
        }
        target = target.parentElement;
      }

      // 3. If hovering over a non-scrollable area of the tool (like title bar or padding),
      // forward scroll to the primary scrollable container inside this tool
      if (!hasScrollable) {
        const scrollCandidate = el.querySelector<HTMLElement>(
          '[data-slot="scroll-area-viewport"], [data-radix-scroll-area-viewport], .overflow-y-auto, .overflow-auto, textarea, [data-scrollable="true"]'
        );

        if (scrollCandidate) {
          scrollCandidate.scrollTop += e.deltaY;
          if (e.deltaX) {
            scrollCandidate.scrollLeft += e.deltaX;
          }
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [ref]);
}

/**
 * Event props to spread onto interactive buttons, clickable icons, and sliders.
 */
export const interactiveProps = {
  onPointerDown: stopCanvasPropagation,
  onMouseDown: stopCanvasPropagation,
  onTouchStart: stopCanvasPropagation,
};

/**
 * Event props to spread onto text inputs, textareas, and contenteditable fields.
 */
export const textInputProps = {
  onPointerDown: stopCanvasPropagation,
  onMouseDown: stopCanvasPropagation,
  onTouchStart: stopCanvasPropagation,
};

/**
 * Stops keyboard events from triggering tldraw canvas shortcuts while typing.
 */
export const stopKeyPropagation = (e: React.KeyboardEvent) => {
  e.stopPropagation();
};
