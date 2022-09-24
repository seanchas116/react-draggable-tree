import { loremIpsum } from "lorem-ipsum";
import React, { useState } from "react";
import styled from "styled-components";
import { TreeView, TreeViewItem } from "../lib";
import { Node } from "./Node";

function generateExampleNode(
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
      children.push(
        generateExampleNode(depth - 1, minChildCount, maxChildCount)
      );
    }
  }

  const node = new Node();
  node.name = text;
  node.append(...children);
  node.type = hasChild ? "branch" : "leaf";
  return node;
}

interface ExampleTreeViewItem extends TreeViewItem {
  readonly node: Node;
}

function createExampleTreeViewItem(
  node: Node,
  parent?: ExampleTreeViewItem
): ExampleTreeViewItem {
  const item: ExampleTreeViewItem = {
    key: node.key,
    parent,
    children: [],
    node,
  };
  if (!node.collapsed) {
    item.children = node.children.map((child) =>
      createExampleTreeViewItem(child, item)
    );
  }
  return item;
}

const TreeRow: React.FC<{
  node: Node;
  depth: number;
  indentation: number;
  onChange: () => void;
}> = ({ node, depth, indentation, onChange }) => {
  const onCollapseButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    node.collapsed = !node.collapsed;
    onChange();
  };

  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    // TODO: shift + click

    if (!(event.metaKey || event.shiftKey)) {
      node.root.deselect();
    }
    node.select();
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

const DropBetweenIndicator: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        left: "0",
        right: "0",
        top: "-1px",
        bottom: "-1px",
        background: "red",
      }}
    />
  );
};

const DropOverIndicator: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        left: "0",
        right: "0",
        top: "0",
        bottom: "0",
        border: "1px solid red",
      }}
    />
  );
};

export const Basic: React.FC = () => {
  const [root] = useState(() => generateExampleNode(5, 3, 5));
  const [item, setItem] = useState(() => createExampleTreeViewItem(root));
  const update = () => {
    setItem(createExampleTreeViewItem(root));
  };

  return (
    <Wrap>
      <StyledTreeView
        rootItem={item}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        renderDropBetweenIndicator={() => <DropBetweenIndicator />}
        renderDropOverIndicator={() => <DropOverIndicator />}
        handleDragStart={(item) => {
          if (!item.node.selected) {
            item.node.root.deselect();
            item.node.select();
            update();
          }
          return true;
        }}
        canDropData={(item, { draggedItem }) => {
          return !!draggedItem && item.node.type === "branch";
        }}
        handleDrop={(item, { draggedItem, before }) => {
          if (draggedItem) {
            for (const node of item.node.root.selectedDescendants) {
              item.node.insertBefore(node, before?.node);
            }
            update();
          }
        }}
        renderRow={(item, { depth, indentation }) => (
          <TreeRow
            node={item.node}
            depth={depth}
            indentation={indentation}
            onChange={update}
          />
        )}
      />
    </Wrap>
  );
};

export const NonReorderable: React.FC = () => {
  const [root] = useState(() => generateExampleNode(5, 3, 5));
  const [item, setItem] = useState(() => createExampleTreeViewItem(root));
  const update = () => {
    setItem(createExampleTreeViewItem(root));
  };

  return (
    <Wrap>
      <StyledTreeView
        nonReorderable
        rootItem={item}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        renderDropBetweenIndicator={() => <DropBetweenIndicator />}
        renderDropOverIndicator={() => <DropOverIndicator />}
        handleDragStart={(item) => {
          if (!item.node.selected) {
            item.node.root.deselect();
            item.node.select();
            update();
          }
          return true;
        }}
        canDropData={(item, { draggedItem }) => {
          return !!draggedItem && item.node.type === "branch";
        }}
        handleDrop={(item, { draggedItem, before }) => {
          if (draggedItem) {
            for (const node of item.node.root.selectedDescendants) {
              item.node.insertBefore(node, before?.node);
            }
            update();
          }
        }}
        renderRow={(item, { depth, indentation }) => (
          <TreeRow
            node={item.node}
            depth={depth}
            indentation={indentation}
            onChange={update}
          />
        )}
      />
    </Wrap>
  );
};
