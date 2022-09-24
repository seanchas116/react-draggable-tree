import styled from "styled-components";
import React, { createRef, useEffect, useState } from "react";
import { TreeViewItem } from "./TreeViewItem";
import { TreeViewProps } from "./props";
import { TreeViewState, DropLocation } from "./state";

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
  return (
    <div
      ref={(e) => e && state.itemToDOM.set(item, e)}
      //draggable={!currentFocus.isTextInput}
      draggable
      onDragStart={state.onRowDragStart.bind(state, index)}
      onDragEnd={state.onRowDragEnd.bind(state, index)}
      onDragEnter={state.onRowDragEnter.bind(state, index)}
      onDrop={state.onRowDrop.bind(state, index)}
      onDragOver={state.onRowDragOver.bind(state, index)}
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
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      }}
      onDragEnter={state.onBackgroundDragEnter.bind(state)}
      onDragLeave={state.onBackgroundDragLeave.bind(state)}
      onDragOver={state.onBackgroundDragOver.bind(state)}
      onDrop={state.onBackgroundDrop.bind(state)}
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
