require("./example.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
import {TreeView, TreeRowInfo, TreeItem} from "../src"
const classNames = require("classnames")
import {ExampleItem} from './ExampleItem'

const getStructure = (item: ExampleItem): TreeItem => {
  return {
    children: item.children && item.children.map(getStructure),
    key: item.key,
    collapsed: item.collapsed
  }
}

interface ExampleTreeState {
  root: ExampleItem
  selectedKeys: Set<number>
}

class ExampleTree extends React.Component<{}, ExampleTreeState> {
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
      <TreeView
        root={getStructure(root)}
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
    info.item.collapsed = collapsed
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
