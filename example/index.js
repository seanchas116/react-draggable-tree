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
}(DraggableTree_1.DraggableTree));
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
    var _a = props.item, value = _a.value, selected = _a.selected, current = _a.current;
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
    Example.prototype.treeItem = function (item) {
        var _this = this;
        return {
            value: item.value,
            key: item.key,
            current: item.key == this.currentKey,
            selected: this.selectedKeys.has(item.key),
            collapsed: this.collapsedKeys.has(item.key),
            children: item.children ? item.children.map(function (i) { return _this.treeItem(i); }) : undefined
        };
    };
    Example.prototype.render = function () {
        var _this = this;
        var changeCurrent = function (path) {
            _this.currentKey = itemAt(_this.items, path).key;
            _this.forceUpdate();
        };
        return (React.createElement(MyTree, {items: this.items.map(function (i) { return _this.treeItem(i); }), draggable: true, childOffset: 16, renderItem: function (item) { return React.createElement(ExampleCell, {item: item}); }, changeCurrent: changeCurrent}));
    };
    return Example;
}(React.Component));
window.addEventListener("DOMContentLoaded", function () {
    ReactDOM.render(React.createElement(Example, null), document.getElementById("example"));
});
