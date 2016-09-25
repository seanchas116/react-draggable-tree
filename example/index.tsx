import React = require("react")
import ReactDOM = require("react-dom")
import {DraggableTree} from "../src/DraggableTree"

class MyTree extends DraggableTree<string> {}

class Example extends React.Component<{}, {}> {
  data = [
    {value: "Foo", key: "0"},
    {value: "Bar", key: "1"},
    {value: "Baz", key: "2", children: [
      {value: "Lorem", key: "3"},
      {value: "ipsum", key: "4", children: [
        {value: "dolor", key: "5"},
        {value: "sit", key: "6"},
        {value: "amet", key: "7"},
      ]},
    ]},
  ]

  render() {
    return (
      <MyTree
        items={this.data}
        draggable={true}
        itemHeight={32}
        childOffset={16}
        renderItem={item => <div>{item.value}</div>}
        treeClassName=""
        itemClassName=""
      />
    )
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Example />, document.getElementById("example"))
})
