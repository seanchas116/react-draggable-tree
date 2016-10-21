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
  rowHeight: number
  indent: number
  renderNode: (nodeInfo: NodeInfo<TValue, TKey>) => JSX.Element
  current?: TKey
  selected?: Set<TKey>
  onMove: (src: number[][], dest: number[]) => void
  onCopy: (src: number[][], dest: number[]) => void
  onCollapsedChange: (path: number[], collapsed: boolean) => void
  onSelectedChange: (keys: Set<TKey>) => void
  onCurrentChange: (key: TKey) => void
}

const DRAG_MIME = "x-react-draggable-tree-drag"

function compareNumberArrays(a: number[], b: number[]) {
  for (let i = 0; true; ++i) {
    if (a.length == i && b.length == i) {
      return 0
    }
    if (a.length == i || a[i] < b[i]) {
      return -1
    }
    if (b.length == i || b[i] < a[i]) {
      return 1
    }
  }
}

export
class Tree<TValue, TKey> extends React.Component<TreeProps<TValue, TKey>, {}> {
  element: HTMLElement
  keys: TKey[] = []
  visibleKeys: TKey[] = []
  keyToPath = new Map<TKey, number[]>()
  pathToKey = new Map<string, TKey>() // using joined path as key string
  nodeInfos = new Map<TKey, NodeInfo<TValue, TKey>>()

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
    const {indent, rowHeight, renderNode, onCurrentChange, onSelectedChange, onCollapsedChange, current, selected} = this.props
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
    this.nodeInfos.set(key, nodeInfo)

    const style = {
      paddingLeft: (path.length - 1) * indent + "px",
      height: rowHeight + "px",
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

    const onDragStart = (ev: React.DragEvent<Element>) => {
      ev.dataTransfer.setData(DRAG_MIME, "move")
    }

    const onCaretClick = () => {
      if (node.children) {
        onCollapsedChange(nodeInfo.path, !node.collapsed)
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

    let row = <div className={className} style={style} onClick={onClick} draggable={true} onDragStart={onDragStart}>
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

  keysToPaths(keys: TKey[]) {
    const paths = keys.map(k => this.nodeInfos.get(k)!.path)
    paths.sort(compareNumberArrays)
    return paths
  }

  render() {
    const {nodes, rowHeight} = this.props
    this.keys = []
    this.visibleKeys = []
    this.keyToPath.clear()
    this.pathToKey.clear()
    this.nodeInfos.clear()

    const onDragOver = (ev: React.DragEvent<Element>) => {
      ev.preventDefault()
    }

    const onDrop = (ev: React.DragEvent<Element>) => {
      const type = ev.dataTransfer.getData(DRAG_MIME)
      if (!type) {
        return
      }

      const rect = this.element.getBoundingClientRect()
      const x = ev.clientX - rect.left + this.element.scrollTop
      const y = ev.clientY - rect.top + this.element.scrollLeft
      const visibleIndex = Math.floor(y / rowHeight)
      if (this.visibleKeys.length <= visibleIndex) {
        return
      }
      const parentKey = this.visibleKeys[visibleIndex]
      const parentNodeInfo = this.nodeInfos.get(parentKey)
      if (!parentNodeInfo || !parentNodeInfo.node.children) {
        return
      }
      const srcKeys = this.props.selected || new Set()
      if (srcKeys.has(parentKey)) {
        return
      }
      const srcPaths = this.keysToPaths(Array.from(srcKeys))
      const destPath = [...parentNodeInfo.path, 0]
      console.log("drop", srcPaths, destPath)

      if (type == "move") {
        this.props.onMove(srcPaths, destPath)
      } else {
        this.props.onCopy(srcPaths, destPath)
      }
      ev.preventDefault()
    }

    return (
      <div ref={e => this.element = e} className="ReactDraggableTree" onDragOver={onDragOver} onDrop={onDrop}>
        {nodes.map((child, i) => this.renderNode(child, [i], true))}
      </div>
    )
  }
}
