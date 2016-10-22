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
interface TreeProps<TNode extends TreeNode> {
  root: TNode
  draggable: boolean
  rowHeight: number
  indent: number
  selectedColor?: string
  currentColor?: string
  renderNode: (nodeInfo: NodeInfo<TNode>) => JSX.Element
  renderToggler?: (props: {visible: boolean, collapsed: boolean, onClick: () => void}) => JSX.Element
  current?: Key
  selected?: Set<Key>
  onMove: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndexBefore: number, destIndexAfter: number) => void
  onCopy: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndexBefore: number) => void
  onCollapsedChange: (nodeInfo: NodeInfo<TNode>, collapsed: boolean) => void
  onSelectedChange: (keys: Set<Key>) => void
  onCurrentChange: (key: Key) => void
}

export
class Tree<TNode extends TreeNode> extends React.Component<TreeProps<TNode>, {}> {
  element: HTMLElement
  dropOverElement: HTMLElement
  dropBetweenElement: HTMLElement
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

  propsWithDefaults() {
    return Object.assign({}, this.props, {
      selectedColor: "lightgrey",
      currentColor: "lightgrey",
      renderToggler: Toggler
    })
  }

  renderNode(node: TNode, path: number[], visible: boolean): JSX.Element[] {
    const {indent, rowHeight, renderNode, renderToggler: RenderToggler, onCurrentChange, onSelectedChange, onCollapsedChange, current, selected, selectedColor, currentColor} = this.propsWithDefaults()
    const {key} = node

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
      backgroundColor: isCurrent ? currentColor : (isSelected ? selectedColor : "transparent")
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

    const onTogglerClick = () => {
      if (node.children) {
        onCollapsedChange(nodeInfo, !node.collapsed)
      }
    }

    let row = <div key={`row-${key}`} className="ReactDraggableTree_row" style={style} onClick={onClick} draggable={true} onDragStart={onDragStart}>
      <RenderToggler visible={!!node.children} collapsed={!!node.collapsed} onClick={onTogglerClick} />
      {renderNode(nodeInfo)}
    </div>

    if (node.children) {
      const children = <div key={`children-${key}`} className="ReactDraggableTree_children" hidden={node.collapsed}>
        {node.children.map((child, i) => this.renderNode(child, [...path, i], !node.collapsed))}
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
    if (!dropIndex) {
      this.dropOverElement.hidden = true
      this.dropBetweenElement.hidden = true
    } else if (dropIndex.type == "over") {
      const {rowHeight} = this.props
      this.dropOverElement.hidden = false
      this.dropBetweenElement.hidden = true
      Object.assign(this.dropOverElement.style, {
        position: "absolute",
        boxSizing: "border-box",
        left: "0px",
        top: `${dropIndex.index * rowHeight}px`,
        width: "100%",
        height: `${rowHeight}px`,
      })
    } else {
      const {rowHeight} = this.props
      this.dropOverElement.hidden = true
      this.dropBetweenElement.hidden = false
      Object.assign(this.dropBetweenElement.style, {
        position: "absolute",
        boxSizing: "border-box",
        left: "0px",
        top: `${dropIndex.index * rowHeight - 1}px`,
        width: "100%",
        height: "2px",
        backgroundColor: "blue",
      })
    }
  }

  render() {
    this.infos = []
    this.visibleInfos = []
    this.pathToInfo.clear()
    this.infoToPath.clear()
    this.keyToInfo.clear()

    const {root, rowHeight} = this.props
    const children = root.children || []

    return (
      <div ref={e => this.element = e} className="ReactDraggableTree" onDragOver={this.onDragOver} onDrop={this.onDrop}>
        {children.map((child, i) => this.renderNode(child, [i], true))}
        <div ref={e => this.dropOverElement = e} className="ReactDraggableTree_dropOver" hidden={true}/>
        <div ref={e => this.dropBetweenElement = e} className="ReactDraggableTree_dropBetween" hidden={true}/>
      </div>
    )
  }

  onDragOver = (ev: React.DragEvent<Element>) => {
    ev.preventDefault()
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

  onDrop = (ev: React.DragEvent<Element>) => {
    this.updateDropIndicator(undefined)

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
