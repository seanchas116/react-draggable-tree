function generateRandomID() {
  return Math.random().toString(36).substr(2, 9);
}

export class Node {
  readonly key = generateRandomID();
  type: "leaf" | "branch" = "leaf";
  name = "";
  selected = false;
  collapsed = false;
  parent: Node | undefined = undefined;
  nextSibling: Node | undefined = undefined;
  previousSibling: Node | undefined = undefined;
  firstChild: Node | undefined = undefined;
  lastChild: Node | undefined = undefined;

  get children(): readonly Node[] {
    const children: Node[] = [];
    let node = this.firstChild;
    while (node) {
      children.push(node);
      node = node.nextSibling as Node | undefined;
    }
    return children;
  }

  remove(): void {
    const parent = this.parent;
    if (!parent) {
      return;
    }

    const prev = this.previousSibling;
    const next = this.nextSibling;

    if (prev) {
      prev.nextSibling = next;
    } else {
      parent.firstChild = next;
    }
    if (next) {
      next.previousSibling = prev;
    } else {
      parent.lastChild = prev;
    }
    this.parent = undefined;
    this.previousSibling = undefined;
    this.nextSibling = undefined;
  }

  insertBefore(child: Node, next: Node | undefined): void {
    if (child === next) {
      return;
    }
    if (child.includes(this)) {
      throw new Error("Cannot insert node to its descendant");
    }
    if (next && next.parent !== this) {
      throw new Error("The ref node is not a child of this node");
    }
    child.remove();

    let prev = next ? next.previousSibling : this.lastChild;
    if (prev) {
      prev.nextSibling = child;
    } else {
      this.firstChild = child;
    }
    if (next) {
      next.previousSibling = child;
    } else {
      this.lastChild = child;
    }
    child.previousSibling = prev;
    child.nextSibling = next;
    child.parent = this;
  }

  append(...children: Node[]): void {
    for (const child of children) {
      this.insertBefore(child, undefined);
    }
  }

  includes(other: Node): boolean {
    if (this === other.parent) {
      return true;
    }
    if (!other.parent) {
      return false;
    }
    return this.includes(other.parent);
  }

  get root(): Node {
    return this.parent?.root ?? this;
  }

  select() {
    this.selected = true;
    for (const child of this.children) {
      child.deselect();
    }
  }

  deselect() {
    this.selected = false;
    for (const child of this.children) {
      child.deselect();
    }
  }

  get ancestorSelected(): boolean {
    return this.selected || (this.parent?.ancestorSelected ?? false);
  }

  get selectedDescendants(): Node[] {
    if (this.selected) {
      return [this];
    }
    return this.children.flatMap((child) => child.selectedDescendants);
  }
}
