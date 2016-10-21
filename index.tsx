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
interface NodeInfo<TValue, TKey> {
  node: TreeNode<TValue, TKey>
  current: boolean
  selected: boolean
  path: number[]
}

export
interface TreeProps<TValue, TKey> {
  nodes: TreeNode<TValue, TKey>[]
  draggable: boolean
  childOffset: number
  renderNode: (nodeInfo: NodeInfo<TValue, TKey>) => JSX.Element
  current?: TKey
  selected?: Set<TKey>
  onCollapsedChange: (nodeInfo: NodeInfo<TValue, TKey>, collapsed: boolean) => void
  onSelectedChange: (keys: Set<TKey>) => void
  onCurrentChange: (key: TKey) => void
}

export
class Tree<TValue, TKey> extends React.Component<TreeProps<TValue, TKey>, {}> {
  keys: TKey[] = []

  renderNode(node: TreeNode<TValue, TKey>, path: number[]): JSX.Element {
    const {childOffset, renderNode, onCurrentChange, onSelectedChange, onCollapsedChange, current, selected} = this.props
    const {key} = node
    this.keys.push(key)

    const isSelected = selected ? selected.has(key) : false
    const isCurrent = key == current
    const nodeInfo = {node, selected: isSelected, current: isCurrent, path}

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

    const onCaretClick = () => {
      if (node.children) {
        onCollapsedChange(nodeInfo, !node.collapsed)
      }
    }

    const className = classNames("ReactDraggableTree_row", {
      "ReactDraggableTree_row-selected": isSelected,
      "ReactDraggableTree_row-current": isCurrent,
    })
    const caretClassName = classNames("ReactDraggableTree_toggler", {
      "ReactDraggableTree_toggler-hidden": !node.children,
      "ReactDraggableTree_toggler-collapsed": node.collapsed
    })

    let row = <div className={className} style={style} onClick={onClick}>
      <div className={caretClassName} onClick={onCaretClick}/>
      {renderNode({node, selected: isSelected, current: isCurrent, path})}
    </div>

    let childrenContainer: JSX.Element|undefined = undefined
    if (node.children) {
      childrenContainer = <div className="ReactDraggableTree_children" hidden={node.collapsed}>
        {node.children.map((child, i) => this.renderNode(child, [...path, i]))}
      </div>
    }

    return (
      <div className="ReactDraggableTree_subtree" key={String(key)}>
        {row}
        {childrenContainer}
      </div>
    )
  }

  render() {
    const {nodes} = this.props
    this.keys = []

    return (
      <div className="ReactDraggableTree">
        {nodes.map((child, i) => this.renderNode(child, [i]))}
      </div>
    )
  }
}
