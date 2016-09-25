"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var ReactDOM = require("react-dom");
var DraggableTree_1 = require("../src/DraggableTree");
var MyTree = (function (_super) {
    __extends(MyTree, _super);
    function MyTree() {
        _super.apply(this, arguments);
    }
    return MyTree;
}(DraggableTree_1.DraggableTree));
var Example = (function (_super) {
    __extends(Example, _super);
    function Example() {
        _super.apply(this, arguments);
        this.data = [
            { value: "Foo", key: "0" },
            { value: "Bar", key: "1" },
            { value: "Baz", key: "2", children: [
                    { value: "Lorem", key: "3" },
                    { value: "ipsum", key: "4", children: [
                            { value: "dolor", key: "5" },
                            { value: "sit", key: "6" },
                            { value: "amet", key: "7" },
                        ] },
                ] },
        ];
    }
    Example.prototype.render = function () {
        return (React.createElement(MyTree, {items: this.data, draggable: true, itemHeight: 32, childOffset: 16, renderItem: function (item) { return React.createElement("div", null, item.value); }, treeClassName: "", itemClassName: ""}));
    };
    return Example;
}(React.Component));
window.addEventListener("DOMContentLoaded", function () {
    ReactDOM.render(React.createElement(Example, null), document.getElementById("example"));
});
