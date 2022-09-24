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

export interface ExampleTreeViewItem extends TreeViewItem {
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

/*
class ExampleTreeViewItem implements TreeViewItem {
  constructor(
    changes: Changes,
    parent: ExampleTreeViewItem | undefined,
    node: Node
  ) {
    this.key = node.key;
    this.changes = changes;
    this.parent = parent;
    this.node = node;
    this.children = node.collapsed
      ? []
      : node.children.map((c) => new ExampleTreeViewItem(changes, this, c));
  }

  readonly key: string;
  readonly changes: Changes;
  readonly parent: ExampleTreeViewItem | undefined;
  readonly node: Node;
  readonly children: ExampleTreeViewItem[] = [];

  handleDragStart({ event }: { event: React.DragEvent }) {
    if (!this.node.selected) {
      this.node.root.deselect();
      this.node.select();
      this.changes.emit("change");
    }

    return true;
  }

  canDropData({
    event,
    draggedItem,
  }: {
    event: React.DragEvent;
    draggedItem?: TreeViewItem;
  }) {
    console.log("canDropData", (draggedItem as ExampleTreeViewItem)?.node.name);
    return !!draggedItem && this.node.type === "branch";
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
    if (!draggedItem) {
      return;
    }

    console.log("handleDrop", (draggedItem as ExampleTreeViewItem).node.name);

    const beforeNode = (before as ExampleTreeViewItem | undefined)?.node;

    for (const node of this.node.root.selectedDescendants) {
      this.node.insertBefore(node, beforeNode);
    }
    this.changes.emit("change");
  }

  renderRow({
    depth,
    indentation,
  }: {
    depth: number;
    indentation: number;
  }): React.ReactNode {
    return (
      <TreeRow
        changes={this.changes}
        node={this.node}
        depth={depth}
        indentation={indentation}
      />
    );
  }
}
*/

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

const BasicObserver: React.FC = () => {
  const [root] = useState(() => generateExampleNode(4, 3, 5));
  const [item, setItem] = useState(() => createExampleTreeViewItem(root));

  const onChange = () => {
    setItem(createExampleTreeViewItem(root));
  };

  return (
    <Wrap>
      <StyledTreeView
        rootItem={item}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        DropBetweenIndicator={DropBetweenIndicator}
        DropOverIndicator={DropOverIndicator}
        handleDragStart={(item) => {
          if (!item.node.selected) {
            item.node.root.deselect();
            item.node.select();
            onChange();
          }
          return true;
        }}
        canDropData={(item, { draggedItem }) => {
          console.log(
            "canDropData",
            (draggedItem as ExampleTreeViewItem)?.node.name
          );
          return !!draggedItem && item.node.type === "branch";
        }}
        handleDrop={(item, { draggedItem, before }) => {
          if (!draggedItem) {
            return;
          }

          console.log(
            "handleDrop",
            (draggedItem as ExampleTreeViewItem).node.name
          );

          for (const node of item.node.root.selectedDescendants) {
            item.node.insertBefore(node, before?.node);
          }
          onChange();
        }}
        renderRow={(item, { depth, indentation }) => (
          <TreeRow
            node={item.node}
            depth={depth}
            indentation={indentation}
            onChange={onChange}
          />
        )}
      />
    </Wrap>
  );
};

export const Basic: React.FC = () => {
  return <BasicObserver />;
};

/*
const ManyItemsObserver: React.FC = () => {
  const [changes] = useState(() => new Changes());
  const [root] = useState(() => generateExampleNode(5, 5, 5));
  const [item, setItem] = useState(
    () => new ExampleTreeViewItem(changes, undefined, root)
  );

  useEffect(() => {
    const onStructureChanged = () => {
      setItem(new ExampleTreeViewItem(changes, undefined, root));
    };
    changes.on("change", onStructureChanged);
    return () => {
      changes.off("change", onStructureChanged);
    };
  }, []);

  return (
    <Wrap>
      <StyledTreeView
        rootItem={item}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        DropBetweenIndicator={DropBetweenIndicator}
        DropOverIndicator={DropOverIndicator}
      />
    </Wrap>
  );
};

export const ManyItems: React.FC = () => {
  return <ManyItemsObserver />;
};

const NonReorderableObserver: React.FC = () => {
  const [changes] = useState(() => new Changes());
  const [root] = useState(() => generateExampleNode(4, 3, 5));
  const [item, setItem] = useState(
    () => new ExampleTreeViewItem(changes, undefined, root)
  );

  useEffect(() => {
    const onStructureChanged = () => {
      setItem(new ExampleTreeViewItem(changes, undefined, root));
    };
    changes.on("change", onStructureChanged);
    return () => {
      changes.off("change", onStructureChanged);
    };
  }, []);

  return (
    <Wrap>
      <StyledTreeView
        rootItem={item}
        reorderable={false}
        onBackgroundClick={() => {
          item.node.deselect();
        }}
        DropBetweenIndicator={DropBetweenIndicator}
        DropOverIndicator={DropOverIndicator}
      />
    </Wrap>
  );
};

export const NonReorderable: React.FC = () => {
  return <NonReorderableObserver />;
};
*/
