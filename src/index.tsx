import React = require("react")
const classNames = require("classnames")

export
type Key = string | number

export
interface ClassNames {
  tree: string
  subtree: string
  children: string
  row: string
  rowSelected: string
  rowCurrent: string
  toggler: string
  togglerExpanded: string
  togglerCollapsed: string
}

const defaultClassNames: ClassNames = {
  tree: "ReactDraggableTree",
  subtree: "ReactDraggableTree_subtree",
  children: "ReactDraggableTree_children",
  row: "ReactDraggableTree_row",
  rowSelected: "ReactDraggableTree_row-selected",
  rowCurrent: "ReactDraggableTree_row-current",
  toggler: "ReactDraggableTree_toggler",
  togglerExpanded: "ReactDraggableTree_toggler-expanded",
  togglerCollapsed: "ReactDraggableTree_toggler-collapsed",
}

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
  classNames?: ClassNames
  renderNode: (nodeInfo: NodeInfo<TNode>) => JSX.Element
  current?: Key
  selected?: Set<Key>
  onMove: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndexBefore: number, destIndexAfter: number) => void
  onCopy: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndexBefore: number) => void
  onCollapsedChange: (nodeInfo: NodeInfo<TNode>, collapsed: boolean) => void
  onSelectedChange: (keys: Set<Key>) => void
  onCurrentChange: (key: Key) => void
}

const DRAG_MIME = "x-react-draggable-tree-drag"

function comparePaths(a: number[], b: number[]) {
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

function isPathEqual(a: number[], b: number[]) {
  if (a.length != b.length) {
    return
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] != b[i]) {
      return false
    }
  }
  return true
}

export
class Tree<TNode extends TreeNode> extends React.Component<TreeProps<TNode>, {}> {
  element: HTMLElement
  infoToPath = new Map<NodeInfo<TNode>, number[]>()
  pathToInfo = new Map<string, NodeInfo<TNode>>() // using joined path as key string
  infos: NodeInfo<TNode>[] = []
  visibleInfos: NodeInfo<TNode>[] = []
  keyToInfo = new Map<Key, NodeInfo<TNode>>()

  removeAncestorsFromSelection(selection: Set<Key>) {
    const newSelection = new Set(selection)
    for (const {path} of this.keysToInfos(selection)) {
      for (let i = 1; i < path.length; ++i) {
        const subpath = path.slice(0, i)
        const ancestor = this.pathToInfo.get(subpath.join())
        if (ancestor) {
          newSelection.delete(ancestor.node.key)
        }
      }
    }
    return newSelection
  }

  renderNode(node: TNode, path: number[], visible: boolean): JSX.Element {
    const {indent, rowHeight, renderNode, onCurrentChange, onSelectedChange, onCollapsedChange, current, selected} = this.props
    const {key} = node
    const classes = this.props.classNames || defaultClassNames

    const isSelected = selected ? selected.has(key) : false
    const isCurrent = key == current
    const nodeInfo = {node, selected: isSelected, current: isCurrent, path}
    this.infoToPath.set(nodeInfo, path)
    this.pathToInfo.set(path.join(), nodeInfo)
    this.infos.push(nodeInfo)
    if (visible) {
      this.visibleInfos.push(nodeInfo)
    }
    this.keyToInfo.set(key, nodeInfo)

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
        const visibleKeys = this.visibleInfos.map(info => info.node.key)
        const currentIndex = visibleKeys.indexOf(current)
        const thisIndex = visibleKeys.indexOf(key)
        const min = Math.min(thisIndex, currentIndex)
        const max = Math.max(thisIndex, currentIndex)
        const keysToAdd = visibleKeys.slice(min, max + 1)
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

    const className = classNames(classes.row, {
      [classes.rowSelected]: isSelected,
      [classes.rowCurrent]: isCurrent,
    })
    const caretClassName = classNames(classes.toggler, {
      [classes.togglerExpanded]: !!node.children,
      [classes.togglerCollapsed]: node.collapsed,
    })

    let row = <div className={className} style={style} onClick={onClick} draggable={true} onDragStart={onDragStart}>
      <div className={caretClassName} onClick={onCaretClick}/>
      {renderNode({node, selected: isSelected, current: isCurrent, path})}
    </div>

    let childrenContainer: JSX.Element|undefined = undefined
    if (node.children) {
      childrenContainer = <div className={classes.children} hidden={node.collapsed}>
        {node.children.map((child, i) => this.renderNode(child, [...path, i], !node.collapsed))}
      </div>
    }

    return (
      <div className={classes.subtree} key={String(key)}>
        {row}
        {childrenContainer}
      </div>
    )
  }

  keysToInfos(keys: Iterable<Key>) {
    const infos: NodeInfo<TNode>[] = []
    for (const key of keys) {
      const info = this.keyToInfo.get(key)
      if (info) {
        infos.push(info)
      }
    }
    infos.sort((a, b) => comparePaths(a.path, b.path))
    return infos
  }

  render() {
    const {root} = this.props
    const classes = this.props.classNames || defaultClassNames
    this.infos = []
    this.visibleInfos = []
    this.pathToInfo.clear()
    this.infoToPath.clear()
    this.keyToInfo.clear()

    const children = root.children || []

    return (
      <div ref={e => this.element = e} className={classes.tree} onDragOver={this.onDragOver} onDrop={this.onDrop}>
        {children.map((child, i) => this.renderNode(child, [i], true))}
      </div>
    )
  }

  onDragOver = (ev: React.DragEvent<Element>) => {
    ev.preventDefault()
  }

  getDropIndex(ev: React.DragEvent<Element>) {
    const {rowHeight} = this.props
    const rect = this.element.getBoundingClientRect()
    const x = ev.clientX - rect.left + this.element.scrollTop
    const y = ev.clientY - rect.top + this.element.scrollLeft
    const index = Math.floor(y / rowHeight)
    const offset = y - index * rowHeight

    if (index < 0) {
      return {type: "between", index: 0}
    }
    if (this.visibleInfos.length <= index) {
      return {type: "between", index: this.visibleInfos.length}
    }

    const info = this.visibleInfos[index]
    if (info.node.children) {
      // can have children
      if (rowHeight * 0.25 < offset && offset < rowHeight * 0.75) {
        return {type: "over", index}
      }
    }
    if (offset < rowHeight / 2) {
      // drop before
      return {type: "between", index}
    } else {
      // drop after
      return {type: "between", index: index + 1}
    }
  }

  getDropDestination(ev: React.DragEvent<Element>) {
    const target = this.getDropIndex(ev)
    if (target.type == "over") {
      const info = this.visibleInfos[target.index]
      if (info) {
        return {info, index: 0}
      }
    } else {
      let path: number[]
      if (target.index < this.visibleInfos.length) {
        path = this.visibleInfos[target.index].path
      } else {
        const {root} = this.props
        if (!root.children) {
          return
        }
        path = [root.children.length]
      }
      const destPath = path.slice(0, -1)
      const info = this.pathToInfo.get(destPath.join())
      if (info) {
        return {info, index: path[path.length - 1]}
      }
    }
  }

  onDrop = (ev: React.DragEvent<Element>) => {
    const {rowHeight} = this.props

    const type = ev.dataTransfer.getData(DRAG_MIME)
    if (!type) {
      return
    }
    const dest = this.getDropDestination(ev)
    if (!dest) {
      return
    }
    const {info: destInfo, index: destIndex} = dest

    const srcKeys = this.props.selected || new Set()
    if (srcKeys.has(destInfo.node.key)) {
      return
    }
    const srcInfos = this.keysToInfos(srcKeys)

    if (type == "move") {
      let destIndexAfter = destIndex
      for (let info of srcInfos) {
        if (isPathEqual(info.path.slice(0, -1), destInfo.path)) {
          const srcIndex = info.path[info.path.length - 1]
          if (srcIndex < destIndex) {
            destIndexAfter--
          }
        }
      }
      this.props.onMove(srcInfos, destInfo, destIndex, destIndexAfter)
    } else {
      this.props.onCopy(srcInfos, destInfo, destIndex)
    }
    ev.preventDefault()
  }
}
