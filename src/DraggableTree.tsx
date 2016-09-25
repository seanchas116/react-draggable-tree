import React = require("react")

export
interface DraggableItem<T> {
  value: T
  children?: DraggableItem<T>[]
  key: string
  current: boolean
  selected: boolean
  collapsed: boolean
}

export
interface DraggableTreeProps<T> {
  items: DraggableItem<T>[]
  draggable: boolean
  itemHeight: number
  childOffset: number
  renderItem: (item: DraggableItem<T>) => JSX.Element
  //move: (src: number[][], dest: number[]) => void
  //copy: (src: number[][], dest: number[]) => void
  //toggleCollapsed: (path: number[], collapsed: boolean) => void
  //toggleSelected: (path: number[], selected: boolean) => void
  changeCurrent: (path: number[]) => void
}

export
class DraggableTree<T> extends React.Component<DraggableTreeProps<T>, {}> {
  renderItems(items: DraggableItem<T>[], parentPath: number[]) {
    const {itemHeight, childOffset, renderItem, changeCurrent} = this.props
    let elems: JSX.Element[] = []
    items.forEach((item, i) => {
      const path = [...parentPath, i]
      const style = {
        paddingLeft: parentPath.length * childOffset + "px",
        height: itemHeight + "px",
      }
      const state = {
        selected: false,
        current: false,
      }
      const onClick = () => {
        changeCurrent(path)
      }
      elems.push(
        <div className="ReactDraggableTree_Row" style={style} key={item.key} onClick={onClick}>
          {renderItem(item)}
        </div>
      )
      if (item.children) {
        elems.push(...this.renderItems(item.children, path))
      }
    })
    return elems
  }

  render() {
    const {items} = this.props

    return (
      <div className="ReactDraggableTree">
        {this.renderItems(items, [])}
      </div>
    )
  }
}
