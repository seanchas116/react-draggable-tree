import React = require('react');
import { TreeRowInfo, TreeNode, Key } from './types';
import { TogglerProps } from './Toggler';
export interface TreeProps {
    root: TreeNode;
    rowHeight: number;
    indent?: number;
    className?: string;
    rowClassName?: string;
    rowSelectedClassName?: string;
    childrenClassName?: string;
    dropOverIndicatorClassName?: string;
    dropBetweenIndicatorClassName?: string;
    toggler?: React.ComponentType<TogglerProps>;
    selectedKeys: Set<Key>;
    rowContent: React.ComponentType<TreeRowInfo>;
    onMove: (src: TreeRowInfo[], dest: TreeRowInfo, destIndex: number, destPathAfterMove: number[]) => void;
    onCopy: (src: TreeRowInfo[], dest: TreeRowInfo, destIndex: number) => void;
    onContextMenu?: (info: TreeRowInfo | undefined, ev: React.MouseEvent<Element>) => void;
    onCollapsedChange: (info: TreeRowInfo, collapsed: boolean) => void;
    onSelectedKeysChange: (selectedKeys: Set<Key>, selectedInfos: TreeRowInfo[]) => void;
}
export declare class TreeView extends React.Component<TreeProps, {}> {
    private element;
    private dropIndicator;
    private infoToPath;
    private pathToInfo;
    private visibleInfos;
    private keyToInfo;
    private rootInfo;
    render(): JSX.Element;
    private removeAncestorsFromSelection(selection);
    private propsWithDefaults();
    private clearRows();
    private addRowInfo(rowInfo);
    private renderNode(node, path, visible);
    private keysToInfos(keys);
    private updateDropIndicator(target);
    private onClickRow;
    private onContextMenu;
    private onDragOver;
    private getDropTarget(ev);
    private canDrop(destInfo, destIndex);
    private onDrop;
}
