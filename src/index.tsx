import React = require("react")
const classNames = require("classnames")

export
type Key = string | number

export
interface TreeNode {
  children?: this[]
  key: Key
  collapsed?: boolean
}

export
interface NodeInfo<TNode extends TreeNode> {
  node: TNode
  current: boolean
  selected: boolean
  path: number[]
}

export
interface TreeProps<TNode extends TreeNode> {
  root: TNode
  draggable: boolean
  rowHeight: number
  indent: number
  renderNode: (nodeInfo: NodeInfo<TNode>) => JSX.Element
  current?: Key
  selected?: Set<Key>
  onMove: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndex: number) => void
  onCopy: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndex: number) => void
  onCollapsedChange: (nodeInfo: NodeInfo<TNode>, collapsed: boolean) => void
  onSelectedChange: (keys: Set<Key>) => void
  onCurrentChange: (key: Key) => void
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
class Tree<TNode extends TreeNode> extends React.Component<TreeProps<TNode>, {}> {
  element: HTMLElement
  keys: Key[] = []
  visibleKeys: Key[] = []
  keyToPath = new Map<Key, number[]>()
  pathToKey = new Map<string, Key>() // using joined path as key string
  nodeInfos = new Map<Key, NodeInfo<TNode>>()

  removeAncestorsFromSelection(selection: Set<Key>) {
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

  renderNode(node: TNode, path: number[], visible: boolean): JSX.Element {
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

  keysToInfos(keys: Key[]) {
    const infos = keys.map(k => this.nodeInfos.get(k)!)
    infos.sort((a, b) => compareNumberArrays(a.path, b.path))
    return infos
  }

  render() {
    const {root} = this.props
    this.keys = []
    this.visibleKeys = []
    this.keyToPath.clear()
    this.pathToKey.clear()
    this.nodeInfos.clear()

    const children = root.children || []

    return (
      <div ref={e => this.element = e} className="ReactDraggableTree" onDragOver={this.onDragOver} onDrop={this.onDrop}>
        {children.map((child, i) => this.renderNode(child, [i], true))}
      </div>
    )
  }

  onDragOver = (ev: React.DragEvent<Element>) => {
    ev.preventDefault()
  }

  onDrop = (ev: React.DragEvent<Element>) => {
    const {rowHeight} = this.props

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
    const destKey = this.visibleKeys[visibleIndex]
    const destInfo = this.nodeInfos.get(destKey)
    if (!destInfo || !destInfo.node.children) {
      return
    }
    const srcKeys = this.props.selected || new Set()
    if (srcKeys.has(destKey)) {
      return
    }
    const srcInfos = this.keysToInfos(Array.from(srcKeys))

    if (type == "move") {
      this.props.onMove(srcInfos, destInfo, 0)
    } else {
      this.props.onCopy(srcInfos, destInfo, 0)
    }
    ev.preventDefault()
  }
}
