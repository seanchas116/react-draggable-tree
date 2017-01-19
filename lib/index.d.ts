import React = require("react");
export declare type Key = string | number;
export interface TreeNode {
    children?: this[];
    key: Key;
    collapsed?: boolean;
}
export interface NodeInfo<TNode extends TreeNode> {
    node: TNode;
    selected: boolean;
    path: number[];
    visible: boolean;
    visibleOffset: number;
}
export interface TreeProps<TNode extends TreeNode> {
    root: TNode;
    rowHeight: number;
    indent?: number;
    rowContent: (nodeInfo: NodeInfo<TNode>) => JSX.Element;
    selectedKeys: Set<Key>;
    onMove: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndexBefore: number, destIndexAfter: number) => void;
    onCopy: (src: NodeInfo<TNode>[], dest: NodeInfo<TNode>, destIndexBefore: number) => void;
    onContextMenu?: (nodeInfo?: NodeInfo<TNode>) => void;
    onCollapsedChange: (nodeInfo: NodeInfo<TNode>, collapsed: boolean) => void;
    onSelectedKeysChange: (selectedKeys: Set<Key>, selectedInfos: NodeInfo<TNode>[]) => void;
}
export declare class Tree<TNode extends TreeNode> extends React.Component<TreeProps<TNode>, {}> {
    private element;
    private dropIndicator;
    private infoToPath;
    private pathToInfo;
    private visibleInfos;
    private keyToInfo;
    private rootInfo;
    private removeAncestorsFromSelection(selection);
    private propsWithDefaults();
    private clearNodes();
    private addNodeInfo(nodeInfo);
    private renderNode(node, path, visible);
    private keysToInfos(keys);
    private updateDropIndicator(target);
    render(): JSX.Element;
    private onClickNode;
    private onContextMenu;
    private onDragOver;
    private getDropTarget(ev);
    private canDrop(destInfo, destIndex);
    private onDrop;
}
