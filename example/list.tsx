require("./example.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
const classNames = require("classnames")
import {ListView, ListDelegate, ListRowInfo} from "../src"
import {ExampleItem} from './ExampleItem'

class ExampleListDelegate implements ListDelegate<ExampleItem> {
  constructor(public view: ExampleList) {
  }
  renderRow(info: ListRowInfo<ExampleItem>) {
    return ExampleRow(info)
  }
  getKey(item: ExampleItem) {
    return item.key
  }
  onContextMenu(info: ListRowInfo<ExampleItem>|undefined, ev: React.MouseEvent<Element>) {
    if (info) {
      console.log(`Context menu at ${info.index}`)
    } else {
      console.log(`Context menu at blank space`)
    }
  }
  onSelectedKeysChange(selectedKeys: Set<number>) {
    this.view.setState({selectedKeys})
  }
  onCollapsedChange(info: ListRowInfo<ExampleItem>, collapsed: boolean) {
    info.item.collapsed = collapsed
    this.view.setState({items: this.view.state.items})
  }
  onMove(src: ListRowInfo<ExampleItem>[], dest: ListRowInfo<ExampleItem>, destIndexAfter: number) {
    const {items} = this.view.state
    const itemsToMove: ExampleItem[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {index} = src[i]
      const [item] = items.splice(index, 1)
      itemsToMove.unshift(item)
    }
    items.splice(destIndexAfter, 0, ...itemsToMove)
    this.view.setState({items})
  }
  onCopy(src: ListRowInfo<ExampleItem>[], dest: ListRowInfo<ExampleItem>) {
    const {items} = this.view.state
    const itemsToCopy: ExampleItem[] = []
    for (let i = src.length - 1; i >= 0; --i) {
      const {index} = src[i]
      const item = items[index].clone()
      itemsToCopy.unshift(item)
    }
    items.splice(dest.index, 0, ...itemsToCopy)
    this.view.setState({items})
  }
}

interface ExampleListState {
  items: ExampleItem[]
  selectedKeys: Set<number>
}

class ExampleList extends React.Component<{}, ExampleListState> {
  delegate = new ExampleListDelegate(this)

  constructor() {
    super()
    const items: ExampleItem[] = []
    for (let i = 0; i < 10; ++i) {
      items.push(ExampleItem.generate(1, 0, 0))
    }
    this.state = {
      items,
      selectedKeys: new Set([items[0].key])
    }
  }

  render() {
    const {items, selectedKeys} = this.state
    const ExampleListView = ListView as new () => ListView<ExampleItem>
    return (
      <ExampleListView
        items={items}
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
  ReactDOM.render(<ExampleList />, document.getElementById("example"))
})
