import React, { ReactNode } from "react";

export interface TreeViewItem {
  readonly key: string;
  readonly parent: TreeViewItem | undefined;
  readonly children: readonly TreeViewItem[];

  renderRow(params: { depth: number; indentation: number }): ReactNode;

  handleDragStart?(params: { event: React.DragEvent }): void;
  handleDragEnd?(): void;

  canDropData?(params: {
    event: React.DragEvent;
    draggedItem: TreeViewItem | undefined;
  }): boolean;
  handleDrop?(params: {
    event: React.DragEvent;
    draggedItem: TreeViewItem | undefined;
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
