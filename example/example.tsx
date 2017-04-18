require("./example.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
import {Tree, TreeDelegate, RowInfo} from "../src"
const classNames = require("classnames")
const loremIpsum = require("lorem-ipsum")

interface ExampleItem {
  key: number
  text: string
  children: ExampleItem[]|undefined
  collapsed?: boolean
}
class ExampleTree extends Tree<ExampleItem> {}

class ExampleDelegate implements TreeDelegate<ExampleItem> {
  constructor(public view: Example) {
  }
  renderRow(info: RowInfo<ExampleItem>) {
    return ExampleRow(info)
  }
  getChildren(item: ExampleItem) {
    return item.children
  }
  getDroppable(item: ExampleItem) {
    return true
  }
  getKey(item: ExampleItem) {
    return item.key
  }
  getCollapsed(item: ExampleItem) {
    return !!item.collapsed
  }
  onContextMenu(info: RowInfo<ExampleItem>|undefined, ev: React.MouseEvent<Element>) {
    if (info) {
      console.log(`Context menu at ${info.path}`)
    } else {
      console.log(`Context menu at blank space`)
    }
  }
  onSelectedKeysChange(selectedKeys: Set<number>) {
    this.view.selectedKeys = selectedKeys
    this.view.forceUpdate()
  }
  onCollapsedChange(info: RowInfo<ExampleItem>, collapsed: boolean) {
    info.item.collapsed = collapsed
    this.view.forceUpdate()
  }
  onMove(src: RowInfo<ExampleItem>[], dest: RowInfo<ExampleItem>, destIndex: number, destIndexAfter: number) {
    const items: ExampleItem[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {path} = src[i]
      const index = path[path.length - 1]
      const parent = itemForPath(this.view.root, path.slice(0, -1))!
      const [item] = parent.children!.splice(index, 1)
      items.unshift(item)
    }
    dest.item.children!.splice(destIndexAfter, 0, ...items)
    dest.item.collapsed = false
    this.view.forceUpdate()
  }
  onCopy(src: RowInfo<ExampleItem>[], dest: RowInfo<ExampleItem>, destIndex: number) {
    const items: ExampleItem[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {path} = src[i]
      const index = path[path.length - 1]
      const parent = itemForPath(this.view.root, path.slice(0, -1))!
      const item = cloneItem(parent.children![index])
      items.unshift(item)
    }
    dest.item.children!.splice(destIndex, 0, ...items)
    dest.item.collapsed = false
    this.view.forceUpdate()
  }
}

class Example extends React.Component<{}, {}> {
  root = generateItem(4, 2, 4)
  selectedKeys = new Set([this.root.children![0].key])
  delegate = new ExampleDelegate(this)

  render() {
    return (
      <ExampleTree
        root={this.root}
        selectedKeys={this.selectedKeys}
        rowHeight={40}
        delegate={this.delegate}
      />
    )
  }
}

function ExampleRow(props: {item: ExampleItem, selected: boolean}) {
  const {item, selected} = props
  return <div className={classNames("example-cell", {selected})}>{item.text}</div>
}

function itemForPath(item: ExampleItem, path: number[]): ExampleItem|undefined {
  if (path.length == 0) {
    return item
  } else if (item.children) {
    return itemForPath(item.children[path[0]], path.slice(1))
  }
}

function cloneItem(item: ExampleItem): ExampleItem {
  return {
    text: item.text,
    key: currentKey++,
    children: item.children ? item.children.map(cloneItem) : undefined,
    collapsed: item.collapsed
  }
}

let currentKey = 0

function generateItem(depth: number, minChildCount: number, maxChildCount: number): ExampleItem {
  const text: string = loremIpsum({sentenceLowerBound: 2, sentenceUpperBound: 4})
  const hasChild = depth > 1
  let children: ExampleItem[]|undefined = undefined
  if (hasChild) {
    children = []
    const childCount = Math.round(Math.random() * (maxChildCount - minChildCount) + minChildCount)
    for (let i = 0; i < childCount; ++i) {
      children.push(generateItem(depth - 1, minChildCount, maxChildCount))
    }
  }
  const key = currentKey++
  return {
    text,
    key,
    children
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Example />, document.getElementById("example"))
})
