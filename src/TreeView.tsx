import styled from "styled-components";
import React, { createRef, useEffect, useState } from "react";
import { TypedEmitter } from "tiny-typed-emitter";
import { EmptyTreeViewItem, TreeViewItem } from "./TreeViewItem";

function assertNonNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error("Unexpected null value");
  }
  return value;
}

function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}

//// ItemRow

interface ItemRow {
  item: TreeViewItem;
  depth: number;
}

function getItemRows(item: TreeViewItem, depth: number): ItemRow[] {
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

class DropLocation {
  constructor(
    parent: TreeViewItem,
    before: TreeViewItem | undefined,
    indicator: DropIndicator
  ) {
    this.parent = parent;
    this.before = before;
    this.indicator = indicator;
  }

  readonly parent: TreeViewItem;
  readonly before: TreeViewItem | undefined;
  readonly indicator: DropIndicator;

  canDropData(
    event: React.DragEvent,
    draggedItem: TreeViewItem | undefined
  ): boolean {
    return (
      this.parent.canDropData?.({
        event,
        draggedItem,
      }) ?? false
    );
  }

  handleDrop(
    event: React.DragEvent,
    draggedItem: TreeViewItem | undefined
  ): boolean {
    if (!this.canDropData(event, draggedItem)) {
      return false;
    }
    this.parent.handleDrop?.({ event, draggedItem, before: this.before });
    return true;
  }
}

class DragState extends TypedEmitter<{
  dropLocationChange(location: DropLocation | undefined): void;
  draggedItemChange(item: TreeViewItem | undefined): void;
}> {
  private _dropLocation: DropLocation | undefined = undefined;
  private _draggedItem: TreeViewItem | undefined = undefined;

  get dropLocation(): DropLocation | undefined {
    return this._dropLocation;
  }

  set dropLocation(dropLocation: DropLocation | undefined) {
    if (this._dropLocation === dropLocation) {
      return;
    }
    this._dropLocation = dropLocation;
    this.emit("dropLocationChange", dropLocation);
  }

  get draggedItem(): TreeViewItem | undefined {
    return this._draggedItem;
  }

  set draggedItem(draggedItem: TreeViewItem | undefined) {
    if (this._draggedItem === draggedItem) {
      return;
    }
    this._draggedItem = draggedItem;
    this.emit("draggedItemChange", draggedItem);
  }
}

class DropLocationSolver {
  constructor(rootItem: TreeViewItem) {
    this.rootItem = rootItem;
  }

  rootItem: TreeViewItem;
  reorderable = false;
  indentation = 0;
  dropIndicatorOffset = 0;
  readonly itemToDOM = new WeakMap<TreeViewItem, HTMLElement>();
  headerDOM: HTMLElement | undefined;

  private getHeaderBottom(): number {
    if (!this.headerDOM) {
      return 0;
    }
    return this.headerDOM.offsetTop + this.headerDOM.offsetHeight;
  }

  private getItemDOMTop(item: TreeViewItem): number {
    return this.itemToDOM.get(item)?.offsetTop ?? 0;
  }
  private getItemDOMHeight(item: TreeViewItem): number {
    return this.itemToDOM.get(item)?.offsetHeight ?? 0;
  }
  private getItemDOMBottom(item: TreeViewItem): number {
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

  private getDropLocationOver(item: TreeViewItem): DropLocation {
    return new DropLocation(item, item.children[0], {
      type: "over",
      top: this.getItemDOMTop(item),
      height: this.getItemDOMHeight(item),
    });
  }

  private getDropLocationBetween(
    rows: readonly ItemRow[],
    index: number,
    dropDepth: number
  ): DropLocation {
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

  getForBackground(rows: readonly ItemRow[], e: React.DragEvent<HTMLElement>) {
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

  getForRow(
    rows: readonly ItemRow[],
    index: number,
    event: React.DragEvent,
    draggedItem: TreeViewItem | undefined
  ): DropLocation | undefined {
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
      if (locationOver.canDropData(event, draggedItem)) {
        if (locationBefore.canDropData(event, draggedItem) && dropPos < 1 / 4) {
          return locationBefore;
        }
        if (locationAfter.canDropData(event, draggedItem) && 3 / 4 < dropPos) {
          return locationAfter;
        }
        return locationOver;
      } else {
        if (locationBefore.canDropData(event, draggedItem) && dropPos < 1 / 2) {
          return locationBefore;
        }
        if (locationAfter.canDropData(event, draggedItem)) {
          return locationAfter;
        }
      }
    } else {
      const locationOverParent = this.getDropLocationOver(item.parent);
      if (locationOver.canDropData(event, draggedItem)) {
        return locationOver;
      } else if (locationOverParent.canDropData(event, draggedItem)) {
        return locationOverParent;
      }
    }
  }
}

//// TreeRow

function TreeRow({
  indentation,
  dropLocationSolver,
  dragState,
  rows,
  index,
  dragImageRef,
}: {
  indentation: number;
  dropLocationSolver: DropLocationSolver;
  dragState: DragState;
  rows: ItemRow[];
  index: number;
  dragImageRef: React.RefObject<HTMLDivElement>;
}) {
  const { item, depth } = rows[index];

  const onDragStart = (e: React.DragEvent<HTMLElement>) => {
    item.handleDragStart?.({ event: e });
    dragState.draggedItem = item;

    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }
  };
  const onDragEnd = () => {
    item.handleDragEnd?.();
  };

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    dragState.dropLocation = dropLocationSolver.getForRow(
      rows,
      index,
      e,
      dragState.draggedItem
    );
    if (dragState.dropLocation) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLElement>) => {
    dragState.dropLocation = dropLocationSolver.getForRow(
      rows,
      index,
      e,
      dragState.draggedItem
    );
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    const dropLocation = dropLocationSolver.getForRow(
      rows,
      index,
      e,
      dragState.draggedItem
    );
    if (dropLocation?.handleDrop(e, dragState.draggedItem)) {
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
      {item.renderRow({
        depth,
        indentation,
      })}
    </div>
  );
}

// Background

function Background({
  dropLocationSolver,
  dragState,
  rows,
  onClick,
}: {
  dropLocationSolver: DropLocationSolver;
  dragState: DragState;
  rows: ItemRow[];
  onClick?: () => void;
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
    if (dragState.dropLocation.canDropData(e, dragState.draggedItem)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    const dropLocation = dropLocationSolver.getForBackground(rows, e);
    if (dropLocation.handleDrop(e, dragState.draggedItem)) {
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

const DropIndicator: React.FC<{
  indentation: number;
  dropIndicatorOffset: number;
  dragState: DragState;
  DropBetweenIndicator: React.ComponentType;
  DropOverIndicator: React.ComponentType;
}> = ({
  indentation,
  dropIndicatorOffset,
  dragState,
  DropBetweenIndicator,
  DropOverIndicator,
}) => {
  const [dropLocation, setDropLocation] = useState<DropLocation | undefined>();

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
};

//// TreeView

const TreeViewWrap = styled.div`
  position: relative;
`;

export interface TreeViewProps {
  rootItem?: TreeViewItem;

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
}

export function TreeView({
  rootItem = new EmptyTreeViewItem(),
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
}: TreeViewProps): JSX.Element | null {
  const dragImageRef = createRef<HTMLDivElement>();

  const [dropLocationSolver] = useState(() => new DropLocationSolver(rootItem));
  dropLocationSolver.rootItem = rootItem;
  dropLocationSolver.reorderable = reorderable;
  dropLocationSolver.indentation = indentation;
  dropLocationSolver.dropIndicatorOffset = dropIndicatorOffset;

  const [dragState] = useState(() => new DragState());

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
