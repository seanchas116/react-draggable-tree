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
  onSelectedChange: (keys: Set<TKey>) => void
  onCurrentChange: (key: TKey) => void
}

export
class Tree<TValue, TKey> extends React.Component<TreeProps<TValue, TKey>, {}> {
  keys: TKey[] = []
  elements: JSX.Element[] = []

  renderNode(node: TreeNode<TValue, TKey>, path: number[]) {
    const {childOffset, renderNode, onCurrentChange, onSelectedChange, current, selected} = this.props
    const {key} = node
    this.keys.push(key)

    const style = {
      paddingLeft: (path.length - 1) * childOffset + "px",
    }

    const onClick = (ev: React.MouseEvent<Element>) => {
      if (ev.ctrlKey || ev.metaKey) {
        const newSelected = new Set(selected || [])
        newSelected.add(key)
        onSelectedChange(newSelected)
      } else if (ev.shiftKey && current != undefined) {
        const currentIndex = this.keys.indexOf(current)
        const thisIndex = this.keys.indexOf(key)
        const min = Math.min(thisIndex, currentIndex)
        const max = Math.max(thisIndex, currentIndex)
        const keysToAdd = this.keys.slice(min, max + 1)
        const newSelected = new Set(selected || [])
        for (const k of keysToAdd) {
          newSelected.add(k)
        }
        onSelectedChange(newSelected)
      } else {
        onSelectedChange(new Set([key]))
      }
      onCurrentChange(key)
    }

    const isSelected = selected ? selected.has(key) : false
    const isCurrent = key == current

    const className = classNames("ReactDraggableTree_row", {
      "ReactDraggableTree_row-selected": isSelected,
      "ReactDraggableTree_row-current": isCurrent,
    })
    const caretClassName = classNames("ReactDraggableTree_caret", {
      "ReactDraggableTree_caret-hidden": !node.children,
      "ReactDraggableTree_caret-collapsed": node.collapsed
    })

    this.elements.push(
      <div className={className} style={style} key={String(node.key)} onClick={onClick}>
       <div className={caretClassName} />
        {renderNode(node, {selected: isSelected, current: isCurrent})}
      </div>
    )
    if (node.children && !node.collapsed) {
      for (const [i, child] of node.children.entries()) {
        this.renderNode(child, [...path, i])
      }
    }
  }

  render() {
    const {nodes} = this.props
    this.keys = []
    this.elements = []

    const elements: JSX.Element[] = []
    for (const [i, node] of nodes.entries()) {
      this.renderNode(node, [i])
    }

    return (
      <div className="ReactDraggableTree">
        {this.elements}
      </div>
    )
  }
}
