"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var classNames = require("classnames");
var bowser = require("bowser");
var DRAG_MIME = "x-react-draggable-tree-drag";
var Tree = (function (_super) {
    __extends(Tree, _super);
    function Tree() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.infoToPath = new Map();
        _this.pathToInfo = new Map(); // using joined path as key string
        _this.visibleInfos = [];
        _this.keyToInfo = new Map();
        _this.onClickNode = function (nodeInfo, ev) {
            var _a = _this.props, selectedKeys = _a.selectedKeys, onSelectedKeysChange = _a.onSelectedKeysChange;
            var key = nodeInfo.node.key;
            var newSelected;
            if (ev.ctrlKey || ev.metaKey) {
                newSelected = new Set(selectedKeys);
                if (newSelected.has(key)) {
                    newSelected.delete(key);
                }
                else {
                    newSelected.add(key);
                }
            }
            else if (ev.shiftKey && selectedKeys.size > 0) {
                var visibleKeys = _this.visibleInfos.map(function (info) { return info.node.key; });
                var selectedIndices = _this.keysToInfos(selectedKeys).map(function (info) { return info.visibleOffset; });
                var thisIndex = visibleKeys.indexOf(key);
                var min = Math.min.apply(Math, [thisIndex].concat(selectedIndices));
                var max = Math.max.apply(Math, [thisIndex].concat(selectedIndices));
                var keysToAdd = visibleKeys.slice(min, max + 1);
                newSelected = new Set(selectedKeys);
                for (var _i = 0, keysToAdd_1 = keysToAdd; _i < keysToAdd_1.length; _i++) {
                    var k = keysToAdd_1[_i];
                    newSelected.add(k);
                }
            }
            else {
                newSelected = new Set([key]);
            }
            newSelected = _this.removeAncestorsFromSelection(newSelected);
            onSelectedKeysChange(newSelected, _this.keysToInfos(newSelected));
        };
        _this.onContextMenu = function (ev) {
            var _a = _this.props, rowHeight = _a.rowHeight, onContextMenu = _a.onContextMenu, selectedKeys = _a.selectedKeys;
            var visibleInfos = _this.visibleInfos;
            var rect = _this.element.getBoundingClientRect();
            var y = ev.clientY - rect.top + _this.element.scrollTop;
            var i = Math.floor(y / rowHeight);
            var nodeInfo = (0 <= i && i < visibleInfos.length) ? visibleInfos[i] : undefined;
            if (nodeInfo && !selectedKeys.has(nodeInfo.node.key)) {
                _this.onClickNode(nodeInfo, ev);
            }
            if (onContextMenu) {
                onContextMenu(nodeInfo, ev);
            }
        };
        _this.onDragOver = function (ev) {
            ev.preventDefault();
            var copy = ev.altKey || ev.ctrlKey;
            ev.dataTransfer.dropEffect = copy ? "copy" : "move";
            var target = _this.getDropTarget(ev);
            if (_this.canDrop(target.dest, target.destIndex)) {
                _this.updateDropIndicator(target);
                return;
            }
            _this.updateDropIndicator(undefined);
        };
        _this.onDrop = function (ev) {
            _this.updateDropIndicator(undefined);
            var data = ev.dataTransfer.getData(DRAG_MIME);
            if (!data) {
                return;
            }
            // workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=644421
            var clientX = ev.clientX, clientY = ev.clientY;
            if (bowser.windows && bowser.chrome && bowser.version == "53.0") {
                clientX *= window.devicePixelRatio;
                clientY *= window.devicePixelRatio;
            }
            var target = _this.getDropTarget({ clientX: clientX, clientY: clientY });
            var destInfo = target.dest, destIndex = target.destIndex;
            if (!_this.canDrop(destInfo, destIndex)) {
                return;
            }
            var srcInfos = _this.keysToInfos(_this.props.selectedKeys);
            var copy = ev.altKey || ev.ctrlKey;
            if (copy) {
                _this.props.onCopy(srcInfos, destInfo, destIndex);
            }
            else {
                var destIndexAfter = destIndex;
                for (var _i = 0, srcInfos_1 = srcInfos; _i < srcInfos_1.length; _i++) {
                    var info = srcInfos_1[_i];
                    if (isPathEqual(info.path.slice(0, -1), destInfo.path)) {
                        var srcIndex = info.path[info.path.length - 1];
                        if (srcIndex < destIndex) {
                            destIndexAfter--;
                        }
                    }
                }
                _this.props.onMove(srcInfos, destInfo, destIndex, destIndexAfter);
            }
            ev.preventDefault();
        };
        return _this;
    }
    Tree.prototype.removeAncestorsFromSelection = function (selection) {
        var newSelection = new Set(selection);
        for (var _i = 0, _a = this.keysToInfos(selection); _i < _a.length; _i++) {
            var path = _a[_i].path;
            for (var i = 1; i < path.length; ++i) {
                var subpath = path.slice(0, i);
                var ancestor = this.pathToInfo.get(subpath.join());
                if (ancestor) {
                    newSelection.delete(ancestor.node.key);
                }
            }
        }
        return newSelection;
    };
    Tree.prototype.propsWithDefaults = function () {
        return Object.assign({}, {
            indent: 24,
        }, this.props);
    };
    Tree.prototype.clearNodes = function () {
        this.visibleInfos = [];
        this.pathToInfo.clear();
        this.infoToPath.clear();
        this.keyToInfo.clear();
    };
    Tree.prototype.addNodeInfo = function (nodeInfo) {
        this.infoToPath.set(nodeInfo, nodeInfo.path);
        this.pathToInfo.set(nodeInfo.path.join(), nodeInfo);
        if (nodeInfo.visible) {
            this.visibleInfos.push(nodeInfo);
        }
        this.keyToInfo.set(nodeInfo.node.key, nodeInfo);
    };
    Tree.prototype.renderNode = function (node, path, visible) {
        var _this = this;
        var _a = this.propsWithDefaults(), indent = _a.indent, rowHeight = _a.rowHeight, rowContent = _a.rowContent, onSelectedKeysChange = _a.onSelectedKeysChange, onCollapsedChange = _a.onCollapsedChange, selectedKeys = _a.selectedKeys;
        var key = node.key;
        var isSelected = selectedKeys.has(key);
        var nodeInfo = {
            node: node,
            selected: isSelected,
            path: path,
            visible: visible,
            visibleOffset: this.visibleInfos.length
        };
        this.addNodeInfo(nodeInfo);
        var style = {
            paddingLeft: (path.length - 1) * indent + "px",
            height: rowHeight + "px",
        };
        var onDragStart = function (ev) {
            ev.dataTransfer.effectAllowed = "copyMove";
            ev.dataTransfer.setData(DRAG_MIME, "drag");
            if (!selectedKeys.has(key)) {
                var newSelected = new Set([key]);
                onSelectedKeysChange(newSelected, _this.keysToInfos(newSelected));
            }
        };
        var onDragEnd = function () {
            _this.updateDropIndicator(undefined);
        };
        var onTogglerClick = function () {
            if (node.children) {
                onCollapsedChange(nodeInfo, !node.collapsed);
            }
        };
        var rowClasses = classNames("ReactDraggableTree_row", {
            "ReactDraggableTree_row-selected": isSelected,
        });
        var row = (React.createElement("div", { key: "row-" + key, className: rowClasses, style: style, onClick: function (ev) { return _this.onClickNode(nodeInfo, ev); }, draggable: true, onDragStart: onDragStart, onDragEnd: onDragEnd },
            React.createElement(Toggler, { visible: !!node.children, collapsed: !!node.collapsed, onClick: onTogglerClick }),
            rowContent(nodeInfo)));
        if (node.children) {
            var childrenVisible_1 = visible && !node.collapsed;
            var children = React.createElement("div", { key: "children-" + key, className: "ReactDraggableTree_children", hidden: node.collapsed }, node.children.map(function (child, i) { return _this.renderNode(child, path.concat([i]), childrenVisible_1); }));
            return [row, children];
        }
        else {
            return [row];
        }
    };
    Tree.prototype.keysToInfos = function (keys) {
        var _this = this;
        var infos = [];
        keys.forEach(function (key) {
            var info = _this.keyToInfo.get(key);
            if (info) {
                infos.push(info);
            }
        });
        infos.sort(function (a, b) { return comparePaths(a.path, b.path); });
        return infos;
    };
    Tree.prototype.updateDropIndicator = function (target) {
        if (target) {
            var type = target.type, index = target.index, depth = target.depth;
            this.dropIndicator.setState({ type: type, index: index, depth: depth });
        }
        else {
            this.dropIndicator.setState({ type: "none", index: 0, depth: 0 });
        }
    };
    Tree.prototype.render = function () {
        var _this = this;
        var _a = this.propsWithDefaults(), root = _a.root, rowHeight = _a.rowHeight, indent = _a.indent;
        var children = root.children || [];
        this.clearNodes();
        var rootInfo = { node: root, selected: false, current: false, path: [], visible: false, visibleOffset: 0 };
        this.addNodeInfo(rootInfo);
        this.rootInfo = rootInfo;
        return (React.createElement("div", { ref: function (e) { return _this.element = e; }, className: "ReactDraggableTree", onDragOver: this.onDragOver, onDrop: this.onDrop, onContextMenu: this.onContextMenu },
            children.map(function (child, i) { return _this.renderNode(child, [i], true); }),
            React.createElement(DropIndicator, { ref: function (e) { return _this.dropIndicator = e; }, rowHeight: rowHeight, indent: indent })));
    };
    Tree.prototype.getDropTarget = function (ev) {
        var _a = this.propsWithDefaults(), rowHeight = _a.rowHeight, indent = _a.indent;
        var rect = this.element.getBoundingClientRect();
        var x = ev.clientX - rect.left + this.element.scrollLeft;
        var y = ev.clientY - rect.top + this.element.scrollTop;
        var overIndex = clamp(Math.floor(y / rowHeight), 0, this.visibleInfos.length);
        var offset = y - overIndex * rowHeight;
        if (overIndex < this.visibleInfos.length) {
            if (rowHeight * 0.25 < offset && offset < rowHeight * 0.75) {
                var dest_1 = this.visibleInfos[overIndex];
                if (dest_1.node.children) {
                    return {
                        type: "over",
                        index: overIndex,
                        dest: dest_1,
                        destIndex: 0,
                        depth: 0,
                    };
                }
            }
        }
        var betweenIndex = clamp((offset < rowHeight / 2) ? overIndex : overIndex + 1, 0, this.visibleInfos.length);
        var path = (betweenIndex == this.visibleInfos.length)
            ? [this.rootInfo.node.children.length]
            : this.visibleInfos[betweenIndex].path;
        if (0 < betweenIndex) {
            var prev = this.visibleInfos[betweenIndex - 1];
            var prevPath = prev.path;
            if (prev.node.children && prev.node.children.length == 0 && !prev.node.collapsed) {
                prevPath = prevPath.concat([-1]);
            }
            if (path.length < prevPath.length) {
                var depth = clamp(Math.floor(x / indent) - 1, path.length, prevPath.length);
                path = prevPath.slice(0, depth - 1).concat([prevPath[depth - 1] + 1]);
            }
        }
        var destPath = path.slice(0, -1);
        var dest = this.pathToInfo.get(destPath.join());
        return {
            type: "between",
            index: betweenIndex,
            dest: dest,
            destIndex: path[path.length - 1],
            depth: path.length - 1
        };
    };
    Tree.prototype.canDrop = function (destInfo, destIndex) {
        var selectedKeys = this.props.selectedKeys;
        var path = destInfo.path;
        for (var i = 0; i < path.length; ++i) {
            var ancestorPath = path.slice(0, path.length - i);
            var ancestor = this.pathToInfo.get(ancestorPath.join());
            if (ancestor) {
                if (selectedKeys.has(ancestor.node.key)) {
                    return false;
                }
            }
        }
        return true;
    };
    return Tree;
}(React.Component));
exports.Tree = Tree;
function clamp(x, min, max) {
    return Math.max(min, Math.min(x, max));
}
function comparePaths(a, b) {
    for (var i = 0; true; ++i) {
        if (a.length == i && b.length == i) {
            return 0;
        }
        if (a.length == i || a[i] < b[i]) {
            return -1;
        }
        if (b.length == i || b[i] < a[i]) {
            return 1;
        }
    }
}
function isPathEqual(a, b) {
    if (a.length != b.length) {
        return;
    }
    for (var i = 0; i < a.length; ++i) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}
function Toggler(props) {
    var claassName = classNames("ReactDraggableTree_toggler", {
        "ReactDraggableTree_toggler-visible": props.visible,
        "ReactDraggableTree_toggler-collapsed": props.collapsed,
    });
    return React.createElement("div", { className: claassName, onClick: props.onClick });
}
var DropIndicator = (function (_super) {
    __extends(DropIndicator, _super);
    function DropIndicator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            type: "none",
            index: 0,
            depth: 0,
        };
        return _this;
    }
    DropIndicator.prototype.render = function () {
        var _a = this.state, type = _a.type, index = _a.index, depth = _a.depth;
        var _b = this.props, rowHeight = _b.rowHeight, indent = _b.indent;
        var offset = index * rowHeight;
        var dropOverStyle = {
            top: offset + "px",
            height: rowHeight + "px",
        };
        var dropBetweenStyle = {
            top: offset - 1 + "px",
            height: "2px",
            left: (depth + 1) * indent + "px",
            width: "calc(100% - " + (depth + 1) * indent + "px)"
        };
        return (React.createElement("div", null,
            React.createElement("div", { className: "ReactDraggableTree_dropOver", hidden: type != "over", style: dropOverStyle }),
            React.createElement("div", { className: "ReactDraggableTree_dropBetween", hidden: type != "between", style: dropBetweenStyle })));
    };
    return DropIndicator;
}(React.Component));
