import React = require("react")
import ReactDOM = require("react-dom")
import {Tree, TreeNode} from "../src/DraggableTree"
const classNames = require("classnames")

class MyTree extends Tree<string> {}

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

function ExampleCell(props: {node: TreeNode<string>}) {
  const {value, selected, current} = props.node
  return <div className={classNames("example-cell", {selected, current})}>{value}</div>
}

class Example extends React.Component<{}, {}> {
  items: ExampleItem[] = [
    {value: "Foo", key: "0"},
    {value: "Baz", key: "2", children: [
      {value: "Lorem", key: "3"},
      {value: "ipsum", key: "4", children: [
        {value: "dolor", key: "5"},
        {value: "sit", key: "6"},
        {value: "amet", key: "7"},
      ]},
    ]},
    {value: "Bar", key: "1"},
  ]
  currentKey = "0"
  selectedKeys = new Set<string>()
  collapsedKeys = new Set<string>()

  toNode(item: ExampleItem): TreeNode<string> {
    return {
      value: item.value,
      key: item.key,
      current: item.key == this.currentKey,
      selected: this.selectedKeys.has(item.key),
      collapsed: this.collapsedKeys.has(item.key),
      children: item.children ? item.children.map(i => this.toNode(i)) : undefined
    }
  }

  render() {
    const changeCurrent = (path: number[]) => {
      this.currentKey = itemAt(this.items, path).key
      this.forceUpdate()
    }

    return (
      <MyTree
        nodes={this.items.map(i => this.toNode(i))}
        draggable={true}
        childOffset={16}
        renderNode={node => <ExampleCell node={node} />}
        changeCurrent={changeCurrent}
      />
    )
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Example />, document.getElementById("example"))
})
