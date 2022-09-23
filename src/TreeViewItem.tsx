import React, { ReactNode } from "react";

export interface TreeViewItem {
  key: string;
  parent: this | undefined;
  children: this[];
}
