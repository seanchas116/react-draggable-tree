import React = require("react");
export declare type Key = string | number;
export interface RowInfo<TItem> {
    item: TItem;
    selected: boolean;
    path: number[];
    visible: boolean;
    visibleOffset: number;
}
export interface TreeDelegate<TItem> {
    renderRow(info: RowInfo<TItem>): JSX.Element;
    getChildren(item: TItem): TItem[] | undefined;
    getDroppable(src: TItem, dst: TItem): boolean;
    getKey(item: TItem): Key;
    getCollapsed(item: TItem): boolean;
    onMove: (src: RowInfo<TItem>[], dest: RowInfo<TItem>, destIndexBefore: number, destIndexAfter: number) => void;
    onCopy: (src: RowInfo<TItem>[], dest: RowInfo<TItem>, destIndexBefore: number) => void;
    onContextMenu: (info: RowInfo<TItem> | undefined, ev: React.MouseEvent<Element>) => void;
    onCollapsedChange: (info: RowInfo<TItem>, collapsed: boolean) => void;
    onSelectedKeysChange: (selectedKeys: Set<Key>, selectedInfos: RowInfo<TItem>[]) => void;
}
export interface TreeProps<TItem> {
    root: TItem;
    rowHeight: number;
    indent?: number;
    selectedKeys: Set<Key>;
    delegate: TreeDelegate<TItem>;
}
export declare class Tree<TItem> extends React.Component<TreeProps<TItem>, {}> {
    private element;
    private dropIndicator;
    private infoToPath;
    private pathToInfo;
    private visibleInfos;
    private keyToInfo;
    private rootInfo;
    private removeAncestorsFromSelection(selection);
    private propsWithDefaults();
    private clearRows();
    private addRowInfo(rowInfo);
    private renderItem(item, path, visible);
    private keysToInfos(keys);
    private updateDropIndicator(target);
    render(): JSX.Element;
    private onClickRow;
    private onContextMenu;
    private onDragOver;
    private getDropTarget(ev);
    private canDrop(destInfo, destIndex);
    private onDrop;
}
