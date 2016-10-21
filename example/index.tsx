require("./index.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
import {Tree, TreeNode, NodeInfo} from "../src"
const classNames = require("classnames")

interface MyNode extends TreeNode<string, string> {}
class MyTree extends Tree<string, string> {}

function ExampleCell(props: {value: string, selected: boolean, current: boolean}) {
  const {value, selected, current} = props
  return <div className={classNames("example-cell", {selected, current})}>{value}</div>
}

function nodeForPath(nodes: MyNode[], path: number[]): MyNode {
  const child = nodes[path[0]]
  if (path.length == 1) {
    return child
  } else {
    return nodeForPath(child.children!, path.slice(1))
  }
}

class Example extends React.Component<{}, {}> {
  nodes: MyNode[] = [
    {value: "Foo", key: "0"},
    {value: "ipsum", key: "8", collapsed: true, children: [
      {value: "dolor", key: "9"},
      {value: "sit", key: "10"},
      {value: "amet", key: "11"},
    ]},
    {value: "Baz", key: "2", children: [
      {value: "Lorem", key: "3"},
      {value: "ipsum", key: "4", collapsed: true, children: [
        {value: "dolor", key: "5"},
        {value: "sit", key: "6"},
        {value: "amet", key: "7"},
      ]},
    ]},
    {value: "Bar", key: "1"},
  ]
  currentKey = "0"
  selectedKeys = new Set<string>(["0"])


  render() {
    const changeCurrent = (key: string) => {
      this.currentKey = key
      this.forceUpdate()
    }
    const changeSelected = (keys: Set<string>) => {
      this.selectedKeys = keys
      this.forceUpdate()
    }
    const onCollapsedChange = (path: number[], collapsed: boolean) => {
      nodeForPath(this.nodes, path).collapsed = collapsed
      this.forceUpdate()
    }
    const onMove = (src: number[][], dest: number[]) => {
    }
    const onCopy = (src: number[][], dest: number[]) => {
    }

    return (
      <MyTree
        nodes={this.nodes}
        current={this.currentKey}
        selected={this.selectedKeys}
        draggable={true}
        rowHeight={40}
        indent={16}
        renderNode={({node, selected, current}) => <ExampleCell value={node.value} selected={selected} current={current} />}
        onSelectedChange={changeSelected}
        onCurrentChange={changeCurrent}
        onCollapsedChange={onCollapsedChange}
        onMove={onMove}
        onCopy={onCopy}
      />
    )
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Example />, document.getElementById("example"))
})
