import styled from "styled-components";
import React, { createRef, useEffect, useState } from "react";
import { TreeViewItem } from "./TreeViewItem";
import { defaultIndentation, defaultDropIndicatorOffset } from "./constants";
import { TreeViewProps } from "./props";
import {
  DropLocationSolver,
  DragState,
  ItemRow,
  DropLocation,
  getItemRows,
} from "./state";

const DRAG_MIME = "application/x.react-draggable-tree-drag";

//// TreeRow

function TreeRow<T extends TreeViewItem>({
  treeProps,
  dropLocationSolver,
  dragState,
  rows,
  index,
  dragImageRef,
}: {
  treeProps: TreeViewProps<T>;
  dropLocationSolver: DropLocationSolver<T>;
  dragState: DragState<T>;
  rows: ItemRow<T>[];
  index: number;
  dragImageRef: React.RefObject<HTMLDivElement>;
}) {
  const { item, depth } = rows[index];

  const onDragStart = (e: React.DragEvent<HTMLElement>) => {
    if (!treeProps.handleDragStart?.(item, { event: e })) {
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
    treeProps.handleDragEnd?.(item);
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
      treeProps
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
      treeProps
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
      treeProps
    );
    if (dropLocation?.handleDrop(e, draggedItem, treeProps)) {
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
      {treeProps.renderRow(item, {
        depth,
        indentation: treeProps.indentation ?? defaultIndentation,
      })}
    </div>
  );
}

// Background

function Background<T extends TreeViewItem>({
  dropLocationSolver,
  dragState,
  rows,
  treeProps,
}: {
  dropLocationSolver: DropLocationSolver<T>;
  dragState: DragState<T>;
  rows: ItemRow<T>[];
  onClick?: () => void;
  treeProps: TreeViewProps<T>;
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
      dragState.dropLocation.canDropData(e, dragState.draggedItem, treeProps)
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    const dropLocation = dropLocationSolver.getForBackground(rows, e);
    if (dropLocation.handleDrop(e, dragState.draggedItem, treeProps)) {
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
      onClick={treeProps.onBackgroundClick}
    />
  );
}

//// DropIndicator

function DropIndicator<T extends TreeViewItem>({
  treeProps,
  dragState,
}: {
  treeProps: TreeViewProps<T>;
  dragState: DragState<T>;
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

  const indentation = treeProps.indentation ?? defaultIndentation;
  const dropIndicatorOffset =
    treeProps.dropIndicatorOffset ?? defaultDropIndicatorOffset;

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
        <treeProps.DropBetweenIndicator />
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
        <treeProps.DropOverIndicator />
      </div>
    );
  }
}

//// TreeView

const TreeViewWrap = styled.div`
  position: relative;
`;

export function TreeView<T extends TreeViewItem>(
  props: TreeViewProps<T>
): JSX.Element | null {
  const dragImageRef = createRef<HTMLDivElement>();

  const [dropLocationSolver] = useState(() => new DropLocationSolver(props));
  dropLocationSolver.treeProps = props;

  const [dragState] = useState(() => new DragState<T>());

  const itemRows = props.rootItem.children.flatMap((item) =>
    getItemRows(item, 0)
  );

  return (
    <TreeViewWrap
      className={props.className}
      hidden={props.hidden}
      style={props.style}
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
        treeProps={props}
        rows={itemRows}
      />
      <div
        style={{
          position: "relative",
        }}
      >
        <div ref={(e) => (dropLocationSolver.headerDOM = e ?? undefined)}>
          {props.header}
        </div>
        {itemRows.map((row, i) => (
          <TreeRow
            key={row.item.key}
            treeProps={props}
            dropLocationSolver={dropLocationSolver}
            dragState={dragState}
            rows={itemRows}
            index={i}
            dragImageRef={dragImageRef}
          />
        ))}
        {props.footer}
      </div>
      <DropIndicator dragState={dragState} treeProps={props} />
    </TreeViewWrap>
  );
}
