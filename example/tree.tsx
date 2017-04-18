require("./example.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
import {TreeView, TreeDelegate, RowInfo} from "../src"
const classNames = require("classnames")
import {ExampleItem} from './ExampleItem'

class ExampleTreeDelegate implements TreeDelegate<ExampleItem> {
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

interface ExampleTreeState {
  root: ExampleItem
  selectedKeys: Set<number>
}

class ExampleTree extends React.Component<{}, ExampleTreeState> {
  delegate = new ExampleTreeDelegate(this)

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
    const ExampleTreeView = TreeView as new () => TreeView<ExampleItem>
    return (
      <ExampleTreeView
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
  ReactDOM.render(<ExampleTree />, document.getElementById("example"))
})
