import React = require("react")
const classNames = require("classnames")

export
interface TreeNode<T> {
  value: T
  children?: TreeNode<T>[]
  key: string
  current: boolean
  selected: boolean
  collapsed: boolean
}

export
interface TreeProps<T> {
  nodes: TreeNode<T>[]
  draggable: boolean
  childOffset: number
  renderNode: (node: TreeNode<T>) => JSX.Element
  //move: (src: number[][], dest: number[]) => void
  //copy: (src: number[][], dest: number[]) => void
  //toggleCollapsed: (path: number[], collapsed: boolean) => void
  //toggleSelected: (path: number[], selected: boolean) => void
  changeCurrent: (path: number[]) => void
}

export
class Tree<T> extends React.Component<TreeProps<T>, {}> {
  renderItems(nodes: TreeNode<T>[], parentPath: number[]) {
    const {childOffset, renderNode, changeCurrent} = this.props
    let elems: JSX.Element[] = []
    nodes.forEach((node, i) => {
      const path = [...parentPath, i]
      const style = {
        paddingLeft: parentPath.length * childOffset + "px",
      }
      const onClick = () => {
        changeCurrent(path)
      }
      const className = classNames(
        "ReactDraggableTree_Row",
        {
          "ReactDraggableTree_Row-selected": node.selected,
          "ReactDraggableTree_Row-current": node.current,
        }
      )
      elems.push(
        <div className={className} style={style} key={node.key} onClick={onClick}>
          {renderNode(node)}
        </div>
      )
      if (node.children) {
        elems.push(...this.renderItems(node.children, path))
      }
    })
    return elems
  }

  render() {
    const {nodes} = this.props

    return (
      <div className="ReactDraggableTree">
        {this.renderItems(nodes, [])}
      </div>
    )
  }
}
