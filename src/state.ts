import React from "react";
import { TypedEmitter } from "tiny-typed-emitter";
import { TreeViewItem } from "./TreeViewItem";
import { assertNonNull, first } from "./utils";
import { TreeViewProps } from "./props";

//// ItemRow

export interface ItemRow<T extends TreeViewItem> {
  item: T;
  depth: number;
}

export function getItemRows<T extends TreeViewItem>(
  item: T,
  depth: number
): ItemRow<T>[] {
  return [
    { item, depth },
    ...item.children.flatMap((child) => getItemRows(child, depth + 1)),
  ];
}

export type DropIndicator =
  | {
      type: "bar";
      top: number;
      depth: number;
    }
  | {
      type: "over";
      top: number;
      height: number;
    };

export class DropLocation<T extends TreeViewItem> {
  constructor(parent: T, before: T | undefined, indicator: DropIndicator) {
    this.parent = parent;
    this.before = before;
    this.indicator = indicator;
  }

  readonly parent: T;
  readonly before: T | undefined;
  readonly indicator: DropIndicator;

  canDropData(
    event: React.DragEvent,
    draggedItem: T | undefined,
    treeProps: TreeViewProps<T>
  ): boolean {
    return (
      treeProps.canDropData?.(this.parent, {
        event,
        draggedItem,
      }) ?? false
    );
  }

  handleDrop(
    event: React.DragEvent,
    draggedItem: T | undefined,
    treeProps: TreeViewProps<T>
  ): boolean {
    if (!this.canDropData(event, draggedItem, treeProps)) {
      return false;
    }
    treeProps.handleDrop?.(this.parent, {
      event,
      draggedItem,
      before: this.before,
    });
    return true;
  }
}

export class TreeViewState<T extends TreeViewItem> extends TypedEmitter<{
  dropLocationChange(location: DropLocation<T> | undefined): void;
}> {
  constructor(treeProps: TreeViewProps<T>) {
    super();
    this.props = treeProps;
  }

  private _dropLocation: DropLocation<T> | undefined = undefined;
  draggedItem: T | undefined = undefined;
  props: TreeViewProps<T>;
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
    return new DropLocation(item, item.children[0], {
      type: "over",
      top: this.getItemDOMTop(item),
      height: this.getItemDOMHeight(item),
    });
  }

  private getDropLocationBetween(
    rows: readonly ItemRow<T>[],
    index: number,
    dropDepth: number
  ): DropLocation<T> {
    if (rows.length === 0) {
      return new DropLocation(this.props.rootItem, undefined, {
        type: "bar",
        top: 0,
        depth: 0,
      });
    }

    if (index === 0) {
      return new DropLocation(
        assertNonNull(rows[0].item.parent),
        rows[0].item,
        {
          type: "bar",
          top: this.getItemDOMTop(rows[0].item),
          depth: rows[0].depth,
        }
      );
    }

    const rowPrev = rows[index - 1];
    const rowNext = index < rows.length ? rows[index] : undefined;

    if (!rowNext || rowNext.depth < rowPrev.depth) {
      if (rowNext && dropDepth <= rowNext.depth) {
        //   Prev
        // ----
        // Next
        return new DropLocation(
          assertNonNull(rowNext.item.parent),
          rowNext.item,
          {
            type: "bar",
            top: this.getItemDOMTop(rowNext.item),
            depth: rowNext.depth,
          }
        );
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

      return new DropLocation(assertNonNull(parent), undefined, {
        type: "bar",
        top: this.getItemDOMBottom(rowPrev.item),
        depth: depth,
      });
    } else {
      //  Prev
      //  ----
      //  Next
      // or
      //  Prev
      //    ----
      //    Next
      //
      return new DropLocation(
        assertNonNull(rowNext.item.parent),
        rowNext.item,
        {
          type: "bar",
          top: this.getItemDOMTop(rowNext.item),
          depth: rowNext.depth,
        }
      );
    }
  }

  getForRow(
    rows: readonly ItemRow<T>[],
    index: number,
    event: React.DragEvent,
    draggedItem: T | undefined
  ): DropLocation<T> | undefined {
    const row = rows[index];
    const item = row.item;

    if (!item.parent) {
      throw new Error("item must have parent");
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const dropPos = (event.clientY - rect.top) / rect.height;
    const dropDepth = this.getDropDepth(event);

    const locationBefore = this.getDropLocationBetween(rows, index, dropDepth);
    const locationOver = this.getDropLocationOver(item);
    const locationAfter = this.getDropLocationBetween(
      rows,
      index + 1,
      dropDepth
    );

    if (!this.props.nonReorderable) {
      if (locationOver.canDropData(event, draggedItem, this.props)) {
        if (
          locationBefore.canDropData(event, draggedItem, this.props) &&
          dropPos < 1 / 4
        ) {
          return locationBefore;
        }
        if (
          locationAfter.canDropData(event, draggedItem, this.props) &&
          3 / 4 < dropPos
        ) {
          return locationAfter;
        }
        return locationOver;
      } else {
        if (
          locationBefore.canDropData(event, draggedItem, this.props) &&
          dropPos < 1 / 2
        ) {
          return locationBefore;
        }
        if (locationAfter.canDropData(event, draggedItem, this.props)) {
          return locationAfter;
        }
      }
    } else {
      const locationOverParent = this.getDropLocationOver(item.parent);
      if (locationOver.canDropData(event, draggedItem, this.props)) {
        return locationOver;
      } else if (
        locationOverParent.canDropData(event, draggedItem, this.props)
      ) {
        return locationOverParent;
      }
    }
  }

  getForBackground(
    rows: readonly ItemRow<T>[],
    e: React.DragEvent<HTMLElement>
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    const top = e.clientY - rect.top;

    if (top <= this.getHeaderBottom()) {
      return new DropLocation(this.props.rootItem, first(rows)?.item, {
        type: "bar",
        top: this.getHeaderBottom(),
        depth: 0,
      });
    }

    return this.getDropLocationBetween(rows, rows.length, this.getDropDepth(e));
  }
}
