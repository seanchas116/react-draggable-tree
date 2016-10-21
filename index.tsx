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
  visibleKeys: TKey[] = []
  keyToPath = new Map<TKey, number[]>()
  pathToKey = new Map<string, TKey>() // using joined path as key string

  removeAncestorsFromSelection(selection: Set<TKey>) {
    const newSelection = new Set(selection)
    for (const key of selection) {
      const path = this.keyToPath.get(key)
      if (path != undefined) {
        for (let i = 1; i < path.length; ++i) {
          const subpath = path.slice(0, i)
          const ancestor = this.pathToKey.get(subpath.join())
          if (ancestor != undefined) {
            newSelection.delete(ancestor)
          }
        }
      }
    }
    return newSelection
  }

  renderNode(node: TreeNode<TValue, TKey>, path: number[], visible: boolean): JSX.Element {
    const {childOffset, renderNode, onCurrentChange, onSelectedChange, onCollapsedChange, current, selected} = this.props
    const {key} = node
    this.keys.push(key)
    if (visible) {
      this.visibleKeys.push(key)
    }
    this.keyToPath.set(key, path)
    this.pathToKey.set(path.join(), key)

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
        onSelectedChange(this.removeAncestorsFromSelection(newSelected))
      } else if (ev.shiftKey && current != undefined) {
        const currentIndex = this.visibleKeys.indexOf(current)
        const thisIndex = this.visibleKeys.indexOf(key)
        const min = Math.min(thisIndex, currentIndex)
        const max = Math.max(thisIndex, currentIndex)
        const keysToAdd = this.visibleKeys.slice(min, max + 1)
        const newSelected = new Set(selected || [])
        for (const k of keysToAdd) {
          newSelected.add(k)
        }
        onSelectedChange(this.removeAncestorsFromSelection(newSelected))
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
        {node.children.map((child, i) => this.renderNode(child, [...path, i], !node.collapsed))}
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
    this.visibleKeys = []
    this.keyToPath.clear()
    this.pathToKey.clear()

    return (
      <div className="ReactDraggableTree">
        {nodes.map((child, i) => this.renderNode(child, [i], true))}
      </div>
    )
  }
}
