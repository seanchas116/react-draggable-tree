import { loremIpsum } from "lorem-ipsum";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useState, useSyncExternalStore } from "react";
import styled from "styled-components";
import { TreeView } from "./TreeView";
import { TreeViewItem } from "./TreeViewItem";
import { Node } from "./Node";
import { TypedEmitter } from "tiny-typed-emitter";

const DRAG_MIME = "application/x.macaron-tree-drag";

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
  return node;
}

class Changes extends TypedEmitter<{
  structureChanged(): void;
  nodeChanged(node: Node): void;
}> {}

const changes = new Changes();

class ExampleTreeViewItem implements TreeViewItem {
  constructor(parent: ExampleTreeViewItem | undefined, node: Node) {
    this.key = node.key;
    this.parent = parent;
    this.node = node;
    this.children = node.collapsed
      ? []
      : node.children.map((c) => new ExampleTreeViewItem(this, c));
  }

  readonly key: string;
  readonly parent: ExampleTreeViewItem | undefined;
  readonly node: Node;
  readonly children: ExampleTreeViewItem[] = [];

  handleDragStart({ event }: { event: React.DragEvent }) {
    runInAction(() => {
      if (!this.node.selected) {
        this.node.root.deselect();
        this.node.select();
      }
    });

    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData(DRAG_MIME, "drag");
  }

  canDropData({
    event,
    draggedItem,
  }: {
    event: React.DragEvent;
    draggedItem?: TreeViewItem;
  }) {
    console.log("canDropData", (draggedItem as ExampleTreeViewItem)?.node.name);

    return (
      this.node.type === "branch" &&
      event.dataTransfer.types.includes(DRAG_MIME)
    );
  }

  handleDrop({
    event,
    draggedItem,
    before,
  }: {
    event: React.DragEvent;
    draggedItem?: TreeViewItem;
    before: TreeViewItem | undefined;
  }) {
    console.log("handleDrop", (draggedItem as ExampleTreeViewItem)?.node.name);

    const beforeNode = (before as ExampleTreeViewItem | undefined)?.node;

    for (const node of this.node.root.selectedDescendants) {
      node.insertBefore(this.node, beforeNode);
    }
    changes.emit("structureChanged");
  }

  renderRow({
    depth,
    indentation,
  }: {
    depth: number;
    indentation: number;
  }): React.ReactNode {
    return <TreeRow node={this.node} depth={depth} indentation={indentation} />;
  }
}

const TreeRow: React.FC<{
  node: Node;
  depth: number;
  indentation: number;
}> = observer(({ node, depth, indentation }) => {
  const onCollapseButtonClick = action((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    node.collapsed = !node.collapsed;
    changes.emit("nodeChanged", node);
  });

  const onClick = action((event: React.MouseEvent<HTMLElement>) => {
    // TODO: shift + click

    if (!(event.metaKey || event.shiftKey)) {
      node.root.deselect();
    }
    node.select();
    changes.emit("nodeChanged", node);
  });

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
});

export default {
  component: TreeView,
};

const Wrap = styled.div`
  width: 240px;
  height: 80vh;
  overflow-y: auto;
  font-size: 16px;
`;

const StyledTreeView = styled(TreeView)`
  min-height: 100%;
`;

const renderIndicators = {
  DropBetweenIndicator: () => {
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
  },
  DropOverIndicator: () => {
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
  },
};

const BasicObserver: React.FC = observer(() => {
  const [root] = useState(() => generateExampleNode(4, 3, 5));
  const item = new ExampleTreeViewItem(undefined, root);

  return (
    <Wrap>
      <StyledTreeView
        rootItem={item}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        {...renderIndicators}
      />
    </Wrap>
  );
});

export const Basic: React.VFC = () => {
  return <BasicObserver />;
};

const ManyItemsObserver: React.VFC = observer(() => {
  const [root] = useState(() => generateExampleNode(5, 5, 5));
  const item = new ExampleTreeViewItem(undefined, root);

  return (
    <Wrap>
      <StyledTreeView
        rootItem={item}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        {...renderIndicators}
      />
    </Wrap>
  );
});

export const ManyItems: React.VFC = () => {
  return <ManyItemsObserver />;
};

const NonReorderableObserver: React.VFC = observer(() => {
  const [root] = useState(() => generateExampleNode(4, 3, 4));
  const item = new ExampleTreeViewItem(undefined, root);

  return (
    <Wrap>
      <StyledTreeView
        rootItem={item}
        reorderable={false}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        {...renderIndicators}
      />
    </Wrap>
  );
});

export const NonReorderable: React.VFC = () => {
  return <NonReorderableObserver />;
};
