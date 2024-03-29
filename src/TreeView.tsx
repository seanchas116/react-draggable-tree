import React, { createRef, useEffect, useState } from "react";
import { TreeViewItem } from "./TreeViewItem";
import { TreeViewProps } from "./TreeViewProps";
import { TreeViewState, DropLocation } from "./TreeViewState";

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
      {state.props.renderRow({
        rows: state.rows,
        index: index,
        item,
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
        inset: 0,
        zIndex: "-1",
      }}
      onDragEnter={state.onBackgroundDragEnter.bind(state)}
      onDragLeave={state.onBackgroundDragLeave.bind(state)}
      onDragOver={state.onBackgroundDragOver.bind(state)}
      onDrop={state.onBackgroundDrop.bind(state)}
    >
      {state.props.background}
    </div>
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

  const indicator = dropLocation?.indication;
  if (!indicator) {
    return null;
  }

  if (indicator.type === "between") {
    return state.props.dropBetweenIndicator({
      top: indicator.top,
      left: indicator.depth * state.indentation + state.dropIndicatorOffset,
    });
  } else {
    return state.props.dropOverIndicator({
      top: indicator.top,
      height: indicator.height,
    });
  }
}

//// TreeView

export function TreeView<T extends TreeViewItem>(
  props: TreeViewProps<T>
): JSX.Element | null {
  const dragImageRef = createRef<HTMLDivElement>();

  const [state] = useState(() => new TreeViewState(props));
  state.setProps(props);

  return (
    <div
      className={props.className}
      hidden={props.hidden}
      style={{
        display: "flex",
        flexDirection: "column",
        ...props.style,
      }}
      onMouseMove={() => {
        state.dropLocation = undefined;
      }}
    >
      <div
        style={{
          flex: "1",
          position: "relative",
          zIndex: "0",
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
        <DropIndicator state={state} />
      </div>
    </div>
  );
}
