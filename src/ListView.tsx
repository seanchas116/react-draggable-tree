import * as React from 'react'
import {TreeView, TreeDelegate, TreeRowInfo} from './TreeView'

export type Key = number | string

export interface ListRowInfo<T> {
  item: T
  selected: boolean
  index: number
  visible: boolean
  visibleOffset: number
}

export interface ListDelegate<T> {
  getKey(item: T): Key
  renderRow(info: ListRowInfo<T>): JSX.Element
  onMove(src: ListRowInfo<T>[], destIndexBefore: number, destIndexAfter: number): void
  onCopy(src: ListRowInfo<T>[], destIndexBefore: number): void
  onContextMenu(info: ListRowInfo<T>|undefined, ev: React.MouseEvent<Element>): void
  onSelectedKeysChange(keys: Set<Key>, rows: ListRowInfo<T>[]): void
}

export interface ListViewProps<T> {
  items: T[]
  rowHeight: number
  indent?: number
  selectedKeys: Set<Key>
  delegate: ListDelegate<T>
}

interface ListTreeItemChild<T> {
  type: "child"
  item: T
}

interface ListTreeItemRoot<T> {
  type: "root"
  children: ListTreeItemChild<T>[]
}
type ListTreeItem<T> = ListTreeItemChild<T> | ListTreeItemRoot<T>

function toListRowInfo<T>(treeRowInfo: TreeRowInfo<ListTreeItem<T>>): ListRowInfo<T> {
  return {
    item: (treeRowInfo.item as ListTreeItemChild<T>).item,
    selected: treeRowInfo.selected,
    index: treeRowInfo.path[0],
    visible: treeRowInfo.visible,
    visibleOffset: treeRowInfo.visibleOffset
  }
}

class ListTreeDelegate<T> implements TreeDelegate<ListTreeItem<T>> {
  constructor(public delegate: ListDelegate<T>) {
  }
  renderRow(info: TreeRowInfo<ListTreeItem<T>>) {
    return this.delegate.renderRow(toListRowInfo(info))
  }
  getChildren(item: ListTreeItem<T>) {
    if (item.type == 'root') {
      return item.children
    }
  }
  getDroppable(src: ListTreeItem<T>, dst: ListTreeItem<T>) {
    return true
  }
  getKey(item: ListTreeItem<T>): Key {
    if (item.type === 'child') {
      return this.delegate.getKey(item.item)
    } else {
      return ''
    }
  }
  getCollapsed(item: ListTreeItem<T>) {
    return false
  }
  onMove(src: TreeRowInfo<ListTreeItem<T>>[], dest: TreeRowInfo<ListTreeItem<T>>, destIndexBefore: number, destIndexAfter: number) {
    this.delegate.onMove(src.map(toListRowInfo), destIndexBefore, destIndexAfter)
  }
  onCopy(src: TreeRowInfo<ListTreeItem<T>>[], dest: TreeRowInfo<ListTreeItem<T>>, destIndexBefore: number) {
    this.delegate.onCopy(src.map(toListRowInfo), destIndexBefore)
  }
  onContextMenu(info: TreeRowInfo<ListTreeItem<T>>|undefined, ev: React.MouseEvent<Element>) {
    this.delegate.onContextMenu(info && toListRowInfo(info), ev)
  }
  onCollapsedChange(info: TreeRowInfo<ListTreeItem<T>>, collapsed: boolean) {
  }
  onSelectedKeysChange(selectedKeys: Set<Key>, selectedInfos: TreeRowInfo<ListTreeItem<T>>[]) {
    this.delegate.onSelectedKeysChange(selectedKeys, selectedInfos.map(toListRowInfo))
  }
}

export class ListView<T> extends React.Component<ListViewProps<T>, {}> {

  render() {
    const delegate: TreeDelegate<ListTreeItem<T>> = new ListTreeDelegate(this.props.delegate)
    const children = this.props.items.map((item): ListTreeItemChild<T> => ({
      type: 'child',
      item
    }))
    const root: ListTreeItem<T> = {
      type: 'root',
      children
    }
    const ListTreeView = TreeView as new () => TreeView<ListTreeItem<T>>
    return <ListTreeView
      root={root}
      rowHeight={this.props.rowHeight}
      indent={this.props.indent}
      selectedKeys={this.props.selectedKeys}
      delegate={delegate}
    />
  }
}
