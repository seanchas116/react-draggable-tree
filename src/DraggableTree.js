"use strict";
const React = require("react");
const classNames = require("classnames");
class Tree extends React.Component {
    constructor() {
        super(...arguments);
        this.keys = [];
    }
    renderItems(nodes, parentPath) {
        const { childOffset, renderNode, onCurrentChange, onSelectedChange, current, selected } = this.props;
        let elems = [];
        nodes.forEach((node, i) => {
            const { key } = node;
            this.keys.push(key);
            const path = [...parentPath, i];
            const style = {
                paddingLeft: parentPath.length * childOffset + "px",
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
            elems.push(React.createElement("div", {className: className, style: style, key: String(node.key), onClick: onClick}, renderNode(node, { selected: isSelected, current: isCurrent })));
            if (node.children) {
                elems.push(...this.renderItems(node.children, path));
            }
        });
        return elems;
    }
    render() {
        const { nodes } = this.props;
        this.keys = [];
        return (React.createElement("div", {className: "ReactDraggableTree"}, this.renderItems(nodes, [])));
    }
}
exports.Tree = Tree;
