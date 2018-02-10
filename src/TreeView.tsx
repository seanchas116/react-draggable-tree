import React = require('react')
import * as classNames from 'classnames'
import { TreeRowInfo, TreeNode, Key } from './types'
import { TogglerProps, Toggler } from './Toggler'
import { DropIndicator } from './DropIndicator'
import { clamp, comparePaths, isPathEqual } from './util'

const DRAG_MIME = 'x-react-draggable-tree-drag'

interface DropTarget {
  type: 'between' | 'over'
  index: number
  dest: TreeRowInfo
  destIndex: number
  depth: number
}

export interface TreeProps {
  root: TreeNode
  rowHeight: number
  indent?: number
  className?: string
  rowClassName?: string
  rowSelectedClassName?: string
  childrenClassName?: string
  dropOverIndicatorClassName?: string
  dropBetweenIndicatorClassName?: string
  toggler?: React.ComponentType<TogglerProps>
  selectedKeys: Set<Key>
  rowContent: React.ComponentType<TreeRowInfo>
  onMove: (src: TreeRowInfo[], dest: TreeRowInfo, destIndex: number, destPathAfterMove: number[]) => void
  onCopy: (src: TreeRowInfo[], dest: TreeRowInfo, destIndex: number) => void
  onContextMenu?: (info: TreeRowInfo | undefined, ev: React.MouseEvent<Element>) => void
  onCollapsedChange: (info: TreeRowInfo, collapsed: boolean) => void
  onSelectedKeysChange: (selectedKeys: Set<Key>, selectedInfos: TreeRowInfo[]) => void
}

export
class TreeView extends React.Component<TreeProps, {}> {
  private element: HTMLElement
  private dropIndicator: DropIndicator
  private infoToPath = new Map<TreeRowInfo, number[]>()
  private pathToInfo = new Map<string, TreeRowInfo>() // using joined path as key string
  private visibleInfos: TreeRowInfo[] = []
  private keyToInfo = new Map<Key, TreeRowInfo>()
  private rootInfo: TreeRowInfo

  private removeAncestorsFromSelection (selection: Set<Key>) {
    const newSelection = new Set(selection)
    for (const { path } of this.keysToInfos(selection)) {
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

  private propsWithDefaults () {
    return Object.assign({}, {
      indent: 24
    }, this.props)
  }

  private clearRows () {
    this.visibleInfos = []
    this.pathToInfo.clear()
    this.infoToPath.clear()
    this.keyToInfo.clear()
  }

  private addRowInfo (rowInfo: TreeRowInfo) {
    this.infoToPath.set(rowInfo, rowInfo.path)
    this.pathToInfo.set(rowInfo.path.join(), rowInfo)
    if (rowInfo.visible) {
      this.visibleInfos.push(rowInfo)
    }
    this.keyToInfo.set(rowInfo.node.key, rowInfo)
  }

  private renderNode (node: TreeNode, path: number[], visible: boolean): JSX.Element[] {
    const { indent, rowHeight, selectedKeys } = this.propsWithDefaults()
    const { key } = node

    const isSelected = selectedKeys.has(key)
    const rowInfo = {
      node,
      selected: isSelected,
      path,
      visible,
      visibleOffset: this.visibleInfos.length
    }
    this.addRowInfo(rowInfo)

    const style = {
      paddingLeft: (path.length - 1) * indent + 'px',
      height: rowHeight + 'px'
    }

    const onDragStart = (ev: React.DragEvent<Element>) => {
      ev.dataTransfer.effectAllowed = 'copyMove'
      ev.dataTransfer.setData(DRAG_MIME, 'drag')

      if (!selectedKeys.has(key)) {
        const newSelected = new Set([key])
        this.props.onSelectedKeysChange(newSelected, this.keysToInfos(newSelected))
      }
    }

    const onDragEnd = () => {
      this.updateDropIndicator(undefined)
    }

    const onTogglerClick = (ev: React.MouseEvent<Element>) => {
      if (node.children) {
        this.props.onCollapsedChange(rowInfo, !node.collapsed)
        ev.stopPropagation()
      }
    }

    const rowClasses = classNames('ReactDraggableTree_row', this.props.rowClassName, isSelected && this.props.rowSelectedClassName, {
      'ReactDraggableTree_row-selected': isSelected
    })

    const { children, collapsed } = node
    const CustomToggler = this.props.toggler || Toggler

    const RowContent = this.props.rowContent

    let row = (
      <div
        key={`row-${key}`} className={rowClasses} style={style}
        onClick={ev => this.onClickRow(rowInfo, ev)}
        draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd}
      >
        <CustomToggler visible={!!children} collapsed={collapsed} onClick={onTogglerClick} />
        <RowContent {...rowInfo} />
      </div>
    )

    if (children) {
      const childrenVisible = visible && !collapsed
      const childrenClassName = classNames('ReactDraggableTree_children', this.props.childrenClassName)
      const childRows = <div key={`children-${key}`} className={childrenClassName} hidden={collapsed}>
        {children.map((child, i) => this.renderNode(child, [...path, i], childrenVisible))}
      </div>
      return [row, childRows]
    } else {
      return [row]
    }
  }

  private keysToInfos (keys: Set<Key>) {
    const infos: TreeRowInfo[] = []
    keys.forEach(key => {
      const info = this.keyToInfo.get(key)
      if (info) {
        infos.push(info)
      }
    })
    infos.sort((a, b) => comparePaths(a.path, b.path))
    return infos
  }

  private updateDropIndicator (target: DropTarget | undefined) {
    if (target) {
      const { type, index, depth } = target
      this.dropIndicator.setState({ type, index, depth })
    } else {
      this.dropIndicator.setState({ type: 'none', index: 0, depth: 0 })
    }
  }

  render () {
    const { root, rowHeight, indent } = this.propsWithDefaults()
    const children = root.children || []
    this.clearRows()
    const rootInfo = { node: root, selected: false, current: false, path: [], visible: false, visibleOffset: 0 }
    this.addRowInfo(rootInfo)
    this.rootInfo = rootInfo

    const className = classNames('ReactDraggableTree', this.props.className)

    return (
      <div ref={e => this.element = e!} className={className} onDragOver={this.onDragOver} onDrop={this.onDrop} onContextMenu={this.onContextMenu}>
        {children.map((child, i) => this.renderNode(child, [i], true))}
        <DropIndicator
          ref={e => this.dropIndicator = e!} rowHeight={rowHeight} indent={indent}
          dropOverClassName={this.props.dropOverIndicatorClassName} dropBetweenClassName={this.props.dropBetweenIndicatorClassName}
        />
      </div>
    )
  }

  private onClickRow = (rowInfo: TreeRowInfo, ev: React.MouseEvent<Element>) => {
    const { selectedKeys } = this.props
    const { key } = rowInfo.node
    let newSelected: Set<Key>
    if (ev.ctrlKey || ev.metaKey) {
      newSelected = new Set(selectedKeys)
      if (newSelected.has(key)) {
        newSelected.delete(key)
      } else {
        newSelected.add(key)
      }
    } else if (ev.shiftKey && selectedKeys.size > 0) {
      const visibleKeys = this.visibleInfos.map(info => info.node.key)
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
    const { rowHeight, selectedKeys } = this.props
    const { visibleInfos } = this
    const rect = this.element.getBoundingClientRect()
    const y = ev.clientY - rect.top + this.element.scrollTop
    const i = Math.floor(y / rowHeight)
    const rowInfo = (0 <= i && i < visibleInfos.length) ? visibleInfos[i] : undefined
    if (rowInfo && !selectedKeys.has(rowInfo.node.key)) {
      this.onClickRow(rowInfo, ev)
    }
    if (this.props.onContextMenu) {
      this.props.onContextMenu(rowInfo, ev)
    }
  }

  private onDragOver = (ev: React.DragEvent<Element>) => {
    ev.preventDefault()
    const copy = ev.altKey || ev.ctrlKey
    ev.dataTransfer.dropEffect = copy ? 'copy' : 'move'
    const target = this.getDropTarget(ev)
    if (this.canDrop(target.dest, target.destIndex)) {
      this.updateDropIndicator(target)
      return
    }
    this.updateDropIndicator(undefined)
  }

  private getDropTarget (ev: {clientX: number, clientY: number}): DropTarget {
    const { rowHeight, indent } = this.propsWithDefaults()
    const rect = this.element.getBoundingClientRect()
    const x = ev.clientX - rect.left + this.element.scrollLeft
    const y = ev.clientY - rect.top + this.element.scrollTop
    const overIndex = clamp(Math.floor(y / rowHeight), 0, this.visibleInfos.length)
    const offset = y - overIndex * rowHeight

    if (overIndex < this.visibleInfos.length) {
      if (rowHeight * 0.25 < offset && offset < rowHeight * 0.75) {
        const dest = this.visibleInfos[overIndex]
        if (dest.node.children) {
          return {
            type: 'over',
            index: overIndex,
            dest,
            destIndex: 0,
            depth: 0
          }
        }
      }
    }

    const betweenIndex = clamp((offset < rowHeight / 2) ? overIndex : overIndex + 1, 0, this.visibleInfos.length)

    let path = (betweenIndex == this.visibleInfos.length)
      ? [this.rootInfo.node.children!.length]
      : this.visibleInfos[betweenIndex].path
    if (0 < betweenIndex) {
      const prev = this.visibleInfos[betweenIndex - 1]
      let prevPath = prev.path
      const prevChildren = prev.node.children
      const prevCollapsed = prev.node.collapsed
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
      type: 'between',
      index: betweenIndex,
      dest,
      destIndex: path[path.length - 1],
      depth: path.length - 1
    }
  }

  private canDrop (destInfo: TreeRowInfo, destIndex: number) {
    const { selectedKeys } = this.props
    const { path } = destInfo
    for (let i = 0; i < path.length; ++i) {
      const ancestorPath = path.slice(0, path.length - i)
      const ancestor = this.pathToInfo.get(ancestorPath.join())
      if (ancestor) {
        const ancestorKey = ancestor.node.key
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
    let { clientX, clientY } = ev
    const target = this.getDropTarget({ clientX, clientY })
    const { dest: destInfo, destIndex } = target

    if (!this.canDrop(destInfo, destIndex)) {
      return
    }
    const srcInfos = this.keysToInfos(this.props.selectedKeys)

    const copy = ev.altKey || ev.ctrlKey

    if (copy) {
      this.props.onCopy(srcInfos, destInfo, destIndex)
    } else {
      const destPathBefore = [...destInfo.path, destIndex]
      const destPathAfter = [...destPathBefore]

      for (const srcInfo of srcInfos) {
        const srcParent = srcInfo.path.slice(0, -1)
        const srcIndex = srcInfo.path[srcInfo.path.length - 1]

        for (let i = 0; i < destPathBefore.length; ++i) {
          const destAncestor = destPathBefore.slice(0, i)
          const destIndex = destPathBefore[i]
          if (isPathEqual(srcParent, destAncestor) && srcIndex < destIndex) {
            --destPathAfter[i]
          }
        }
      }
      this.props.onMove(srcInfos, destInfo, destIndex, destPathAfter)
    }
    ev.preventDefault()
  }
}
