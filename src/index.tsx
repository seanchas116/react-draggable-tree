import React = require("react")
const classNames = require("classnames")

const DRAG_MIME = "x-react-draggable-tree-drag"

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
  visible: boolean
  visibleOffset: number
}

export
interface DropTarget<TNode extends TreeNode> {
  type: "between" | "over"
  index: number
  dest: NodeInfo<TNode>
  destIndex: number
  depth: number
}

export
interface Selection {
  currentKey?: Key
  selectedKeys: Set<Key>
}

export
interface TreeProps<TNode extends TreeNode> {
  root: TNode
  draggable: boolean
  rowHeight: number
  indent: number
  selectedColor?: string
  currentColor?: string
  indicatorColor?: string
  rowContent: (nodeInfo: NodeInfo<TNode>) => JSX.Element
  toggler?: (props: TogglerProps<TNode>) => JSX.Element
  selection: Selection
  onMove: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndexBefore: number, destIndexAfter: number) => void
  onCopy: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndexBefore: number) => void
  onCollapsedChange: (nodeInfo: NodeInfo<TNode>, collapsed: boolean) => void
  onSelectionChange: (selection: Selection) => void
}

export
class Tree<TNode extends TreeNode> extends React.Component<TreeProps<TNode>, {}> {
  private element: HTMLElement
  private dropIndicator: DropIndicator
  private infoToPath = new Map<NodeInfo<TNode>, number[]>()
  private pathToInfo = new Map<string, NodeInfo<TNode>>() // using joined path as key string
  private visibleInfos: NodeInfo<TNode>[] = []
  private keyToInfo = new Map<Key, NodeInfo<TNode>>()
  private rootInfo: NodeInfo<TNode>

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

  propsWithDefaults() {
    return Object.assign({}, {
      selectedColor: "#e0e0e0",
      currentColor: "#e0e0e0",
      indicatorColor: "#2196F3",
      toggler: Toggler
    }, this.props)
  }

  clearNodes() {
    this.visibleInfos = []
    this.pathToInfo.clear()
    this.infoToPath.clear()
    this.keyToInfo.clear()
  }

  addNodeInfo(nodeInfo: NodeInfo<TNode>) {
    this.infoToPath.set(nodeInfo, nodeInfo.path)
    this.pathToInfo.set(nodeInfo.path.join(), nodeInfo)
    if (nodeInfo.visible) {
      this.visibleInfos.push(nodeInfo)
    }
    this.keyToInfo.set(nodeInfo.node.key, nodeInfo)
  }

  renderNode(node: TNode, path: number[], visible: boolean): JSX.Element[] {
    const {indent, rowHeight, rowContent, toggler, onSelectionChange, onCollapsedChange, selection, selectedColor, currentColor} = this.propsWithDefaults()
    const {currentKey, selectedKeys} = selection
    const {key} = node

    const isSelected = selectedKeys.has(key)
    const isCurrent = key == currentKey
    const nodeInfo = {
      node,
      selected: isSelected,
      current: isCurrent,
      path,
      visible,
      visibleOffset: this.visibleInfos.length
    }
    this.addNodeInfo(nodeInfo)

    const style = {
      paddingLeft: (path.length - 1) * indent + "px",
      height: rowHeight + "px",
      backgroundColor: isCurrent ? currentColor : (isSelected ? selectedColor : "transparent")
    }

    const onClick = (ev: React.MouseEvent<Element>) => {
      let newSelected: Set<Key>
      if (ev.ctrlKey || ev.metaKey) {
        newSelected = new Set(selectedKeys)
        newSelected.add(key)
      } else if (ev.shiftKey && currentKey != undefined) {
        const visibleKeys = this.visibleInfos.map(info => info.node.key)
        const currentIndex = visibleKeys.indexOf(currentKey)
        const thisIndex = visibleKeys.indexOf(key)
        const min = Math.min(thisIndex, currentIndex)
        const max = Math.max(thisIndex, currentIndex)
        const keysToAdd = visibleKeys.slice(min, max + 1)
        newSelected = new Set(selectedKeys)
        for (const k of keysToAdd) {
          newSelected.add(k)
        }
      } else {
        newSelected = new Set([key])
      }

      onSelectionChange({
        selectedKeys: this.removeAncestorsFromSelection(newSelected),
        currentKey: key
      })
    }

    const onDragStart = (ev: React.DragEvent<Element>) => {
      ev.dataTransfer.effectAllowed = "copyMove"
      ev.dataTransfer.setData(DRAG_MIME, "drag")

      if (!selectedKeys.has(key)) {
        onSelectionChange({
          selectedKeys: new Set([key]),
          currentKey: key
        })
      }
    }

    const onDragEnd = () => {
      this.updateDropIndicator(undefined)
    }

    const onTogglerClick = () => {
      if (node.children) {
        onCollapsedChange(nodeInfo, !node.collapsed)
      }
    }

    let row = <div key={`row-${key}`} className="ReactDraggableTree_row" style={style} onClick={onClick} draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {toggler({nodeInfo, visible: !!node.children, collapsed: !!node.collapsed, onClick: onTogglerClick})}
      {rowContent(nodeInfo)}
    </div>

    if (node.children) {
      const childrenVisible = visible && !node.collapsed
      const children = <div key={`children-${key}`} className="ReactDraggableTree_children" hidden={node.collapsed}>
        {node.children.map((child, i) => this.renderNode(child, [...path, i], childrenVisible))}
      </div>
      return [row, children]
    } else {
      return [row]
    }
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

  updateDropIndicator(target: DropTarget<TNode>|undefined) {
    if (target) {
      const {type, index, depth} = target
      this.dropIndicator.setState({type, index, depth})
    } else {
      this.dropIndicator.setState({type: "none", index: 0, depth: 0})
    }
  }

  render() {
    const {root, rowHeight, indent, indicatorColor} = this.propsWithDefaults()
    const children = root.children || []
    this.clearNodes()
    const rootInfo = {node: root, selected: false, current: false, path: [], visible: false, visibleOffset: 0}
    this.addNodeInfo(rootInfo)
    this.rootInfo = rootInfo

    return (
      <div ref={e => this.element = e} className="ReactDraggableTree" onDragOver={this.onDragOver} onDrop={this.onDrop}>
        {children.map((child, i) => this.renderNode(child, [i], true))}
        <DropIndicator ref={e => this.dropIndicator = e} rowHeight={rowHeight} indent={indent} color={indicatorColor} />
      </div>
    )
  }

  onDragOver = (ev: React.DragEvent<Element>) => {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = ev.altKey ? "copy" : "move"
    const target = this.getDropTarget(ev)
    if (this.canDrop(target.dest, target.destIndex)) {
      this.updateDropIndicator(target)
      return
    }
    this.updateDropIndicator(undefined)
  }

  getDropTarget(ev: {clientX: number, clientY: number}): DropTarget<TNode> {
    const {rowHeight, indent} = this.props
    const rect = this.element.getBoundingClientRect()
    const x = ev.clientX - rect.left + this.element.scrollTop
    const y = ev.clientY - rect.top + this.element.scrollLeft
    const overIndex = clamp(Math.floor(y / rowHeight), 0, this.visibleInfos.length)
    const offset = y - overIndex * rowHeight
    const depth = Math.floor(x / indent)

    if (overIndex < this.visibleInfos.length) {
      if (rowHeight * 0.25 < offset && offset < rowHeight * 0.75) {
        const dest = this.visibleInfos[overIndex]
        if (dest.node.children) {
          return {
            type: "over",
            index: overIndex,
            dest,
            destIndex: 0,
            depth: 0,
          }
        }
      }
    }

    const betweenIndex = (offset < rowHeight / 2) ? overIndex : overIndex + 1

    if (betweenIndex < this.visibleInfos.length) {
      const {path} = this.visibleInfos[betweenIndex]
      const destPath = path.slice(0, -1)
      const dest = this.pathToInfo.get(destPath.join())!
      return {
        type: "between",
        index: betweenIndex,
        dest,
        destIndex: path[path.length - 1],
        depth: path.length - 1
      }
    } else {
      const dest = this.rootInfo
      const {root} = this.props
      return {
        type: "between",
        index: betweenIndex,
        dest,
        destIndex: dest.node.children!.length,
        depth: 0
      }
    }
  }

  canDrop(destInfo: NodeInfo<TNode>, destIndex: number) {
    const {selectedKeys} = this.props.selection
    const {path} = destInfo
    for (let i = 0; i < path.length; ++i) {
      const ancestorPath = path.slice(0, path.length - i)
      const ancestor = this.pathToInfo.get(ancestorPath.join())
      if (ancestor) {
        if (selectedKeys.has(ancestor.node.key)) {
          return false
        }
      }
    }
    return true
  }

  onDrop = (ev: React.DragEvent<Element>) => {
    this.updateDropIndicator(undefined)

    const data = ev.dataTransfer.getData(DRAG_MIME)
    if (!data) {
      return
    }
    const target = this.getDropTarget(ev)
    const {dest: destInfo, destIndex} = target

    if (!this.canDrop(destInfo, destIndex)) {
      return
    }
    const srcInfos = this.keysToInfos(this.props.selection.selectedKeys)

    if (ev.altKey) {
      this.props.onCopy(srcInfos, destInfo, destIndex)
    } else {
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
    }
    ev.preventDefault()
  }
}

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(x, max))
}

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
interface TogglerProps<TNode extends TreeNode> {
  nodeInfo: NodeInfo<TNode>
  visible: boolean
  collapsed: boolean
  onClick: () => void
}

function Toggler<TNode extends TreeNode>(props: TogglerProps<TNode>) {
  const claassName = classNames("ReactDraggableTree_toggler", {
    "ReactDraggableTree_toggler-visible": props.visible,
    "ReactDraggableTree_toggler-collapsed": props.collapsed,
  })
  return <div className={claassName} onClick={props.onClick}/>
}

interface DropIndicatorProps {
  rowHeight: number
  indent: number
  color: string
}

interface DropIndicatorState {
  type: "none" | "over" | "between"
  index: number
  depth: number
}

class DropIndicator extends React.Component<DropIndicatorProps, DropIndicatorState> {
  state: DropIndicatorState = {
    type: "none",
    index: 0,
    depth: 0,
  }

  render() {
    const {type, index, depth} = this.state
    const {rowHeight, indent, color} = this.props
    const offset = index * rowHeight
    const dropOverStyle = {
      borderColor: color,
      top: `${offset}px`,
      height: `${rowHeight}px`,
    }
    const dropBetweenStyle = {
      backgroundColor: color,
      top: `${offset - 1}px`,
      height: "2px",
      left: `${depth * indent}px`
    }
    return (
      <div>
        <div className="ReactDraggableTree_dropOver" hidden={type != "over"} style={dropOverStyle} />
        <div className="ReactDraggableTree_dropBetween" hidden={type != "between"} style={dropBetweenStyle} />
      </div>
    )
  }
}