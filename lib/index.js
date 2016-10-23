"use strict";
const React = require("react");
const classNames = require("classnames");
const DRAG_MIME = "x-react-draggable-tree-drag";
class Tree extends React.Component {
    constructor(...args) {
        super(...args);
        this.infoToPath = new Map();
        this.pathToInfo = new Map();
        this.visibleInfos = [];
        this.keyToInfo = new Map();
        this.onDragOver = (ev) => {
            ev.preventDefault();
            ev.dataTransfer.dropEffect = ev.altKey ? "copy" : "move";
            const target = this.getDropTarget(ev);
            if (this.canDrop(target.dest, target.destIndex)) {
                this.updateDropIndicator(target);
                return;
            }
            this.updateDropIndicator(undefined);
        };
        this.onDrop = (ev) => {
            this.updateDropIndicator(undefined);
            const data = ev.dataTransfer.getData(DRAG_MIME);
            if (!data) {
                return;
            }
            const target = this.getDropTarget(ev);
            const { dest: destInfo, destIndex } = target;
            if (!this.canDrop(destInfo, destIndex)) {
                return;
            }
            const srcInfos = this.keysToInfos(this.props.selection.selectedKeys);
            if (ev.altKey) {
                this.props.onCopy(srcInfos, destInfo, destIndex);
            }
            else {
                let destIndexAfter = destIndex;
                for (let info of srcInfos) {
                    if (isPathEqual(info.path.slice(0, -1), destInfo.path)) {
                        const srcIndex = info.path[info.path.length - 1];
                        if (srcIndex < destIndex) {
                            destIndexAfter--;
                        }
                    }
                }
                this.props.onMove(srcInfos, destInfo, destIndex, destIndexAfter);
            }
            ev.preventDefault();
        };
    }
    removeAncestorsFromSelection(selection) {
        const newSelection = new Set(selection);
        for (const { path } of this.keysToInfos(selection)) {
            for (let i = 1; i < path.length; ++i) {
                const subpath = path.slice(0, i);
                const ancestor = this.pathToInfo.get(subpath.join());
                if (ancestor) {
                    newSelection.delete(ancestor.node.key);
                }
            }
        }
        return newSelection;
    }
    propsWithDefaults() {
        return Object.assign({}, {
            indent: 24,
        }, this.props);
    }
    clearNodes() {
        this.visibleInfos = [];
        this.pathToInfo.clear();
        this.infoToPath.clear();
        this.keyToInfo.clear();
    }
    addNodeInfo(nodeInfo) {
        this.infoToPath.set(nodeInfo, nodeInfo.path);
        this.pathToInfo.set(nodeInfo.path.join(), nodeInfo);
        if (nodeInfo.visible) {
            this.visibleInfos.push(nodeInfo);
        }
        this.keyToInfo.set(nodeInfo.node.key, nodeInfo);
    }
    renderNode(node, path, visible) {
        const { indent, rowHeight, rowContent, onSelectionChange, onCollapsedChange, selection } = this.propsWithDefaults();
        const { currentKey, selectedKeys } = selection;
        const { key } = node;
        const isSelected = selectedKeys.has(key);
        const isCurrent = key == currentKey;
        const nodeInfo = {
            node,
            selected: isSelected,
            current: isCurrent,
            path,
            visible,
            visibleOffset: this.visibleInfos.length
        };
        this.addNodeInfo(nodeInfo);
        const style = {
            paddingLeft: (path.length - 1) * indent + "px",
            height: rowHeight + "px",
        };
        const onClick = (ev) => {
            let newSelected;
            if (ev.ctrlKey || ev.metaKey) {
                newSelected = new Set(selectedKeys);
                newSelected.add(key);
            }
            else if (ev.shiftKey && currentKey != undefined) {
                const visibleKeys = this.visibleInfos.map(info => info.node.key);
                const currentIndex = visibleKeys.indexOf(currentKey);
                const thisIndex = visibleKeys.indexOf(key);
                const min = Math.min(thisIndex, currentIndex);
                const max = Math.max(thisIndex, currentIndex);
                const keysToAdd = visibleKeys.slice(min, max + 1);
                newSelected = new Set(selectedKeys);
                for (const k of keysToAdd) {
                    newSelected.add(k);
                }
            }
            else {
                newSelected = new Set([key]);
            }
            onSelectionChange({
                selectedKeys: this.removeAncestorsFromSelection(newSelected),
                currentKey: key
            });
        };
        const onDragStart = (ev) => {
            ev.dataTransfer.effectAllowed = "copyMove";
            ev.dataTransfer.setData(DRAG_MIME, "drag");
            if (!selectedKeys.has(key)) {
                onSelectionChange({
                    selectedKeys: new Set([key]),
                    currentKey: key
                });
            }
        };
        const onDragEnd = () => {
            this.updateDropIndicator(undefined);
        };
        const onTogglerClick = () => {
            if (node.children) {
                onCollapsedChange(nodeInfo, !node.collapsed);
            }
        };
        const rowClasses = classNames("ReactDraggableTree_row", {
            "ReactDraggableTree_row-selected": isSelected,
            "ReactDraggableTree_row-current": isCurrent,
        });
        let row = React.createElement("div", {key: `row-${key}`, className: rowClasses, style: style, onClick: onClick, draggable: true, onDragStart: onDragStart, onDragEnd: onDragEnd}, 
            React.createElement(Toggler, {visible: !!node.children, collapsed: !!node.collapsed, onClick: onTogglerClick}), 
            rowContent(nodeInfo));
        if (node.children) {
            const childrenVisible = visible && !node.collapsed;
            const children = React.createElement("div", {key: `children-${key}`, className: "ReactDraggableTree_children", hidden: node.collapsed}, node.children.map((child, i) => this.renderNode(child, [...path, i], childrenVisible)));
            return [row, children];
        }
        else {
            return [row];
        }
    }
    keysToInfos(keys) {
        const infos = [];
        for (const key of keys) {
            const info = this.keyToInfo.get(key);
            if (info) {
                infos.push(info);
            }
        }
        infos.sort((a, b) => comparePaths(a.path, b.path));
        return infos;
    }
    updateDropIndicator(target) {
        if (target) {
            const { type, index, depth } = target;
            this.dropIndicator.setState({ type, index, depth });
        }
        else {
            this.dropIndicator.setState({ type: "none", index: 0, depth: 0 });
        }
    }
    render() {
        const { root, rowHeight, indent } = this.propsWithDefaults();
        const children = root.children || [];
        this.clearNodes();
        const rootInfo = { node: root, selected: false, current: false, path: [], visible: false, visibleOffset: 0 };
        this.addNodeInfo(rootInfo);
        this.rootInfo = rootInfo;
        return (React.createElement("div", {ref: e => this.element = e, className: "ReactDraggableTree", onDragOver: this.onDragOver, onDrop: this.onDrop}, 
            children.map((child, i) => this.renderNode(child, [i], true)), 
            React.createElement(DropIndicator, {ref: e => this.dropIndicator = e, rowHeight: rowHeight, indent: indent})));
    }
    getDropTarget(ev) {
        const { rowHeight, indent } = this.propsWithDefaults();
        const rect = this.element.getBoundingClientRect();
        const x = ev.clientX - rect.left + this.element.scrollTop;
        const y = ev.clientY - rect.top + this.element.scrollLeft;
        const overIndex = clamp(Math.floor(y / rowHeight), 0, this.visibleInfos.length);
        const offset = y - overIndex * rowHeight;
        if (overIndex < this.visibleInfos.length) {
            if (rowHeight * 0.25 < offset && offset < rowHeight * 0.75) {
                const dest = this.visibleInfos[overIndex];
                if (dest.node.children) {
                    return {
                        type: "over",
                        index: overIndex,
                        dest,
                        destIndex: 0,
                        depth: 0,
                    };
                }
            }
        }
        const betweenIndex = (offset < rowHeight / 2) ? overIndex : overIndex + 1;
        if (betweenIndex < this.visibleInfos.length) {
            let { path } = this.visibleInfos[betweenIndex];
            if (0 < betweenIndex) {
                const prev = this.visibleInfos[betweenIndex - 1];
                let prevPath = prev.path;
                if (prev.node.children && prev.node.children.length == 0 && !prev.node.collapsed) {
                    prevPath = [...prevPath, -1];
                }
                if (path.length < prevPath.length) {
                    const depth = clamp(Math.floor(x / indent) - 1, path.length, prevPath.length);
                    path = [...prevPath.slice(0, depth - 1), prevPath[depth - 1] + 1];
                }
            }
            const destPath = path.slice(0, -1);
            const dest = this.pathToInfo.get(destPath.join());
            return {
                type: "between",
                index: betweenIndex,
                dest,
                destIndex: path[path.length - 1],
                depth: path.length - 1
            };
        }
        else {
            const dest = this.rootInfo;
            const { root } = this.props;
            return {
                type: "between",
                index: betweenIndex,
                dest,
                destIndex: dest.node.children.length,
                depth: 0
            };
        }
    }
    canDrop(destInfo, destIndex) {
        const { selectedKeys } = this.props.selection;
        const { path } = destInfo;
        for (let i = 0; i < path.length; ++i) {
            const ancestorPath = path.slice(0, path.length - i);
            const ancestor = this.pathToInfo.get(ancestorPath.join());
            if (ancestor) {
                if (selectedKeys.has(ancestor.node.key)) {
                    return false;
                }
            }
        }
        return true;
    }
}
exports.Tree = Tree;
function clamp(x, min, max) {
    return Math.max(min, Math.min(x, max));
}
function comparePaths(a, b) {
    for (let i = 0; true; ++i) {
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
    for (let i = 0; i < a.length; ++i) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}
function Toggler(props) {
    const claassName = classNames("ReactDraggableTree_toggler", {
        "ReactDraggableTree_toggler-visible": props.visible,
        "ReactDraggableTree_toggler-collapsed": props.collapsed,
    });
    return React.createElement("div", {className: claassName, onClick: props.onClick});
}
class DropIndicator extends React.Component {
    constructor(...args) {
        super(...args);
        this.state = {
            type: "none",
            index: 0,
            depth: 0,
        };
    }
    render() {
        const { type, index, depth } = this.state;
        const { rowHeight, indent } = this.props;
        const offset = index * rowHeight;
        const dropOverStyle = {
            top: `${offset}px`,
            height: `${rowHeight}px`,
        };
        const dropBetweenStyle = {
            top: `${offset - 1}px`,
            height: "2px",
            left: `${(depth + 1) * indent}px`,
            width: `calc(100% - ${(depth + 1) * indent}px)`
        };
        return (React.createElement("div", null, 
            React.createElement("div", {className: "ReactDraggableTree_dropOver", hidden: type != "over", style: dropOverStyle}), 
            React.createElement("div", {className: "ReactDraggableTree_dropBetween", hidden: type != "between", style: dropBetweenStyle})));
    }
}
