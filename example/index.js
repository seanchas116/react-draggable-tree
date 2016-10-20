"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var ReactDOM = require("react-dom");
var DraggableTree_1 = require("../src/DraggableTree");
var classNames = require("classnames");
var MyTree = (function (_super) {
    __extends(MyTree, _super);
    function MyTree() {
        _super.apply(this, arguments);
    }
    return MyTree;
}(DraggableTree_1.Tree));
function itemAt(items, path) {
    var at = items[path[0]];
    if (path.length == 1) {
        return at;
    }
    else {
        return itemAt(at.children, path.slice(1));
    }
}
function ExampleCell(props) {
    var value = props.value, selected = props.selected, current = props.current;
    return React.createElement("div", {className: classNames("example-cell", { selected: selected, current: current })}, value);
}
var Example = (function (_super) {
    __extends(Example, _super);
    function Example() {
        _super.apply(this, arguments);
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
    Example.prototype.toNode = function (item) {
        var _this = this;
        return {
            value: item.value,
            key: item.key,
            collapsed: this.collapsedKeys.has(item.key),
            children: item.children ? item.children.map(function (i) { return _this.toNode(i); }) : undefined
        };
    };
    Example.prototype.render = function () {
        var _this = this;
        var changeCurrent = function (key) {
            _this.currentKey = key.toString();
            _this.forceUpdate();
        };
        return (React.createElement(MyTree, {nodes: this.items.map(function (i) { return _this.toNode(i); }), current: this.currentKey, selected: this.selectedKeys, draggable: true, childOffset: 16, renderNode: function (node, _a) {
            var selected = _a.selected, current = _a.current;
            return React.createElement(ExampleCell, {value: node.value, selected: selected, current: current});
        }, onCurrentChange: changeCurrent}));
    };
    return Example;
}(React.Component));
window.addEventListener("DOMContentLoaded", function () {
    ReactDOM.render(React.createElement(Example, null), document.getElementById("example"));
});
