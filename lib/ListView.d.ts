import * as React from 'react';
export declare type Key = number | string;
export interface ListRowInfo<T> {
    item: T;
    selected: boolean;
    index: number;
    visible: boolean;
    visibleOffset: number;
}
export interface ListDelegate<T> {
    getKey(item: T): Key;
    renderRow(info: ListRowInfo<T>): JSX.Element;
    onMove(src: ListRowInfo<T>[], destIndexBefore: number, destIndexAfter: number): void;
    onCopy(src: ListRowInfo<T>[], destIndexBefore: number): void;
    onContextMenu(info: ListRowInfo<T> | undefined, ev: React.MouseEvent<Element>): void;
    onSelectedKeysChange(keys: Set<Key>, rows: ListRowInfo<T>[]): void;
}
export interface ListViewProps<T> {
    items: T[];
    rowHeight: number;
    indent?: number;
    selectedKeys: Set<Key>;
    delegate: ListDelegate<T>;
}
export declare class ListView<T> extends React.Component<ListViewProps<T>, {}> {
    render(): JSX.Element;
}
