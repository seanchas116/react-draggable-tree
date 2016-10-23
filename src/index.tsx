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
}

export
interface DropIndex {
  type: "between" | "over"
  index: number
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
  renderNode: (nodeInfo: NodeInfo<TNode>) => JSX.Element
  renderToggler?: (props: {visible: boolean, collapsed: boolean, onClick: () => void}) => JSX.Element
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
    return Object.assign({}, this.props, {
      selectedColor: "lightgrey",
      currentColor: "lightgrey",
      renderToggler: Toggler
    })
  }

  clearNodes() {
    this.visibleInfos = []
    this.pathToInfo.clear()
    this.infoToPath.clear()
    this.keyToInfo.clear()
  }

  addNodeInfo(nodeInfo: NodeInfo<TNode>, visible: boolean) {
    this.infoToPath.set(nodeInfo, nodeInfo.path)
    this.pathToInfo.set(nodeInfo.path.join(), nodeInfo)
    if (visible) {
      this.visibleInfos.push(nodeInfo)
    }
    this.keyToInfo.set(nodeInfo.node.key, nodeInfo)
  }

  renderNode(node: TNode, path: number[], visible: boolean): JSX.Element[] {
    const {indent, rowHeight, renderNode, renderToggler: RenderToggler, onSelectionChange, onCollapsedChange, selection, selectedColor, currentColor} = this.propsWithDefaults()
    const {currentKey, selectedKeys} = selection
    const {key} = node

    const isSelected = selectedKeys.has(key)
    const isCurrent = key == currentKey
    const nodeInfo = {node, selected: isSelected, current: isCurrent, path}
    this.addNodeInfo(nodeInfo, visible)

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
      <RenderToggler visible={!!node.children} collapsed={!!node.collapsed} onClick={onTogglerClick} />
      {renderNode(nodeInfo)}
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

  updateDropIndicator(dropIndex: DropIndex|undefined) {
    this.dropIndicator.setState({dropIndex})
  }

  render() {
    const {root, rowHeight} = this.props
    const children = root.children || []
    this.clearNodes()
    this.addNodeInfo({node: root, selected: false, current: false, path: []}, false)

    return (
      <div ref={e => this.element = e} className="ReactDraggableTree" onDragOver={this.onDragOver} onDrop={this.onDrop}>
        {children.map((child, i) => this.renderNode(child, [i], true))}
        <DropIndicator ref={e => this.dropIndicator = e} rowHeight={rowHeight} />
      </div>
    )
  }

  onDragOver = (ev: React.DragEvent<Element>) => {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = ev.altKey ? "copy" : "move"
    this.updateDropIndicator(this.getDropIndex(ev))
  }

  getDropIndex(ev: React.DragEvent<Element>): DropIndex|undefined {
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
    if (!target) {
      return
    }
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
    const dest = this.getDropDestination(ev)
    if (!dest) {
      return
    }
    const {info: destInfo, index: destIndex} = dest

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

function Toggler<T extends TreeNode>(props: {visible: boolean, collapsed: boolean, onClick: () => void}) {
  const claassName = classNames("ReactDraggableTree_toggler", {
    "ReactDraggableTree_toggler-visible": props.visible,
    "ReactDraggableTree_toggler-collapsed": props.collapsed,
  })
  return <div className={claassName} onClick={props.onClick}/>
}

interface DropIndicatorProps {
  rowHeight: number
}

interface DropIndicatorState {
  dropIndex?: DropIndex
}

class DropIndicator extends React.Component<DropIndicatorProps, DropIndicatorState> {
  state: DropIndicatorState = {}

  render() {
    const {dropIndex} = this.state
    const {rowHeight} = this.props
    let isDropOver = dropIndex && dropIndex.type == "over"
    let isDropBetween = dropIndex && dropIndex.type == "between"
    const offset = dropIndex ? dropIndex.index * rowHeight : 0
    const dropOverStyle = {
      top: `${offset}px`,
      height: `${rowHeight}px`,
    }
    const dropBetweenStyle = {
      top: `${offset - 1}px`,
      height: "2px",
    }
    return (
      <div>
        <div className="ReactDraggableTree_dropOver" hidden={!isDropOver} style={dropOverStyle} />
        <div className="ReactDraggableTree_dropBetween" hidden={!isDropBetween} style={dropBetweenStyle} />
      </div>
    )
  }
}