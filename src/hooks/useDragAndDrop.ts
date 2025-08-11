import { useState, useCallback } from "react";

export interface DraggableItem {
  id: string;
  type: string;
  content: string;
  title?: string;
  position?: { x: number; y: number };
}

export interface DragState {
  isDragging: boolean;
  draggedItem: DraggableItem | null;
  dragOffset: { x: number; y: number };
}

export function useDragAndDrop<T extends DraggableItem>(
  initialItems: T[] = []
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOffset: { x: 0, y: 0 }
  });

  const handleDragStart = useCallback((
    event: React.DragEvent,
    item: T,
    offset: { x: number; y: number } = { x: 0, y: 0 }
  ) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOffset: offset
    });

    // Set drag data
    event.dataTransfer.setData('text/plain', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
    
    // Create custom drag image (optional)
    if (event.dataTransfer.setDragImage) {
      const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.transform = 'rotate(5deg)';
      dragImage.style.opacity = '0.8';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, offset.x, offset.y);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOffset: { x: 0, y: 0 }
    });
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((
    event: React.DragEvent,
    targetIndex?: number,
    targetPosition?: { x: number; y: number }
  ) => {
    event.preventDefault();
    
    try {
      const draggedData = JSON.parse(event.dataTransfer.getData('text/plain')) as T;
      
      setItems(prevItems => {
        const newItems = [...prevItems];
        const draggedIndex = newItems.findIndex(item => item.id === draggedData.id);
        
        if (draggedIndex === -1) {
          // Adding new item
          const newItem = { ...draggedData };
          if (targetPosition) {
            newItem.position = targetPosition;
          }
          newItems.push(newItem);
        } else {
          // Moving existing item
          const [draggedItem] = newItems.splice(draggedIndex, 1);
          
          if (targetIndex !== undefined) {
            newItems.splice(targetIndex, 0, draggedItem);
          } else if (targetPosition) {
            draggedItem.position = targetPosition;
            newItems.push(draggedItem);
          }
        }
        
        return newItems;
      });
    } catch (error) {
      console.error('Error handling drop:', error);
    }
    
    handleDragEnd();
  }, [handleDragEnd]);

  const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      return newItems;
    });
  }, []);

  const addItem = useCallback((item: T) => {
    setItems(prevItems => [...prevItems, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }, []);

  return {
    items,
    setItems,
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    reorderItems,
    addItem,
    removeItem,
    updateItem
  };
}