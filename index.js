"use strict";
const React = require("react");
const classNames = require("classnames");
class Tree extends React.Component {
    constructor() {
        super(...arguments);
        this.keys = [];
    }
    renderNode(node, path) {
        const { childOffset, renderNode, onCurrentChange, onSelectedChange, onCollapsedChange, current, selected } = this.props;
        const { key } = node;
        this.keys.push(key);
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
                onSelectedChange(newSelected);
            }
            else if (ev.shiftKey && current != undefined) {
                const currentIndex = this.keys.indexOf(current);
                const thisIndex = this.keys.indexOf(key);
                const min = Math.min(thisIndex, currentIndex);
                const max = Math.max(thisIndex, currentIndex);
                const keysToAdd = this.keys.slice(min, max + 1);
                const newSelected = new Set(selected || []);
                for (const k of keysToAdd) {
                    newSelected.add(k);
                }
                onSelectedChange(newSelected);
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
            childrenContainer = React.createElement("div", {className: "ReactDraggableTree_children", hidden: node.collapsed}, node.children.map((child, i) => this.renderNode(child, [...path, i])));
        }
        return (React.createElement("div", {className: "ReactDraggableTree_subtree", key: String(key)}, 
            row, 
            childrenContainer));
    }
    render() {
        const { nodes } = this.props;
        this.keys = [];
        return (React.createElement("div", {className: "ReactDraggableTree"}, nodes.map((child, i) => this.renderNode(child, [i]))));
    }
}
exports.Tree = Tree;
