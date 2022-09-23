import styled from "styled-components";
import React, { createRef, useEffect, useState } from "react";
import { TypedEmitter } from "tiny-typed-emitter";
import { TreeViewItem } from "./TreeViewItem";

function assertNonNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error("Unexpected null value");
  }
  return value;
}

function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}

const DRAG_MIME = "application/x.react-draggable-tree-drag";

//// ItemRow

interface ItemRow<T extends TreeViewItem> {
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

type DropIndicator =
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

class DropLocation<T extends TreeViewItem> {
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
    canDropData: TreeViewProps<T>["canDropData"]
  ): boolean {
    return (
      canDropData?.(this.parent, {
        event,
        draggedItem,
      }) ?? false
    );
  }

  handleDrop(
    event: React.DragEvent,
    draggedItem: T | undefined,
    canDropData: TreeViewProps<T>["canDropData"],
    handleDrop: TreeViewProps<T>["handleDrop"]
  ): boolean {
    if (!this.canDropData(event, draggedItem, canDropData)) {
      return false;
    }
    handleDrop?.(this.parent, { event, draggedItem, before: this.before });
    return true;
  }
}

class DragState<T extends TreeViewItem> extends TypedEmitter<{
  dropLocationChange(location: DropLocation<T> | undefined): void;
  draggedItemChange(item: T | undefined): void;
}> {
  private _dropLocation: DropLocation<T> | undefined = undefined;
  private _draggedItem: T | undefined = undefined;

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

  get draggedItem(): T | undefined {
    return this._draggedItem;
  }

  set draggedItem(draggedItem: T | undefined) {
    if (this._draggedItem === draggedItem) {
      return;
    }
    this._draggedItem = draggedItem;
    this.emit("draggedItemChange", draggedItem);
  }
}

class DropLocationSolver<T extends TreeViewItem> {
  constructor(rootItem: T) {
    this.rootItem = rootItem;
  }

  rootItem: T;
  reorderable = false;
  indentation = 0;
  dropIndicatorOffset = 0;
  readonly itemToDOM = new WeakMap<T, HTMLElement>();
  headerDOM: HTMLElement | undefined;

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
      return new DropLocation(this.rootItem, undefined, {
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
    draggedItem: T | undefined,
    canDropData: TreeViewProps<T>["canDropData"]
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

    if (this.reorderable) {
      if (locationOver.canDropData(event, draggedItem, canDropData)) {
        if (
          locationBefore.canDropData(event, draggedItem, canDropData) &&
          dropPos < 1 / 4
        ) {
          return locationBefore;
        }
        if (
          locationAfter.canDropData(event, draggedItem, canDropData) &&
          3 / 4 < dropPos
        ) {
          return locationAfter;
        }
        return locationOver;
      } else {
        if (
          locationBefore.canDropData(event, draggedItem, canDropData) &&
          dropPos < 1 / 2
        ) {
          return locationBefore;
        }
        if (locationAfter.canDropData(event, draggedItem, canDropData)) {
          return locationAfter;
        }
      }
    } else {
      const locationOverParent = this.getDropLocationOver(item.parent);
      if (locationOver.canDropData(event, draggedItem, canDropData)) {
        return locationOver;
      } else if (
        locationOverParent.canDropData(event, draggedItem, canDropData)
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
      return new DropLocation(this.rootItem, first(rows)?.item, {
        type: "bar",
        top: this.getHeaderBottom(),
        depth: 0,
      });
    }

    return this.getDropLocationBetween(rows, rows.length, this.getDropDepth(e));
  }
}

//// TreeRow

function TreeRow<T extends TreeViewItem>({
  indentation,
  dropLocationSolver,
  dragState,
  rows,
  index,
  dragImageRef,
  renderRow,
  handleDragStart,
  handleDragEnd,
  canDropData,
  handleDrop,
}: {
  indentation: number;
  dropLocationSolver: DropLocationSolver<T>;
  dragState: DragState<T>;
  rows: ItemRow<T>[];
  index: number;
  dragImageRef: React.RefObject<HTMLDivElement>;
  renderRow: TreeViewProps<T>["renderRow"];
  handleDragStart: TreeViewProps<T>["handleDragStart"];
  handleDragEnd: TreeViewProps<T>["handleDragEnd"];
  canDropData: TreeViewProps<T>["canDropData"];
  handleDrop: TreeViewProps<T>["handleDrop"];
}) {
  const { item, depth } = rows[index];

  const onDragStart = (e: React.DragEvent<HTMLElement>) => {
    if (!handleDragStart?.(item, { event: e })) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData(DRAG_MIME, "drag");
    dragState.draggedItem = item;

    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }
  };
  const onDragEnd = () => {
    handleDragEnd?.(item);
  };

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? dragState.draggedItem
      : undefined;

    dragState.dropLocation = dropLocationSolver.getForRow(
      rows,
      index,
      e,
      draggedItem,
      canDropData
    );

    if (dragState.dropLocation) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLElement>) => {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? dragState.draggedItem
      : undefined;

    dragState.dropLocation = dropLocationSolver.getForRow(
      rows,
      index,
      e,
      draggedItem,
      canDropData
    );
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? dragState.draggedItem
      : undefined;

    const dropLocation = dropLocationSolver.getForRow(
      rows,
      index,
      e,
      draggedItem,
      canDropData
    );
    if (dropLocation?.handleDrop(e, draggedItem, canDropData, handleDrop)) {
      e.preventDefault();
      e.stopPropagation();
    }
    dragState.dropLocation = undefined;
    dragState.draggedItem = undefined;
  };

  return (
    <div
      ref={(e) => e && dropLocationSolver.itemToDOM.set(item, e)}
      //draggable={!currentFocus.isTextInput}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {renderRow(item, {
        depth,
        indentation,
      })}
    </div>
  );
}

// Background

function Background<T extends TreeViewItem>({
  dropLocationSolver,
  dragState,
  rows,
  onClick,
  canDropData,
  handleDrop,
}: {
  dropLocationSolver: DropLocationSolver<T>;
  dragState: DragState<T>;
  rows: ItemRow<T>[];
  onClick?: () => void;
  canDropData: TreeViewProps<T>["canDropData"];
  handleDrop: TreeViewProps<T>["handleDrop"];
}) {
  const onDragEnter = (e: React.DragEvent<HTMLElement>) => {
    dragState.dropLocation = dropLocationSolver.getForBackground(rows, e);
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragLeave = (e: React.DragEvent<HTMLElement>) => {
    dragState.dropLocation = undefined;
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    dragState.dropLocation = dropLocationSolver.getForBackground(rows, e);
    if (
      dragState.dropLocation.canDropData(e, dragState.draggedItem, canDropData)
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    const dropLocation = dropLocationSolver.getForBackground(rows, e);
    if (
      dropLocation.handleDrop(e, dragState.draggedItem, canDropData, handleDrop)
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      }}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    />
  );
}

//// DropIndicator

function DropIndicator<T extends TreeViewItem>({
  indentation,
  dropIndicatorOffset,
  dragState,
  DropBetweenIndicator,
  DropOverIndicator,
}: {
  indentation: number;
  dropIndicatorOffset: number;
  dragState: DragState<T>;
  DropBetweenIndicator: React.ComponentType;
  DropOverIndicator: React.ComponentType;
}) {
  const [dropLocation, setDropLocation] =
    useState<DropLocation<T> | undefined>();

  useEffect(() => {
    dragState.addListener("dropLocationChange", setDropLocation);
    return () => {
      dragState.removeListener("dropLocationChange", setDropLocation);
    };
  }, [dragState, setDropLocation]);

  const indicator = dropLocation?.indicator;
  if (!indicator) {
    return null;
  }

  if (indicator.type === "bar") {
    const left = indicator.depth * indentation + dropIndicatorOffset;
    return (
      <div
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 50,
          left: `${left}px`,
          right: "0",
          top: `${indicator.top}px`,
        }}
      >
        <DropBetweenIndicator />
      </div>
    );
  } else {
    return (
      <div
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 50,
          top: `${indicator.top}px`,
          left: 0,
          right: 0,
          height: `${indicator.height}px`,
        }}
      >
        <DropOverIndicator />
      </div>
    );
  }
}

//// TreeView

const TreeViewWrap = styled.div`
  position: relative;
`;

export interface TreeViewProps<T extends TreeViewItem> {
  rootItem: T;

  header?: React.ReactNode;
  footer?: React.ReactNode;
  indentation?: number;
  dropIndicatorOffset?: number;
  reorderable?: boolean;
  DropBetweenIndicator: React.ComponentType;
  DropOverIndicator: React.ComponentType;
  className?: string;
  hidden?: boolean;
  style?: React.CSSProperties;

  onBackgroundClick?: () => void;

  renderRow: (
    item: T,
    params: { depth: number; indentation: number }
  ) => JSX.Element;

  handleDragStart: (item: T, params: { event: React.DragEvent }) => boolean;
  handleDragEnd?: (item: T) => void;
  canDropData?: (
    item: T,
    params: {
      event: React.DragEvent;
      draggedItem: T | undefined; // undefined if the drag is not initiated from a tree view
    }
  ) => boolean;
  handleDrop?: (
    item: T,
    params: {
      event: React.DragEvent;
      draggedItem: T | undefined; // undefined if the drag is not initiated from a tree view
      before: T | undefined;
    }
  ) => void;
}

export function TreeView<T extends TreeViewItem>({
  rootItem,
  header,
  footer,
  reorderable = true,
  indentation = 16,
  dropIndicatorOffset = 0,
  DropBetweenIndicator,
  DropOverIndicator,
  className,
  hidden,
  style,
  onBackgroundClick,
  renderRow,
  handleDragStart,
  handleDragEnd,
  canDropData,
  handleDrop,
}: TreeViewProps<T>): JSX.Element | null {
  const dragImageRef = createRef<HTMLDivElement>();

  const [dropLocationSolver] = useState(() => new DropLocationSolver(rootItem));
  dropLocationSolver.rootItem = rootItem;
  dropLocationSolver.reorderable = reorderable;
  dropLocationSolver.indentation = indentation;
  dropLocationSolver.dropIndicatorOffset = dropIndicatorOffset;

  const [dragState] = useState(() => new DragState<T>());

  const itemRows = rootItem.children.flatMap((item) => getItemRows(item, 0));

  return (
    <TreeViewWrap
      className={className}
      hidden={hidden}
      style={style}
      onMouseMove={() => {
        dragState.dropLocation = undefined;
      }}
    >
      <div
        style={{
          position: "fixed",
          left: "-10000px",
          top: "-10000px",
          width: "1px",
          height: "1px",
          visibility: "hidden",
        }}
        ref={dragImageRef}
      />
      <Background
        dropLocationSolver={dropLocationSolver}
        dragState={dragState}
        rows={itemRows}
        onClick={onBackgroundClick}
        canDropData={canDropData}
        handleDrop={handleDrop}
      />
      <div
        style={{
          position: "relative",
        }}
      >
        <div ref={(e) => (dropLocationSolver.headerDOM = e ?? undefined)}>
          {header}
        </div>
        {itemRows.map((row, i) => (
          <TreeRow
            key={row.item.key}
            indentation={indentation}
            dropLocationSolver={dropLocationSolver}
            dragState={dragState}
            rows={itemRows}
            index={i}
            dragImageRef={dragImageRef}
            renderRow={renderRow}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            canDropData={canDropData}
            handleDrop={handleDrop}
          />
        ))}
        {footer}
      </div>
      <DropIndicator
        indentation={indentation}
        dropIndicatorOffset={dropIndicatorOffset}
        dragState={dragState}
        DropBetweenIndicator={DropBetweenIndicator}
        DropOverIndicator={DropOverIndicator}
      />
    </TreeViewWrap>
  );
}
