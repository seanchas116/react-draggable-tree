import { TreeViewItem } from "./TreeViewItem";

export interface TreeViewItemRow<T extends TreeViewItem> {
  item: T;
  depth: number;
}

export function getItemRows<T extends TreeViewItem>(
  item: T,
  depth: number
): TreeViewItemRow<T>[] {
  return [
    { item, depth },
    ...item.children.flatMap((child) => getItemRows(child, depth + 1)),
  ];
}
