require("./example.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
const classNames = require("classnames")
const loremIpsum = require("lorem-ipsum")
import {TreeView, TreeRowInfo, TreeNode} from "../src"

export
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

const toTreeNode = (item: ExampleItem): TreeNode => {
  return {
    children: item.children && item.children.map(toTreeNode),
    key: item.key,
    collapsed: item.collapsed
  }
}

interface ExampleTreeState {
  root: ExampleItem
  selectedKeys: Set<number>
}

class ExampleTree extends React.Component<{}, ExampleTreeState> {
  constructor(props: {}) {
    super(props)
    const root = ExampleItem.generate(4, 2, 4)
    this.state = {
      root,
      selectedKeys: new Set([root.children![0].key])
    }
  }

  render() {
    const {root, selectedKeys} = this.state
    return (
      <TreeView
        root={toTreeNode(root)}
        selectedKeys={selectedKeys}
        rowHeight={40}
        renderRow={this.renderRow}
        onContextMenu={this.onContextMenu}
        onSelectedKeysChange={this.onSelectedKeysChange}
        onCollapsedChange={this.onCollapsedChange}
        onMove={this.onMove}
        onCopy={this.onCopy}
      />
    )
  }

  renderRow = (info: TreeRowInfo) => {
    const item = this.state.root.getDescendant(info.path)!
    const {selected} = info
    return <div className={classNames("example-cell", {selected})}>{item.text}</div>
  }

  onContextMenu = (info: TreeRowInfo|undefined, ev: React.MouseEvent<Element>) => {
    if (info) {
      console.log(`Context menu at ${info.path}`)
    } else {
      console.log(`Context menu at blank space`)
    }
  }
  onSelectedKeysChange = (selectedKeys: Set<number>) => {
    this.setState({selectedKeys})
  }
  onCollapsedChange = (info: TreeRowInfo, collapsed: boolean) => {
    this.state.root.getDescendant(info.path)!.collapsed = collapsed
    this.setState({root: this.state.root})
  }
  onMove = (src: TreeRowInfo[], dest: TreeRowInfo, destIndex: number, destIndexAfter: number) => {
    const {root} = this.state
    const items: ExampleItem[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {path} = src[i]
      const index = path[path.length - 1]
      const parent = root.getDescendant(path.slice(0, -1))!
      const [item] = parent.children!.splice(index, 1)
      items.unshift(item)
    }
    const destItem = root.getDescendant(dest.path)!
    destItem.children!.splice(destIndexAfter, 0, ...items)
    destItem.collapsed = false
    this.setState({root})
  }
  onCopy = (src: TreeRowInfo[], dest: TreeRowInfo, destIndex: number) => {
    const {root} = this.state
    const items: ExampleItem[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {path} = src[i]
      const index = path[path.length - 1]
      const parent = root.getDescendant(path.slice(0, -1))!
      const item = parent.children![index].clone()
      items.unshift(item)
    }
    const destItem = root.getDescendant(dest.path)!
    destItem.children!.splice(destIndex, 0, ...items)
    destItem.collapsed = false
    this.setState({root})
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<ExampleTree />, document.getElementById("example"))
})
