require("./example.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
import {Tree, TreeDelegate, RowInfo} from "../src"
const classNames = require("classnames")
const loremIpsum = require("lorem-ipsum")

class ExampleItem {
  static nextKey = 0
  key = ExampleItem.nextKey++

  constructor(public text: string, public children: ExampleItem[]|undefined, public collapsed: boolean) {
  }

  getDescendant(path: number[]): ExampleItem|undefined {
    if (path.length == 0) {
      return this
    } else if (this.children) {
      return this.children[path[0]].getDescendant(path.slice(1))
    }
  }

  clone(): ExampleItem {
    return new ExampleItem(
      this.text,
      this.children ? this.children.map(c => c.clone()) : undefined,
      this.collapsed
    )
  }

  static generate(depth: number, minChildCount: number, maxChildCount: number): ExampleItem {
    const text: string = loremIpsum({sentenceLowerBound: 2, sentenceUpperBound: 4})
    const hasChild = depth > 1
    let children: ExampleItem[]|undefined = undefined
    if (hasChild) {
      children = []
      const childCount = Math.round(Math.random() * (maxChildCount - minChildCount) + minChildCount)
      for (let i = 0; i < childCount; ++i) {
        children.push(ExampleItem.generate(depth - 1, minChildCount, maxChildCount))
      }
    }
    return new ExampleItem(text, children, false)
  }
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
    this.view.setState({selectedKeys})
  }
  onCollapsedChange(info: RowInfo<ExampleItem>, collapsed: boolean) {
    info.item.collapsed = collapsed
    this.view.setState({root: this.view.state.root})
  }
  onMove(src: RowInfo<ExampleItem>[], dest: RowInfo<ExampleItem>, destIndex: number, destIndexAfter: number) {
    const {root} = this.view.state
    const items: ExampleItem[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {path} = src[i]
      const index = path[path.length - 1]
      const parent = root.getDescendant(path.slice(0, -1))!
      const [item] = parent.children!.splice(index, 1)
      items.unshift(item)
    }
    dest.item.children!.splice(destIndexAfter, 0, ...items)
    dest.item.collapsed = false
    this.view.setState({root})
  }
  onCopy(src: RowInfo<ExampleItem>[], dest: RowInfo<ExampleItem>, destIndex: number) {
    const {root} = this.view.state
    const items: ExampleItem[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {path} = src[i]
      const index = path[path.length - 1]
      const parent = root.getDescendant(path.slice(0, -1))!
      const item = parent.children![index].clone()
      items.unshift(item)
    }
    dest.item.children!.splice(destIndex, 0, ...items)
    dest.item.collapsed = false
    this.view.setState({root})
  }
}

interface ExampleState {
  root: ExampleItem
  selectedKeys: Set<number>
}

class Example extends React.Component<{}, ExampleState> {
  delegate = new ExampleDelegate(this)

  constructor() {
    super()
    const root = ExampleItem.generate(4, 2, 4)
    this.state = {
      root,
      selectedKeys: new Set([root.children![0].key])
    }
  }

  render() {
    const {root, selectedKeys} = this.state
    return (
      <ExampleTree
        root={root}
        selectedKeys={selectedKeys}
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

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Example />, document.getElementById("example"))
})
