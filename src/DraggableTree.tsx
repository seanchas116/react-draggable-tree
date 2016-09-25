import React = require("react")

export
interface DraggableItem<T> {
  value: T
  children?: DraggableItem<T>[]
  key: string
  collapsed: boolean
}

export
interface DraggableItemState {
  selected: boolean
  current: boolean
}

export
interface DraggableTreeProps<T> {
  items: DraggableItem<T>[]
  draggable: boolean
  itemHeight: number
  childOffset: number
  renderItem: (item: DraggableItem<T>, state: DraggableItemState) => JSX.Element
  treeClassName: string
  itemClassName: string
}

export
class DraggableTree<T> extends React.Component<DraggableTreeProps<T>, {}> {
  render() {
    const {items, itemHeight, treeClassName, itemClassName, childOffset, renderItem} = this.props
    const renderItems = (items: DraggableItem<T>[], depth: number) => {
      return items.map(item => {
        const style = {
          paddingLeft: depth * childOffset + "px",
          height: itemHeight + "px",
        }
        const state = {
          selected: false,
          current: false,
        }
        const itemElem = (
          <div className={itemClassName} style={style} key={item.key}>
            {renderItem(item, state)}
          </div>
        )
        const childElems = item.children ? renderItems(item.children, depth + 1) : []
        return [itemElem, ...childElems]
      })
    }

    const treeStyle = {
      display: "flex",
      flexDirection: "column",
    }

    return (
      <div className={treeClassName} style={treeStyle}>
        {renderItems(items, 0)}
      </div>
    )
  }
}
