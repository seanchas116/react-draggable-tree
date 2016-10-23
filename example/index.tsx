require("./index.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
import {Tree, TreeNode, NodeInfo, Selection} from "../src"
const classNames = require("classnames")
const loremIpsum = require("lorem-ipsum")

interface MyNode extends TreeNode {
  text: string
}
class MyTree extends Tree<MyNode> {}

function ExampleCell(props: {text: string, selected: boolean, current: boolean}) {
  const {text, selected, current} = props
  return <div className={classNames("example-cell", {selected, current})}>{text}</div>
}

function nodeForPath(node: MyNode, path: number[]): MyNode|undefined {
  if (path.length == 0) {
    return node
  } else if (node.children) {
    return nodeForPath(node.children[path[0]], path.slice(1))
  }
}

function cloneNode(node: MyNode): MyNode {
  return {
    text: node.text,
    key: currentKey++,
    children: node.children ? node.children.map(cloneNode) : undefined,
    collapsed: node.collapsed
  }
}

let currentKey = 0

function generateNode(depth: number, minChildCount: number, maxChildCount: number): MyNode {
  const text: string = loremIpsum({sentenceLowerBound: 2, sentenceUpperBound: 4})
  const hasChild = depth > 1
  let children: MyNode[]|undefined = undefined
  if (hasChild) {
    children = []
    const childCount = Math.round(Math.random() * (maxChildCount - minChildCount) + minChildCount)
    for (let i = 0; i < childCount; ++i) {
      children.push(generateNode(depth - 1, minChildCount, maxChildCount))
    }
  }
  const key = currentKey++
  return {
    text,
    key,
    children
  }
}

class Example extends React.Component<{}, {}> {
  root = generateNode(4, 2, 4)
  selection: Selection = {
    currentKey: this.root.children![0].key,
    selectedKeys: new Set([this.root.children![0].key,]),
  }

  render() {
    const onSelectionChange = (selection: Selection) => {
      this.selection = selection
      this.forceUpdate()
    }
    const onCollapsedChange = (info: NodeInfo<MyNode>, collapsed: boolean) => {
      info.node.collapsed = collapsed
      this.forceUpdate()
    }
    const onMove = (src: NodeInfo<MyNode>[], dest: NodeInfo<MyNode>, destIndex: number, destIndexAfter: number) => {
      const nodes: MyNode[] = []
      for (let i = src.length - 1; i >= 0; --i) {
        const {path} = src[i]
        const index = path[path.length - 1]
        const parent = nodeForPath(this.root, path.slice(0, -1))!
        const [node] = parent.children!.splice(index, 1)
        nodes.unshift(node)
      }
      dest.node.children!.splice(destIndexAfter, 0, ...nodes)
      dest.node.collapsed = false
      this.forceUpdate()
    }
    const onCopy = (src: NodeInfo<MyNode>[], dest: NodeInfo<MyNode>, destIndex: number) => {
      const nodes: MyNode[] = []
      for (let i = src.length - 1; i >= 0; --i) {
        const {path} = src[i]
        const index = path[path.length - 1]
        const parent = nodeForPath(this.root, path.slice(0, -1))!
        const node = cloneNode(parent.children![index])
        nodes.unshift(node)
      }
      dest.node.children!.splice(destIndex, 0, ...nodes)
      dest.node.collapsed = false
      this.forceUpdate()
    }

    return (
      <MyTree
        root={this.root}
        selection={this.selection}
        draggable={true}
        rowHeight={40}
        indent={16}
        renderNode={({node, selected, current}) => <ExampleCell text={node.text} selected={selected} current={current} />}
        onSelectionChange={onSelectionChange}
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
