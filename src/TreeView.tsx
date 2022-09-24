import styled from "styled-components";
import React, { createRef, useEffect, useState } from "react";
import { TreeViewItem } from "./TreeViewItem";
import { TreeViewProps } from "./props";
import { TreeViewState, ItemRow, DropLocation, getItemRows } from "./state";

const DRAG_MIME = "application/x.react-draggable-tree-drag";

//// TreeRow

function TreeRow<T extends TreeViewItem>({
  state,
  index,
  dragImageRef,
}: {
  state: TreeViewState<T>;
  index: number;
  dragImageRef: React.RefObject<HTMLDivElement>;
}) {
  const { item, depth } = state.rows[index];

  const onDragStart = (e: React.DragEvent<HTMLElement>) => {
    if (!state.props.handleDragStart?.(item, { event: e })) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData(DRAG_MIME, "drag");
    state.draggedItem = item;

    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }
  };
  const onDragEnd = () => {
    state.props.handleDragEnd?.(item);
  };

  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? state.draggedItem
      : undefined;

    state.dropLocation = state.getForRow(index, e, draggedItem);

    if (state.dropLocation) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLElement>) => {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? state.draggedItem
      : undefined;

    state.dropLocation = state.getForRow(index, e, draggedItem);
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    const draggedItem = e.dataTransfer.types.includes(DRAG_MIME)
      ? state.draggedItem
      : undefined;

    const dropLocation = state.getForRow(index, e, draggedItem);
    if (dropLocation?.handleDrop(e, draggedItem, state.props)) {
      e.preventDefault();
      e.stopPropagation();
    }
    state.dropLocation = undefined;
    state.draggedItem = undefined;
  };

  return (
    <div
      ref={(e) => e && state.itemToDOM.set(item, e)}
      //draggable={!currentFocus.isTextInput}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {state.props.renderRow(item, {
        depth,
        indentation: state.indentation,
      })}
    </div>
  );
}

// Background

function Background<T extends TreeViewItem>({
  state,
}: {
  state: TreeViewState<T>;
  onClick?: () => void;
}) {
  const onDragEnter = (e: React.DragEvent<HTMLElement>) => {
    state.dropLocation = state.getForBackground(e);
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragLeave = (e: React.DragEvent<HTMLElement>) => {
    state.dropLocation = undefined;
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    state.dropLocation = state.getForBackground(e);
    if (state.dropLocation.canDropData(e, state.draggedItem, state.props)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    const dropLocation = state.getForBackground(e);
    if (dropLocation.handleDrop(e, state.draggedItem, state.props)) {
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
      onClick={state.props.onBackgroundClick}
    />
  );
}

//// DropIndicator

function DropIndicator<T extends TreeViewItem>({
  state,
}: {
  state: TreeViewState<T>;
}) {
  const [dropLocation, setDropLocation] =
    useState<DropLocation<T> | undefined>();

  useEffect(() => {
    state.addListener("dropLocationChange", setDropLocation);
    return () => {
      state.removeListener("dropLocationChange", setDropLocation);
    };
  }, [state, setDropLocation]);

  const indicator = dropLocation?.indicator;
  if (!indicator) {
    return null;
  }

  if (indicator.type === "bar") {
    const left =
      indicator.depth * state.indentation + state.dropIndicatorOffset;
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
        <state.props.DropBetweenIndicator />
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
        <state.props.DropOverIndicator />
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

  const [state] = useState(() => new TreeViewState(props));
  state.setProps(props);

  return (
    <TreeViewWrap
      className={props.className}
      hidden={props.hidden}
      style={props.style}
      onMouseMove={() => {
        state.dropLocation = undefined;
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
      <Background state={state} />
      <div
        style={{
          position: "relative",
        }}
      >
        <div ref={(e) => (state.headerDOM = e ?? undefined)}>
          {props.header}
        </div>
        {state.rows.map((row, i) => (
          <TreeRow
            key={row.item.key}
            state={state}
            index={i}
            dragImageRef={dragImageRef}
          />
        ))}
        {props.footer}
      </div>
      <DropIndicator state={state} />
    </TreeViewWrap>
  );
}
