import React = require("react")
const classNames = require("classnames")

export
type Key = number|string

export
interface TreeNode<T> {
  value: T
  children?: TreeNode<T>[]
  key: Key
  collapsed?: boolean
}

export
interface TreeProps<T> {
  nodes: TreeNode<T>[]
  draggable: boolean
  childOffset: number
  renderNode: (node: TreeNode<T>, options: {selected: boolean, current: boolean}) => JSX.Element
  current?: Key
  selected?: Set<Key>
  //move: (src: number[][], dest: number[]) => void
  //copy: (src: number[][], dest: number[]) => void
  //toggleCollapsed: (path: number[], collapsed: boolean) => void
  //toggleSelected: (path: number[], selected: boolean) => void
  onCurrentChange: (key: Key) => void
}

export
class Tree<T> extends React.Component<TreeProps<T>, {}> {
  renderItems(nodes: TreeNode<T>[], parentPath: number[]) {
    const {childOffset, renderNode, onCurrentChange, current, selected} = this.props
    let elems: JSX.Element[] = []
    nodes.forEach((node, i) => {
      const {key} = node
      const path = [...parentPath, i]
      const style = {
        paddingLeft: parentPath.length * childOffset + "px",
      }
      const onClick = () => {
        onCurrentChange(key)
      }
      const isSelected = selected ? selected.has(key) : false
      const isCurrent = key == current
      const className = classNames(
        "ReactDraggableTree_Row",
        {
          "ReactDraggableTree_Row-selected": isSelected,
          "ReactDraggableTree_Row-current": isCurrent,
        }
      )
      elems.push(
        <div className={className} style={style} key={node.key} onClick={onClick}>
          {renderNode(node, {selected: isSelected, current: isCurrent})}
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
