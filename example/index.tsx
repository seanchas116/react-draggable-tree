import React = require("react")
import ReactDOM = require("react-dom")
import {Tree, TreeNode} from ".."
const classNames = require("classnames")

class MyTree extends Tree<string, string> {}

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

function ExampleCell(props: {value: string, selected: boolean, current: boolean}) {
  const {value, selected, current} = props
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

  toNode(item: ExampleItem): TreeNode<string, string> {
    return {
      value: item.value,
      key: item.key,
      children: item.children ? item.children.map(i => this.toNode(i)) : undefined
    }
  }

  render() {
    const changeCurrent = (key: string) => {
      this.currentKey = key
      this.forceUpdate()
    }
    const changeSelected = (keys: Set<string>) => {
      this.selectedKeys = keys
      this.forceUpdate()
    }

    return (
      <MyTree
        nodes={this.items.map(i => this.toNode(i))}
        current={this.currentKey}
        selected={this.selectedKeys}
        draggable={true}
        childOffset={16}
        renderNode={(node, {selected, current}) => <ExampleCell value={node.value} selected={selected} current={current} />}
        onSelectedChange={changeSelected}
        onCurrentChange={changeCurrent}
      />
    )
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Example />, document.getElementById("example"))
})
