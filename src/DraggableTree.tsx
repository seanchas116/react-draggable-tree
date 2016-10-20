import React = require("react")
const classNames = require("classnames")

export
interface TreeNode<TValue, TKey> {
  value: TValue
  children?: TreeNode<TValue, TKey>[]
  key: TKey
  collapsed?: boolean
}

export
interface TreeProps<TValue, TKey> {
  nodes: TreeNode<TValue, TKey>[]
  draggable: boolean
  childOffset: number
  renderNode: (node: TreeNode<TValue, TKey>, options: {selected: boolean, current: boolean}) => JSX.Element
  current?: TKey
  selected?: Set<TKey>
  //move: (src: number[][], dest: number[]) => void
  //copy: (src: number[][], dest: number[]) => void
  //toggleCollapsed: (path: number[], collapsed: boolean) => void
  //toggleSelected: (path: number[], selected: boolean) => void
  onCurrentChange: (key: TKey) => void
}

export
class Tree<TValue, TKey> extends React.Component<TreeProps<TValue, TKey>, {}> {
  renderItems(nodes: TreeNode<TValue, TKey>[], parentPath: number[]) {
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
        "ReactDraggableTree_row",
        {
          "ReactDraggableTree_row-selected": isSelected,
          "ReactDraggableTree_row-current": isCurrent,
        }
      )
      elems.push(
        <div className={className} style={style} key={String(node.key)} onClick={onClick}>
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
