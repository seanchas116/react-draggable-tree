"use strict";
const React = require("react");
const classNames = require("classnames");
class Tree extends React.Component {
    constructor() {
        super(...arguments);
        this.keys = [];
        this.visibleKeys = [];
        this.keyToPath = new Map();
        this.pathToKey = new Map(); // using joined path as key string
    }
    removeAncestorsFromSelection(selection) {
        const newSelection = new Set(selection);
        for (const key of selection) {
            const path = this.keyToPath.get(key);
            if (path != undefined) {
                for (let i = 1; i < path.length; ++i) {
                    const subpath = path.slice(0, i);
                    const ancestor = this.pathToKey.get(subpath.join());
                    if (ancestor != undefined) {
                        newSelection.delete(ancestor);
                    }
                }
            }
        }
        return newSelection;
    }
    renderNode(node, path, visible) {
        const { childOffset, renderNode, onCurrentChange, onSelectedChange, onCollapsedChange, current, selected } = this.props;
        const { key } = node;
        this.keys.push(key);
        if (visible) {
            this.visibleKeys.push(key);
        }
        this.keyToPath.set(key, path);
        this.pathToKey.set(path.join(), key);
        const isSelected = selected ? selected.has(key) : false;
        const isCurrent = key == current;
        const nodeInfo = { node, selected: isSelected, current: isCurrent, path };
        const style = {
            paddingLeft: (path.length - 1) * childOffset + "px",
        };
        const onClick = (ev) => {
            if (ev.ctrlKey || ev.metaKey) {
                const newSelected = new Set(selected || []);
                newSelected.add(key);
                onSelectedChange(this.removeAncestorsFromSelection(newSelected));
            }
            else if (ev.shiftKey && current != undefined) {
                const currentIndex = this.visibleKeys.indexOf(current);
                const thisIndex = this.visibleKeys.indexOf(key);
                const min = Math.min(thisIndex, currentIndex);
                const max = Math.max(thisIndex, currentIndex);
                const keysToAdd = this.visibleKeys.slice(min, max + 1);
                const newSelected = new Set(selected || []);
                for (const k of keysToAdd) {
                    newSelected.add(k);
                }
                onSelectedChange(this.removeAncestorsFromSelection(newSelected));
            }
            else {
                onSelectedChange(new Set([key]));
            }
            onCurrentChange(key);
        };
        const onCaretClick = () => {
            if (node.children) {
                onCollapsedChange(nodeInfo, !node.collapsed);
            }
        };
        const className = classNames("ReactDraggableTree_row", {
            "ReactDraggableTree_row-selected": isSelected,
            "ReactDraggableTree_row-current": isCurrent,
        });
        const caretClassName = classNames("ReactDraggableTree_toggler", {
            "ReactDraggableTree_toggler-hidden": !node.children,
            "ReactDraggableTree_toggler-collapsed": node.collapsed
        });
        let row = React.createElement("div", {className: className, style: style, onClick: onClick}, 
            React.createElement("div", {className: caretClassName, onClick: onCaretClick}), 
            renderNode({ node, selected: isSelected, current: isCurrent, path }));
        let childrenContainer = undefined;
        if (node.children) {
            childrenContainer = React.createElement("div", {className: "ReactDraggableTree_children", hidden: node.collapsed}, node.children.map((child, i) => this.renderNode(child, [...path, i], !node.collapsed)));
        }
        return (React.createElement("div", {className: "ReactDraggableTree_subtree", key: String(key)}, 
            row, 
            childrenContainer));
    }
    render() {
        const { nodes } = this.props;
        this.keys = [];
        this.visibleKeys = [];
        this.keyToPath.clear();
        this.pathToKey.clear();
        return (React.createElement("div", {className: "ReactDraggableTree"}, nodes.map((child, i) => this.renderNode(child, [i], true))));
    }
}
exports.Tree = Tree;
