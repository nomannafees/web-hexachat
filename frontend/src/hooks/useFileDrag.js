import { useEffect } from "react";

const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");

/**
 * Calls `onDragStart` when the user starts dragging files over the page.
 * While `enabled` is true it also stops the browser from opening a dropped
 * file in a new tab. `onDragStart` should be stable (wrap it in useCallback).
 */
export default function useFileDrag(enabled, onDragStart) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handleEnter = (event) => {
      if (hasFiles(event)) onDragStart();
    };

    // Without these two the browser would navigate to the dropped file.
    const allowDrop = (event) => {
      if (hasFiles(event)) event.preventDefault();
    };

    window.addEventListener("dragenter", handleEnter);
    window.addEventListener("dragover", allowDrop);
    window.addEventListener("drop", allowDrop);

    return () => {
      window.removeEventListener("dragenter", handleEnter);
      window.removeEventListener("dragover", allowDrop);
      window.removeEventListener("drop", allowDrop);
    };
  }, [enabled, onDragStart]);
}