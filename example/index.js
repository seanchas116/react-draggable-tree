"use strict";
const React = require("react");
const ReactDOM = require("react-dom");
const DraggableTree_1 = require("../src/DraggableTree");
const classNames = require("classnames");
class MyTree extends DraggableTree_1.Tree {
}
function itemAt(items, path) {
    const at = items[path[0]];
    if (path.length == 1) {
        return at;
    }
    else {
        return itemAt(at.children, path.slice(1));
    }
}
function ExampleCell(props) {
    const { value, selected, current } = props;
    return React.createElement("div", {className: classNames("example-cell", { selected, current })}, value);
}
class Example extends React.Component {
    constructor() {
        super(...arguments);
        this.items = [
            { value: "Foo", key: "0" },
            { value: "Baz", key: "2", children: [
                    { value: "Lorem", key: "3" },
                    { value: "ipsum", key: "4", children: [
                            { value: "dolor", key: "5" },
                            { value: "sit", key: "6" },
                            { value: "amet", key: "7" },
                        ] },
                ] },
            { value: "Bar", key: "1" },
        ];
        this.currentKey = "0";
        this.selectedKeys = new Set();
        this.collapsedKeys = new Set();
    }
    toNode(item) {
        return {
            value: item.value,
            key: item.key,
            collapsed: this.collapsedKeys.has(item.key),
            children: item.children ? item.children.map(i => this.toNode(i)) : undefined
        };
    }
    render() {
        const changeCurrent = (key) => {
            this.currentKey = key;
            this.forceUpdate();
        };
        const changeSelected = (keys) => {
            this.selectedKeys = keys;
            this.forceUpdate();
        };
        return (React.createElement(MyTree, {nodes: this.items.map(i => this.toNode(i)), current: this.currentKey, selected: this.selectedKeys, draggable: true, childOffset: 16, renderNode: (node, { selected, current }) => React.createElement(ExampleCell, {value: node.value, selected: selected, current: current}), onSelectedChange: changeSelected, onCurrentChange: changeCurrent}));
    }
}
window.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(React.createElement(Example, null), document.getElementById("example"));
});
