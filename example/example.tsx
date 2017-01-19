require("./example.css")
require("../lib/index.css")
import React = require("react")
import ReactDOM = require("react-dom")
import {Tree, TreeNode, NodeInfo} from "../src"
const classNames = require("classnames")
const loremIpsum = require("lorem-ipsum")

interface MyNode extends TreeNode {
  text: string
}
class MyTree extends Tree<MyNode> {}

class Example extends React.Component<{}, {}> {
  root = generateNode(4, 2, 4)
  selectedKeys = new Set([this.root.children![0].key])

  render() {
    const onContextMenu = (info: NodeInfo<MyNode>) => {
      console.log(`Context menu at ${info.path}`)
    }
    const onSelectedKeysChange = (selectedKeys: Set<number>) => {
      this.selectedKeys = selectedKeys
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
        selectedKeys={this.selectedKeys}
        rowHeight={40}
        rowContent={MyRowContent}
        onSelectedKeysChange={onSelectedKeysChange}
        onCollapsedChange={onCollapsedChange}
        onContextMenu={onContextMenu}
        onMove={onMove}
        onCopy={onCopy}
      />
    )
  }
}

function MyRowContent(props: {node: MyNode, selected: boolean}) {
  const {node, selected} = props
  return <div className={classNames("example-cell", {selected})}>{node.text}</div>
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

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Example />, document.getElementById("example"))
})