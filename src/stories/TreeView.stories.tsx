import { loremIpsum } from "lorem-ipsum";
import React, { useState } from "react";
import styled from "styled-components";
import { TreeView, TreeViewItem } from "../react-draggable-tree";
import { ItemRow } from "../TreeViewState";
import { Node } from "./Node";

function generateNode(
  depth: number,
  minChildCount: number,
  maxChildCount: number
): Node {
  const text: string = loremIpsum({
    sentenceLowerBound: 2,
    sentenceUpperBound: 4,
  });
  const hasChild = depth > 1;
  let children: Node[] = [];
  if (hasChild) {
    children = [];
    const childCount = Math.round(
      Math.random() * (maxChildCount - minChildCount) + minChildCount
    );
    for (let i = 0; i < childCount; ++i) {
      children.push(generateNode(depth - 1, minChildCount, maxChildCount));
    }
  }

  const node = new Node();
  node.name = text;
  node.append(...children);
  node.type = hasChild ? "branch" : "leaf";
  return node;
}

interface NodeTreeViewItem extends TreeViewItem {
  readonly node: Node;
}

function createItem(node: Node, parent?: NodeTreeViewItem): NodeTreeViewItem {
  const item: NodeTreeViewItem = {
    key: node.key,
    parent,
    children: [],
    node,
  };
  if (!node.collapsed) {
    item.children = node.children.map((child) => createItem(child, item));
  }
  return item;
}

const TreeRow: React.FC<{
  rows: readonly ItemRow<NodeTreeViewItem>[];
  index: number;
  item: NodeTreeViewItem;
  depth: number;
  indentation: number;
  onChange: () => void;
}> = ({ rows, index, item, depth, indentation, onChange }) => {
  const node = item.node;

  const onCollapseButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    node.collapsed = !node.collapsed;
    onChange();
  };

  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.metaKey) {
      console.log("metaKey");
      if (node.selected) {
        node.deselect();
      } else {
        node.select();
      }
    } else if (event.shiftKey) {
      let minSelectedIndex = index;
      let maxSelectedIndex = index;

      for (const [i, row] of rows.entries()) {
        if (row.item.node.selected) {
          minSelectedIndex = Math.min(minSelectedIndex, i);
          maxSelectedIndex = Math.max(maxSelectedIndex, i);
        }
      }

      for (let i = minSelectedIndex; i <= maxSelectedIndex; ++i) {
        rows[i].item.node.select();
      }
    } else {
      node.root.deselect();
      node.select();
    }

    onChange();
  };

  return (
    <div
      onClick={onClick}
      style={{
        paddingLeft: depth * indentation,
        color: "white",
        background: node.selected
          ? "blue"
          : node.ancestorSelected
          ? "#008"
          : "black",
      }}
    >
      {node.firstChild !== undefined && (
        <span onClick={onCollapseButtonClick}>
          {node.collapsed ? "[+]" : "[-]"}
        </span>
      )}
      {node.name}
    </div>
  );
};

export default {
  component: TreeView,
};

const Wrap = styled.div`
  width: 240px;
  height: 80vh;
  overflow-y: auto;
  font-size: 16px;
`;

const StyledTreeView: typeof TreeView = styled(TreeView)`
  min-height: 100%;
`;

export const Basic: React.FC = () => {
  const [root] = useState(() => generateNode(5, 3, 5));
  const [item, setItem] = useState(() => createItem(root));
  const update = () => {
    setItem(createItem(root));
  };

  return (
    <Wrap>
      <StyledTreeView
        rootItem={item}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        dropBetweenIndicator={({ top, left }) => (
          <div
            style={{
              position: "absolute",
              pointerEvents: "none",
              left: `${left}px`,
              right: "0",
              top: `${top}px`,
              height: "2px",
              background: "red",
            }}
          />
        )}
        dropOverIndicator={({ top, height }) => (
          <div
            style={{
              position: "absolute",
              pointerEvents: "none",
              top: `${top}px`,
              left: 0,
              right: 0,
              height: `${height}px`,
              boxSizing: "border-box",
              border: "1px solid red",
            }}
          />
        )}
        handleDragStart={({ item }) => {
          if (!item.node.selected) {
            item.node.root.deselect();
            item.node.select();
            update();
          }
          return true;
        }}
        canDrop={({ item, draggedItem }) => {
          return !!draggedItem && item.node.type === "branch";
        }}
        handleDrop={({ item, draggedItem, before }) => {
          if (draggedItem) {
            for (const node of item.node.root.selectedDescendants) {
              item.node.insertBefore(node, before?.node);
            }
            update();
          }
        }}
        renderRow={(props) => <TreeRow {...props} onChange={update} />}
      />
    </Wrap>
  );
};

export const NonReorderable: React.FC = () => {
  const [root] = useState(() => generateNode(5, 3, 5));
  const [item, setItem] = useState(() => createItem(root));
  const update = () => {
    setItem(createItem(root));
  };

  return (
    <Wrap>
      <StyledTreeView
        nonReorderable
        rootItem={item}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        dropBetweenIndicator={({ top, left }) => (
          <div
            style={{
              position: "absolute",
              pointerEvents: "none",
              left: `${left}px`,
              right: "0",
              top: `${top}px`,
              height: "2px",
              background: "red",
            }}
          />
        )}
        dropOverIndicator={({ top, height }) => (
          <div
            style={{
              position: "absolute",
              pointerEvents: "none",
              top: `${top}px`,
              left: 0,
              right: 0,
              height: `${height}px`,
              boxSizing: "border-box",
              border: "1px solid red",
            }}
          />
        )}
        handleDragStart={({ item }) => {
          if (!item.node.selected) {
            item.node.root.deselect();
            item.node.select();
            update();
          }
          return true;
        }}
        canDrop={({ item, draggedItem }) => {
          return !!draggedItem && item.node.type === "branch";
        }}
        handleDrop={({ item, draggedItem, before }) => {
          if (draggedItem) {
            for (const node of item.node.root.selectedDescendants) {
              item.node.insertBefore(node, before?.node);
            }
            update();
          }
        }}
        renderRow={(props) => <TreeRow {...props} onChange={update} />}
      />
    </Wrap>
  );
};
