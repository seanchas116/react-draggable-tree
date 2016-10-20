/// <reference types="react" />
import React = require("react");
export interface TreeNode<TValue, TKey> {
    value: TValue;
    children?: TreeNode<TValue, TKey>[];
    key: TKey;
    collapsed?: boolean;
}
export interface NodeInfo<TValue, TKey> {
    node: TreeNode<TValue, TKey>;
    current: boolean;
    selected: boolean;
    path: number[];
}
export interface TreeProps<TValue, TKey> {
    nodes: TreeNode<TValue, TKey>[];
    draggable: boolean;
    childOffset: number;
    renderNode: (nodeInfo: NodeInfo<TValue, TKey>) => JSX.Element;
    current?: TKey;
    selected?: Set<TKey>;
    onSelectedChange: (keys: Set<TKey>) => void;
    onCurrentChange: (key: TKey) => void;
}
export declare class Tree<TValue, TKey> extends React.Component<TreeProps<TValue, TKey>, {}> {
    keys: TKey[];
    elements: JSX.Element[];
    renderNode(node: TreeNode<TValue, TKey>, path: number[]): void;
    render(): JSX.Element;
}
