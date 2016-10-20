"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var classNames = require("classnames");
var Tree = (function (_super) {
    __extends(Tree, _super);
    function Tree() {
        _super.apply(this, arguments);
        this.keys = [];
    }
    Tree.prototype.renderItems = function (nodes, parentPath) {
        var _this = this;
        var _a = this.props, childOffset = _a.childOffset, renderNode = _a.renderNode, onCurrentChange = _a.onCurrentChange, onSelectedChange = _a.onSelectedChange, current = _a.current, selected = _a.selected;
        var elems = [];
        nodes.forEach(function (node, i) {
            var key = node.key;
            _this.keys.push(key);
            var path = parentPath.concat([i]);
            var style = {
                paddingLeft: parentPath.length * childOffset + "px",
            };
            var onClick = function (ev) {
                if (ev.ctrlKey || ev.metaKey) {
                    var newSelected = new Set(selected || []);
                    newSelected.add(key);
                    onSelectedChange(newSelected);
                }
                else if (ev.shiftKey && current != undefined) {
                    var currentIndex = _this.keys.indexOf(current);
                    var thisIndex = _this.keys.indexOf(key);
                    var min = Math.min(thisIndex, currentIndex);
                    var max = Math.max(thisIndex, currentIndex);
                    var keysToAdd = _this.keys.slice(min, max + 1);
                    var newSelected = new Set(selected || []);
                    for (var _i = 0, keysToAdd_1 = keysToAdd; _i < keysToAdd_1.length; _i++) {
                        var k = keysToAdd_1[_i];
                        newSelected.add(k);
                    }
                    onSelectedChange(newSelected);
                }
                else {
                    onSelectedChange(new Set([key]));
                }
                onCurrentChange(key);
            };
            var isSelected = selected ? selected.has(key) : false;
            var isCurrent = key == current;
            var className = classNames("ReactDraggableTree_row", {
                "ReactDraggableTree_row-selected": isSelected,
                "ReactDraggableTree_row-current": isCurrent,
            });
            elems.push(React.createElement("div", {className: className, style: style, key: String(node.key), onClick: onClick}, renderNode(node, { selected: isSelected, current: isCurrent })));
            if (node.children) {
                elems.push.apply(elems, _this.renderItems(node.children, path));
            }
        });
        return elems;
    };
    Tree.prototype.render = function () {
        var nodes = this.props.nodes;
        this.keys = [];
        return (React.createElement("div", {className: "ReactDraggableTree"}, this.renderItems(nodes, [])));
    };
    return Tree;
}(React.Component));
exports.Tree = Tree;
