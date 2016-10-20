"use strict";
const React = require("react");
const ReactDOM = require("react-dom");
const __1 = require("..");
const classNames = require("classnames");
class MyTree extends __1.Tree {
}
function ExampleCell(props) {
    const { value, selected, current } = props;
    return React.createElement("div", {className: classNames("example-cell", { selected, current })}, value);
}
class Example extends React.Component {
    constructor() {
        super(...arguments);
        this.nodes = [
            { value: "Foo", key: "0" },
            { value: "ipsum", key: "8", collapsed: true, children: [
                    { value: "dolor", key: "9" },
                    { value: "sit", key: "10" },
                    { value: "amet", key: "11" },
                ] },
            { value: "Baz", key: "2", children: [
                    { value: "Lorem", key: "3" },
                    { value: "ipsum", key: "4", collapsed: true, children: [
                            { value: "dolor", key: "5" },
                            { value: "sit", key: "6" },
                            { value: "amet", key: "7" },
                        ] },
                ] },
            { value: "Bar", key: "1" },
        ];
        this.currentKey = "0";
        this.selectedKeys = new Set();
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
        return (React.createElement(MyTree, {nodes: this.nodes, current: this.currentKey, selected: this.selectedKeys, draggable: true, childOffset: 16, renderNode: (node, { selected, current }) => React.createElement(ExampleCell, {value: node.value, selected: selected, current: current}), onSelectedChange: changeSelected, onCurrentChange: changeCurrent}));
    }
}
window.addEventListener("DOMContentLoaded", () => {
    ReactDOM.render(React.createElement(Example, null), document.getElementById("example"));
});
