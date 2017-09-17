import React = require("react")
const classNames = require("classnames")

const DRAG_MIME = "x-react-draggable-tree-drag"

export
type Key = string | number

export
interface TreeItem {
  children: this[] | undefined
  collapsed: boolean
  key: Key
  canInsert (other: this): boolean
  renderRow(): JSX.Element
}

export
interface TreeRowInfo<TItem extends TreeItem> {
  item: TItem
  selected: boolean
  path: number[]
  visible: boolean
  visibleOffset: number
}

interface DropTarget<TItem extends TreeItem> {
  type: "between" | "over"
  index: number
  dest: TreeRowInfo<TItem>
  destIndex: number
  depth: number
}

export
interface TreeProps<TItem extends TreeItem> {
  root: TItem
  rowHeight: number
  indent?: number
  selectedKeys: Set<Key>
  onMove: (src: TreeRowInfo<TItem>[], dest: TreeRowInfo<TItem>, destIndexBefore: number, destIndexAfter: number) => void
  onCopy: (src: TreeRowInfo<TItem>[], dest: TreeRowInfo<TItem>, destIndexBefore: number) => void
  onContextMenu: (info: TreeRowInfo<TItem>|undefined, ev: React.MouseEvent<Element>) => void
  onCollapsedChange: (info: TreeRowInfo<TItem>, collapsed: boolean) => void
  onSelectedKeysChange: (selectedKeys: Set<Key>, selectedInfos: TreeRowInfo<TItem>[]) => void
}

export
class TreeView<TItem extends TreeItem> extends React.Component<TreeProps<TItem>, {}> {
  private element: HTMLElement
  private dropIndicator: DropIndicator
  private infoToPath = new Map<TreeRowInfo<TItem>, number[]>()
  private pathToInfo = new Map<string, TreeRowInfo<TItem>>() // using joined path as key string
  private visibleInfos: TreeRowInfo<TItem>[] = []
  private keyToInfo = new Map<Key, TreeRowInfo<TItem>>()
  private rootInfo: TreeRowInfo<TItem>

  private removeAncestorsFromSelection(selection: Set<Key>) {
    const newSelection = new Set(selection)
    for (const {path} of this.keysToInfos(selection)) {
      for (let i = 1; i < path.length; ++i) {
        const subpath = path.slice(0, i)
        const ancestor = this.pathToInfo.get(subpath.join())
        if (ancestor) {
          newSelection.delete(ancestor.item.key)
        }
      }
    }
    return newSelection
  }

  private propsWithDefaults() {
    return Object.assign({}, {
      indent: 24,
    }, this.props)
  }

  private clearRows() {
    this.visibleInfos = []
    this.pathToInfo.clear()
    this.infoToPath.clear()
    this.keyToInfo.clear()
  }

  private addRowInfo(rowInfo: TreeRowInfo<TItem>) {
    this.infoToPath.set(rowInfo, rowInfo.path)
    this.pathToInfo.set(rowInfo.path.join(), rowInfo)
    if (rowInfo.visible) {
      this.visibleInfos.push(rowInfo)
    }
    this.keyToInfo.set(rowInfo.item.key, rowInfo)
  }

  private renderItem(item: TItem, path: number[], visible: boolean): JSX.Element[] {
    const {indent, rowHeight, selectedKeys} = this.propsWithDefaults()
    const {key} = item

    const isSelected = selectedKeys.has(key)
    const rowInfo = {
      item,
      selected: isSelected,
      path,
      visible,
      visibleOffset: this.visibleInfos.length
    }
    this.addRowInfo(rowInfo)

    const style = {
      paddingLeft: (path.length - 1) * indent + "px",
      height: rowHeight + "px",
    }

    const onDragStart = (ev: React.DragEvent<Element>) => {
      ev.dataTransfer.effectAllowed = "copyMove"
      ev.dataTransfer.setData(DRAG_MIME, "drag")

      if (!selectedKeys.has(key)) {
        const newSelected = new Set([key])
        this.props.onSelectedKeysChange(newSelected, this.keysToInfos(newSelected))
      }
    }

    const onDragEnd = () => {
      this.updateDropIndicator(undefined)
    }

    const onTogglerClick = () => {
      if (item.children) {
        this.props.onCollapsedChange(rowInfo, !item.collapsed)
      }
    }

    const rowClasses = classNames("ReactDraggableTree_row", {
      "ReactDraggableTree_row-selected": isSelected,
    })

    const {children, collapsed} = item

    let row = (
      <div
        key={`row-${key}`} className={rowClasses} style={style}
        onClick={ev => this.onClickRow(rowInfo, ev)}
        draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd}
      >
        <Toggler visible={!!children} collapsed={collapsed} onClick={onTogglerClick} />
        {item.renderRow()}
      </div>
    )

    if (children) {
      const childrenVisible = visible && !collapsed
      const childRows = <div key={`children-${key}`} className="ReactDraggableTree_children" hidden={collapsed}>
        {children.map((child, i) => this.renderItem(child, [...path, i], childrenVisible))}
      </div>
      return [row, childRows]
    } else {
      return [row]
    }
  }

  private keysToInfos(keys: Set<Key>) {
    const infos: TreeRowInfo<TItem>[] = []
    keys.forEach(key => {
      const info = this.keyToInfo.get(key)
      if (info) {
        infos.push(info)
      }
    })
    infos.sort((a, b) => comparePaths(a.path, b.path))
    return infos
  }

  private updateDropIndicator(target: DropTarget<TItem>|undefined) {
    if (target) {
      const {type, index, depth} = target
      this.dropIndicator.setState({type, index, depth})
    } else {
      this.dropIndicator.setState({type: "none", index: 0, depth: 0})
    }
  }

  render() {
    const {root, rowHeight, indent} = this.propsWithDefaults()
    const children = root.children || []
    this.clearRows()
    const rootInfo = {item: root, selected: false, current: false, path: [], visible: false, visibleOffset: 0}
    this.addRowInfo(rootInfo)
    this.rootInfo = rootInfo

    return (
      <div ref={e => this.element = e} className="ReactDraggableTree" onDragOver={this.onDragOver} onDrop={this.onDrop} onContextMenu={this.onContextMenu}>
        {children.map((child, i) => this.renderItem(child, [i], true))}
        <DropIndicator ref={e => this.dropIndicator = e} rowHeight={rowHeight} indent={indent} />
      </div>
    )
  }

  private onClickRow = (rowInfo: TreeRowInfo<TItem>, ev: React.MouseEvent<Element>) => {
    const {selectedKeys} = this.props
    const {key} = rowInfo.item
    let newSelected: Set<Key>
    if (ev.ctrlKey || ev.metaKey) {
      newSelected = new Set(selectedKeys)
      if (newSelected.has(key)) {
        newSelected.delete(key)
      } else {
        newSelected.add(key)
      }
    } else if (ev.shiftKey && selectedKeys.size > 0) {
      const visibleKeys = this.visibleInfos.map(info => info.item.key)
      const selectedIndices = this.keysToInfos(selectedKeys).map(info => info.visibleOffset)
      const thisIndex = visibleKeys.indexOf(key)
      const min = Math.min(thisIndex, ...selectedIndices)
      const max = Math.max(thisIndex, ...selectedIndices)
      const keysToAdd = visibleKeys.slice(min, max + 1)
      newSelected = new Set(selectedKeys)
      for (const k of keysToAdd) {
        newSelected.add(k)
      }
    } else {
      newSelected = new Set([key])
    }
    newSelected = this.removeAncestorsFromSelection(newSelected)

    this.props.onSelectedKeysChange(newSelected, this.keysToInfos(newSelected))
  }

  private onContextMenu = (ev: React.MouseEvent<Element>) => {
    const {rowHeight, selectedKeys} = this.props
    const {visibleInfos} = this
    const rect = this.element.getBoundingClientRect()
    const y = ev.clientY - rect.top + this.element.scrollTop
    const i = Math.floor(y / rowHeight)
    const rowInfo = (0 <= i && i < visibleInfos.length) ? visibleInfos[i] : undefined
    if (rowInfo && !selectedKeys.has(rowInfo.item.key)) {
      this.onClickRow(rowInfo, ev)
    }
    this.props.onContextMenu(rowInfo, ev)
  }

  private onDragOver = (ev: React.DragEvent<Element>) => {
    ev.preventDefault()
    const copy = ev.altKey || ev.ctrlKey
    ev.dataTransfer.dropEffect = copy ? "copy" : "move"
    const target = this.getDropTarget(ev)
    if (this.canDrop(target.dest, target.destIndex)) {
      this.updateDropIndicator(target)
      return
    }
    this.updateDropIndicator(undefined)
  }

  private getDropTarget(ev: {clientX: number, clientY: number}): DropTarget<TItem> {
    const {rowHeight, indent} = this.propsWithDefaults()
    const rect = this.element.getBoundingClientRect()
    const x = ev.clientX - rect.left + this.element.scrollLeft
    const y = ev.clientY - rect.top + this.element.scrollTop
    const overIndex = clamp(Math.floor(y / rowHeight), 0, this.visibleInfos.length)
    const offset = y - overIndex * rowHeight

    if (overIndex < this.visibleInfos.length) {
      if (rowHeight * 0.25 < offset && offset < rowHeight * 0.75) {
        const dest = this.visibleInfos[overIndex]
        if (dest.item.children) {
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

    const betweenIndex = clamp((offset < rowHeight / 2) ? overIndex : overIndex + 1, 0, this.visibleInfos.length)

    let path = (betweenIndex == this.visibleInfos.length)
      ? [this.rootInfo.item.children!.length]
      : this.visibleInfos[betweenIndex].path
    if (0 < betweenIndex) {
      const prev = this.visibleInfos[betweenIndex - 1]
      let prevPath = prev.path
      const prevChildren = prev.item.children
      const prevCollapsed = prev.item.collapsed
      if (prevChildren && prevChildren.length == 0 && !prevCollapsed) {
        prevPath = [...prevPath, -1]
      }
      if (path.length < prevPath.length) {
        const depth = clamp(Math.floor(x / indent) - 1, path.length, prevPath.length)
        path = [...prevPath.slice(0, depth - 1), prevPath[depth - 1] + 1]
      }
    }
    const destPath = path.slice(0, -1)
    const dest = this.pathToInfo.get(destPath.join())!
    return {
      type: "between",
      index: betweenIndex,
      dest,
      destIndex: path[path.length - 1],
      depth: path.length - 1
    }
  }

  private canDrop(destInfo: TreeRowInfo<TItem>, destIndex: number) {
    const {selectedKeys} = this.props
    const {path} = destInfo
    for (let i = 0; i < path.length; ++i) {
      const ancestorPath = path.slice(0, path.length - i)
      const ancestor = this.pathToInfo.get(ancestorPath.join())
      if (ancestor) {
        const ancestorKey = ancestor.item.key
        if (selectedKeys.has(ancestorKey)) {
          return false
        }
      }
    }
    return true
  }

  private onDrop = (ev: React.DragEvent<Element>) => {
    this.updateDropIndicator(undefined)

    const data = ev.dataTransfer.getData(DRAG_MIME)
    if (!data) {
      return
    }
    let {clientX, clientY} = ev
    const target = this.getDropTarget({clientX, clientY})
    const {dest: destInfo, destIndex} = target

    if (!this.canDrop(destInfo, destIndex)) {
      return
    }
    const srcInfos = this.keysToInfos(this.props.selectedKeys)

    const copy = ev.altKey || ev.ctrlKey

    if (copy) {
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

interface TogglerProps {
  visible: boolean
  collapsed: boolean
  onClick: () => void
}

function Toggler(props: TogglerProps) {
  const claassName = classNames("ReactDraggableTree_toggler", {
    "ReactDraggableTree_toggler-visible": props.visible,
    "ReactDraggableTree_toggler-collapsed": props.collapsed,
  })
  return <div className={claassName} onClick={props.onClick}/>
}

interface DropIndicatorProps {
  rowHeight: number
  indent: number
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
    const {rowHeight, indent} = this.props
    const offset = index * rowHeight
    const dropOverStyle = {
      top: `${offset}px`,
      height: `${rowHeight}px`,
    }
    const dropBetweenStyle = {
      top: `${offset - 1}px`,
      height: "2px",
      left: `${(depth + 1) * indent}px`,
      width: `calc(100% - ${(depth + 1) * indent}px)`
    }
    return (
      <div>
        <div className="ReactDraggableTree_dropOver" hidden={type != "over"} style={dropOverStyle} />
        <div className="ReactDraggableTree_dropBetween" hidden={type != "between"} style={dropBetweenStyle} />
      </div>
    )
  }
}
