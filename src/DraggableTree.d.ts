/// <reference types="react" />
import React = require("react");
export interface TreeNode<TValue, TKey> {
    value: TValue;
    children?: TreeNode<TValue, TKey>[];
    key: TKey;
    collapsed?: boolean;
}
export interface TreeProps<TValue, TKey> {
    nodes: TreeNode<TValue, TKey>[];
    draggable: boolean;
    childOffset: number;
    renderNode: (node: TreeNode<TValue, TKey>, options: {
        selected: boolean;
        current: boolean;
    }) => JSX.Element;
    current?: TKey;
    selected?: Set<TKey>;
    onSelectedChange: (keys: Set<TKey>) => void;
    onCurrentChange: (key: TKey) => void;
}
export declare class Tree<TValue, TKey> extends React.Component<TreeProps<TValue, TKey>, {}> {
    keys: TKey[];
    renderItems(nodes: TreeNode<TValue, TKey>[], parentPath: number[]): JSX.Element[];
    render(): JSX.Element;
}
