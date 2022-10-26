import { TreeViewItem } from "./TreeViewItem";

export interface ItemRow<T extends TreeViewItem> {
  item: T;
  depth: number;
}

export function getItemRows<T extends TreeViewItem>(
  item: T,
  depth: number
): ItemRow<T>[] {
  return [
    { item, depth },
    ...item.children.flatMap((child) => getItemRows(child, depth + 1)),
  ];
}
