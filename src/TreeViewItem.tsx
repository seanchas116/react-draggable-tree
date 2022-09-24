export interface TreeViewItem {
  key: string;
  parent: this | undefined;
  children: this[];
}
