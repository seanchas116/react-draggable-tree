"use strict";
const React = require("react");
const classNames = require("classnames");
class Tree extends React.Component {
    constructor() {
        super(...arguments);
        this.keys = [];
        this.elements = [];
    }
    renderNode(node, path) {
        const { childOffset, renderNode, onCurrentChange, onSelectedChange, current, selected } = this.props;
        const { key } = node;
        this.keys.push(key);
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
        const isSelected = selected ? selected.has(key) : false;
        const isCurrent = key == current;
        const className = classNames("ReactDraggableTree_row", {
            "ReactDraggableTree_row-selected": isSelected,
            "ReactDraggableTree_row-current": isCurrent,
        });
        const caretClassName = classNames("ReactDraggableTree_caret", {
            "ReactDraggableTree_caret-hidden": !node.children,
            "ReactDraggableTree_caret-collapsed": node.collapsed
        });
        this.elements.push(React.createElement("div", {className: className, style: style, key: String(node.key), onClick: onClick}, 
            React.createElement("div", {className: caretClassName}), 
            renderNode({ node, selected: isSelected, current: isCurrent, path })));
        if (node.children && !node.collapsed) {
            for (const [i, child] of node.children.entries()) {
                this.renderNode(child, [...path, i]);
            }
        }
    }
    render() {
        const { nodes } = this.props;
        this.keys = [];
        this.elements = [];
        const elements = [];
        for (const [i, node] of nodes.entries()) {
            this.renderNode(node, [i]);
        }
        return (React.createElement("div", {className: "ReactDraggableTree"}, this.elements));
    }
}
exports.Tree = Tree;
