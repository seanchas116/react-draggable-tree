export type Key = string | number

export interface TreeNode {
  children: this[] | undefined
  collapsed: boolean
  key: Key
}

export interface TreeRowInfo {
  node: TreeNode
  selected: boolean
  path: number[]
  visible: boolean
  visibleOffset: number
}
