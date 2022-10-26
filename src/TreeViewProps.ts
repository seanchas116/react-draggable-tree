import React from "react";
import { TreeViewItem } from "./TreeViewItem";
import { ItemRow } from "./ItemRow";

export interface TreeViewProps<T extends TreeViewItem> {
  rootItem: T;

  header?: React.ReactNode;
  footer?: React.ReactNode;
  indentation?: number;
  dropIndicatorOffset?: number;
  nonReorderable?: boolean;
  dropBetweenIndicator: (params: { top: number; left: number }) => JSX.Element;
  dropOverIndicator: (params: { top: number; height: number }) => JSX.Element;
  className?: string;
  hidden?: boolean;
  style?: React.CSSProperties;

  onBackgroundClick?: () => void;

  renderRow: (params: {
    rows: readonly ItemRow<T>[];
    index: number;
    item: T;
    depth: number;
    indentation: number;
  }) => JSX.Element;

  handleDragStart: (params: { item: T; event: React.DragEvent }) => boolean;
  handleDragEnd?: (params: { item: T }) => void;
  canDrop?: (params: {
    item: T;
    event: React.DragEvent;
    draggedItem: T | undefined; // undefined if the drag is not initiated from a tree view
  }) => boolean;
  handleDrop?: (params: {
    item: T;
    event: React.DragEvent;
    draggedItem: T | undefined; // undefined if the drag is not initiated from a tree view
    before: T | undefined;
  }) => void;
}
