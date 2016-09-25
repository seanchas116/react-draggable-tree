import React = require("react")
import ReactDOM = require("react-dom")
import {DraggableTree, DraggableItem} from "../src/DraggableTree"
const classNames = require("classnames")

class MyTree extends DraggableTree<string> {}

interface ExampleItem {
  value: string
  key: string
  children?: ExampleItem[]
}

function itemAt(items: ExampleItem[], path: number[]): ExampleItem {
  const at = items[path[0]]
  if (path.length == 1) {
    return at
  } else {
    return itemAt(at.children!, path.slice(1))
  }
}

function ExampleCell(props: {item: DraggableItem<string>}) {
  const {value, selected, current} = props.item
  return <div className={classNames("example-cell", {selected, current})}>{value}</div>
}

class Example extends React.Component<{}, {}> {
  items: ExampleItem[] = [
    {value: "Foo", key: "0"},
    {value: "Bar", key: "1"},
    {value: "Baz", key: "2", children: [
      {value: "Lorem", key: "3"},
      {value: "ipsum", key: "4", children: [
        {value: "dolor", key: "5"},
        {value: "sit", key: "6"},
        {value: "amet", key: "7"},
      ]},
    ]},
  ]
  currentKey = "0"
  selectedKeys = new Set<string>()
  collapsedKeys = new Set<string>()

  treeItem(item: ExampleItem): DraggableItem<string> {
    return {
      value: item.value,
      key: item.key,
      current: item.key == this.currentKey,
      selected: this.selectedKeys.has(item.key),
      collapsed: this.collapsedKeys.has(item.key),
      children: item.children ? item.children.map(i => this.treeItem(i)) : undefined
    }
  }

  render() {
    const changeCurrent = (path: number[]) => {
      this.currentKey = itemAt(this.items, path).key
      this.forceUpdate()
    }

    return (
      <MyTree
        items={this.items.map(i => this.treeItem(i))}
        draggable={true}
        childOffset={16}
        renderItem={item => <ExampleCell item={item} />}
        changeCurrent={changeCurrent}
      />
    )
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Example />, document.getElementById("example"))
})
