import React = require("react")
import * as classNames from "classnames"

export interface DropIndicatorProps {
  rowHeight: number
  indent: number
  dropOverClassName?: string
  dropBetweenClassName?: string
}

export interface DropIndicatorState {
  type: "none" | "over" | "between"
  index: number
  depth: number
}

export class DropIndicator extends React.Component<DropIndicatorProps, DropIndicatorState> {
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
      left: "0",
      top: `${offset}px`,
      width: "100%",
      height: `${rowHeight}px`,
    }
    const dropBetweenStyle = {
      top: `${offset - 1}px`,
      height: "0",
      left: `${(depth + 1) * indent}px`,
      width: `calc(100% - ${(depth + 1) * indent}px)`
    }
    return (
      <div>
        <div
          className={classNames("ReactDraggableTree_dropOver", this.props.dropOverClassName)}
          hidden={type != "over"} style={dropOverStyle}
        />
        <div
          className={classNames("ReactDraggableTree_dropBetween", this.props.dropBetweenClassName)}
          hidden={type != "between"} style={dropBetweenStyle}
        />
      </div>
    )
  }
}
