import React from "react";
import { TypedEmitter } from "tiny-typed-emitter";
import { TreeViewItem } from "./TreeViewItem";
import { assertNonNull, first } from "./utils";
import { TreeViewProps } from "./props";
import { DropIndication } from "./DropIndicator";

const DRAG_MIME = "application/x.react-draggable-tree-drag";

//// ItemRow

export interface ItemRow<T extends TreeViewItem> {
  item: T;
  depth: number;
}

function getItemRows<T extends TreeViewItem>(
  item: T,
  depth: number
): ItemRow<T>[] {
  return [
    { item, depth },
    ...item.children.flatMap((child) => getItemRows(child, depth + 1)),
  ];
}

export interface DropLocation<T extends TreeViewItem> {
  parent: T;
  before: T | undefined;
  indication: DropIndication;
}

export class TreeViewState<T extends TreeViewItem> extends TypedEmitter<{
  dropLocationChange(location: DropLocation<T> | undefined): void;
}> {
  constructor(props: TreeViewProps<T>) {
    super();
    this.props = props;
    this.rows = props.rootItem.children.flatMap((item) => getItemRows(item, 0));
  }

  setProps(props: TreeViewProps<T>) {
    if (this.props === props) {
      return;
    }
    this.props = props;
    this.rows = props.rootItem.children.flatMap((item) => getItemRows(item, 0));
  }

  props: TreeViewProps<T>;
  rows: readonly ItemRow<T>[];
  draggedItem: T | undefined = undefined;
  private _dropLocation: DropLocation<T> | undefined = undefined;
  readonly itemToDOM = new WeakMap<T, HTMLElement>();
  headerDOM: HTMLElement | undefined;

  get dropLocation(): DropLocation<T> | undefined {
    return this._dropLocation;
  }

  set dropLocation(dropLocation: DropLocation<T> | undefined) {
    if (this._dropLocation === dropLocation) {
      return;
    }
    this._dropLocation = dropLocation;
    this.emit("dropLocationChange", dropLocation);
  }

  get indentation(): number {
    return this.props.indentation ?? 16;
  }

  get dropIndicatorOffset(): number {
    return this.props.dropIndicatorOffset ?? 0;
  }

  private canDropData(
    location: DropLocation<T>,
    event: React.DragEvent,
    draggedItem: T | undefined
  ): boolean {
    return (
      this.props.canDropData?.(location.parent, {
        event,
        draggedItem,
      }) ?? false
    );
  }

  private handleDrop(
    location: DropLocation<T>,
    event: React.DragEvent,
    draggedItem: T | undefined
  ): boolean {
    if (!this.canDropData(location, event, draggedItem)) {
      return false;
    }
    this.props.handleDrop?.(location.parent, {
      event,
      draggedItem,
      before: location.before,
    });
    return true;
  }

  private getHeaderBottom(): number {
    if (!this.headerDOM) {
      return 0;
    }
    return this.headerDOM.offsetTop + this.headerDOM.offsetHeight;
  }

  private getItemDOMTop(item: T): number {
    return this.itemToDOM.get(item)?.offsetTop ?? 0;
  }
  private getItemDOMHeight(item: T): number {
    return this.itemToDOM.get(item)?.offsetHeight ?? 0;
  }
  private getItemDOMBottom(item: T): number {
    const dom = this.itemToDOM.get(item);
    if (!dom) {
      return 0;
    }
    return dom.offsetTop + dom.offsetHeight;
  }

  private getDropDepth(e: React.DragEvent): number {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(
      Math.round(
        (e.clientX - rect.left - this.dropIndicatorOffset) / this.indentation
      ),
      0
    );
  }

  private getDropLocationOver(item: T): DropLocation<T> {
    return {
      parent: item,
      before: item.children[0],
      indication: {
        type: "over",
        top: this.getItemDOMTop(item),
        height: this.getItemDOMHeight(item),
      },
    };
  }

  private getDropLocationBetween(
    index: number,
    dropDepth: number
  ): DropLocation<T> {
    if (this.rows.length === 0) {
      return {
        parent: this.props.rootItem,
        before: undefined,
        indication: {
          type: "between",
          top: 0,
          depth: 0,
        },
      };
    }

    if (index === 0) {
      return {
        parent: assertNonNull(this.rows[0].item.parent),
        before: this.rows[0].item,
        indication: {
          type: "between",
          top: this.getItemDOMTop(this.rows[0].item),
          depth: this.rows[0].depth,
        },
      };
    }

    const rowPrev = this.rows[index - 1];
    const rowNext = index < this.rows.length ? this.rows[index] : undefined;

    if (!rowNext || rowNext.depth < rowPrev.depth) {
      if (rowNext && dropDepth <= rowNext.depth) {
        //   Prev
        // ----
        // Next
        return {
          parent: assertNonNull(rowNext.item.parent),
          before: rowNext.item,
          indication: {
            type: "between",
            top: this.getItemDOMTop(rowNext.item),
            depth: rowNext.depth,
          },
        };
      }

      //     Prev
      //     ----
      // Next
      // or
      //     Prev
      //   ----
      // Next
      // or
      //     Prev
      //   ----
      // (no next items)

      const depth = Math.min(dropDepth, rowPrev.depth);
      const up = rowPrev.depth - depth;

      let parent = rowPrev.item.parent;
      for (let i = 0; i < up; ++i) {
        parent = parent?.parent;
      }

      return {
        parent: assertNonNull(parent),
        before: undefined,
        indication: {
          type: "between",
          top: this.getItemDOMBottom(rowPrev.item),
          depth: depth,
        },
      };
    } else {
      //  Prev
      //  ----
      //  Next
      // or
      //  Prev
      //    ----
      //    Next
      //
      return {
        parent: assertNonNull(rowNext.item.parent),
        before: rowNext.item,
        indication: {
          type: "between",
          top: this.getItemDOMTop(rowNext.item),
          depth: rowNext.depth,
        },
      };
    }
  }

  private getDropLocationForRow(
    index: number,
    event: React.DragEvent,
    draggedItem: T | undefined
  ): DropLocation<T> | undefined {
    const row = this.rows[index];
    const item = row.item;

    if (!item.parent) {
      throw new Error("item must have parent");
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const dropPos = (event.clientY - rect.top) / rect.height;
    const dropDepth = this.getDropDepth(event);

    const locationBefore = this.getDropLocationBetween(index, dropDepth);
    const locationOver = this.getDropLocationOver(item);
    const locationAfter = this.getDropLocationBetween(index + 1, dropDepth);

    if (!this.props.nonReorderable) {
      if (this.canDropData(locationOver, event, draggedItem)) {
        if (
          this.canDropData(locationBefore, event, draggedItem) &&
          dropPos < 1 / 4
        ) {
          return locationBefore;
        }
        if (
          this.canDropData(locationAfter, event, draggedItem) &&
          3 / 4 < dropPos
        ) {
          return locationAfter;
        }
        return locationOver;
      } else {
        if (
          this.canDropData(locationBefore, event, draggedItem) &&
          dropPos < 1 / 2
        ) {
          return locationBefore;
        }
        if (this.canDropData(locationAfter, event, draggedItem)) {
          return locationAfter;
        }
      }
    } else {
      const locationOverParent = this.getDropLocationOver(item.parent);
      if (this.canDropData(locationOver, event, draggedItem)) {
        return locationOver;
      } else if (this.canDropData(locationOverParent, event, draggedItem)) {
        return locationOverParent;
      }
    }
  }

  private getDropLocationForBackground(
    e: React.DragEvent<HTMLElement>
  ): DropLocation<T> {
    const rect = e.currentTarget.getBoundingClientRect();
    const top = e.clientY - rect.top;

    if (top <= this.getHeaderBottom()) {
      return {
        parent: this.props.rootItem,
        before: first(this.rows)?.item,
        indication: {
          type: "between",
          top: this.getHeaderBottom(),
          depth: 0,
        },
      };
    }

    return this.getDropLocationBetween(this.rows.length, this.getDropDepth(e));
  }

  //// Row drag and drop

  onRowDragStart(
    index: number,
    e: React.DragEvent<HTMLElement>,
    dragImage?: Element
  ) {
    const item = this.rows[index].item;

    if (!this.props.handleDragStart?.(item, { event: e })) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData(DRAG_MIME, "drag");
    this.draggedItem = item;

    if (dragImage) {
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    }
  }

  onRowDragEnd(index: number) {
    const item = this.rows[index].item;

    this.props.handleDragEnd?.(item);
  }

  onRowDragOver(index: number, e: React.DragEvent<HTMLElement>) {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? this.draggedItem
      : undefined;

    this.dropLocation = this.getDropLocationForRow(index, e, draggedItem);

    if (this.dropLocation) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  onRowDragEnter(index: number, e: React.DragEvent<HTMLElement>) {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? this.draggedItem
      : undefined;

    this.dropLocation = this.getDropLocationForRow(index, e, draggedItem);
    e.preventDefault();
    e.stopPropagation();
  }

  onRowDrop(index: number, e: React.DragEvent<HTMLElement>) {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? this.draggedItem
      : undefined;

    const dropLocation = this.getDropLocationForRow(index, e, draggedItem);
    if (dropLocation && this.handleDrop(dropLocation, e, draggedItem)) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.dropLocation = undefined;
    this.draggedItem = undefined;
  }

  //// Background drop

  onBackgroundDragEnter(e: React.DragEvent<HTMLElement>) {
    this.dropLocation = this.getDropLocationForBackground(e);
    e.preventDefault();
    e.stopPropagation();
  }
  onBackgroundDragLeave(e: React.DragEvent<HTMLElement>) {
    this.dropLocation = undefined;
    e.preventDefault();
    e.stopPropagation();
  }
  onBackgroundDragOver(e: React.DragEvent<HTMLElement>) {
    this.dropLocation = this.getDropLocationForBackground(e);
    if (this.canDropData(this.dropLocation, e, this.draggedItem)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  onBackgroundDrop(e: React.DragEvent<HTMLElement>) {
    const dropLocation = this.getDropLocationForBackground(e);
    if (this.handleDrop(dropLocation, e, this.draggedItem)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }
}
