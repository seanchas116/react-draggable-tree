import { TreeViewItem } from "./TreeViewItem";

export interface TreeViewProps<T extends TreeViewItem> {
  rootItem: T;

  header?: React.ReactNode;
  footer?: React.ReactNode;
  indentation?: number;
  dropIndicatorOffset?: number;
  nonReorderable?: boolean;
  DropBetweenIndicator: React.ComponentType;
  DropOverIndicator: React.ComponentType;
  className?: string;
  hidden?: boolean;
  style?: React.CSSProperties;

  onBackgroundClick?: () => void;

  renderRow: (
    item: T,
    params: { depth: number; indentation: number }
  ) => JSX.Element;

  handleDragStart: (item: T, params: { event: React.DragEvent }) => boolean;
  handleDragEnd?: (item: T) => void;
  canDropData?: (
    item: T,
    params: {
      event: React.DragEvent;
      draggedItem: T | undefined; // undefined if the drag is not initiated from a tree view
    }
  ) => boolean;
  handleDrop?: (
    item: T,
    params: {
      event: React.DragEvent;
      draggedItem: T | undefined; // undefined if the drag is not initiated from a tree view
      before: T | undefined;
    }
  ) => void;
}