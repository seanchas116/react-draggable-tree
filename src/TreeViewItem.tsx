import React, { ReactNode } from "react";

export interface TreeViewItem {
  readonly key: string;
  readonly parent: TreeViewItem | undefined;
  readonly children: readonly TreeViewItem[];

  renderRow(params: { depth: number; indentation: number }): ReactNode;

  handleDragStart?(params: { event: React.DragEvent }): boolean;
  handleDragEnd?(): void;

  canDropData?(params: {
    event: React.DragEvent;
    draggedItem: TreeViewItem | undefined; // undefined if the drag is not initiated from a tree view
  }): boolean;
  handleDrop?(params: {
    event: React.DragEvent;
    draggedItem: TreeViewItem | undefined; // undefined if the drag is not initiated from a tree view
    before: TreeViewItem | undefined;
  }): void;
}

export class EmptyTreeViewItem implements TreeViewItem {
  get key(): string {
    return "";
  }
  get parent(): TreeViewItem | undefined {
    return undefined;
  }
  renderRow(): ReactNode {
    return <></>;
  }
  get children(): TreeViewItem[] {
    return [];
  }
}
