require("./index.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
import {Tree, TreeNode, NodeInfo} from "../src"
const classNames = require("classnames")

interface MyNode extends TreeNode {
  value: string
}
class MyTree extends Tree<MyNode> {}

function ExampleCell(props: {value: string, selected: boolean, current: boolean}) {
  const {value, selected, current} = props
  return <div className={classNames("example-cell", {selected, current})}>{value}</div>
}

function nodeForPath(node: MyNode, path: number[]): MyNode|undefined {
  if (path.length == 0) {
    return node
  } else if (node.children) {
    return nodeForPath(node.children[path[0]], path.slice(1))
  }
}

let currentKey = 0

class Example extends React.Component<{}, {}> {
  root: MyNode = {
    value: "root",
    key: currentKey++,
    children: [
      {value: "Foo", key: currentKey++},
      {value: "ipsum", key: currentKey++, collapsed: true, children: [
        {value: "dolor", key: currentKey++},
        {value: "sit", key: currentKey++},
        {value: "amet", key: currentKey++},
      ]},
      {value: "Baz", key: currentKey++, children: [
        {value: "Lorem", key: currentKey++},
        {value: "ipsum", key: currentKey++, collapsed: true, children: [
          {value: "dolor", key: currentKey++},
          {value: "sit", key: currentKey++},
          {value: "amet", key: currentKey++},
        ]},
      ]},
      {value: "Bar", key: currentKey++},
    ],
  }
  currentKey = this.root.children![0].key
  selectedKeys = new Set([this.currentKey])

  render() {
    const changeCurrent = (key: number) => {
      this.currentKey = key
      this.forceUpdate()
    }
    const changeSelected = (keys: Set<number>) => {
      this.selectedKeys = keys
      this.forceUpdate()
    }
    const onCollapsedChange = (info: NodeInfo<MyNode>, collapsed: boolean) => {
      info.node.collapsed = collapsed
      this.forceUpdate()
    }
    const onMove = (src: NodeInfo<MyNode>[], dest: NodeInfo<MyNode>, destIndex: number) => {
      const nodes: MyNode[] = []
      for (let i = src.length - 1; i >= 0; --i) {
        const {path} = src[i]
        const index = path[path.length - 1]
        const parent = nodeForPath(this.root, path.slice(0, -1))!
        const [node] = parent.children!.splice(index, 1)
        nodes.unshift(node)
      }
      dest.node.children!.splice(destIndex, 0, ...nodes)
      dest.node.collapsed = false
      this.forceUpdate()
    }
    const onCopy = (src: NodeInfo<MyNode>[], dest: NodeInfo<MyNode>, index: number) => {
    }

    return (
      <MyTree
        root={this.root}
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
