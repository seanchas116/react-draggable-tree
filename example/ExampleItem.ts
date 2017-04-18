const loremIpsum = require("lorem-ipsum")

export
class ExampleItem {
  static nextKey = 0
  key = ExampleItem.nextKey++

  constructor(public text: string, public children: ExampleItem[]|undefined, public collapsed: boolean) {
  }

  getDescendant(path: number[]): ExampleItem|undefined {
    if (path.length == 0) {
      return this
    } else if (this.children) {
      return this.children[path[0]].getDescendant(path.slice(1))
    }
  }

  clone(): ExampleItem {
    return new ExampleItem(
      this.text,
      this.children ? this.children.map(c => c.clone()) : undefined,
      this.collapsed
    )
  }

  static generate(depth: number, minChildCount: number, maxChildCount: number): ExampleItem {
    const text: string = loremIpsum({sentenceLowerBound: 2, sentenceUpperBound: 4})
    const hasChild = depth > 1
    let children: ExampleItem[]|undefined = undefined
    if (hasChild) {
      children = []
      const childCount = Math.round(Math.random() * (maxChildCount - minChildCount) + minChildCount)
      for (let i = 0; i < childCount; ++i) {
        children.push(ExampleItem.generate(depth - 1, minChildCount, maxChildCount))
      }
    }
    return new ExampleItem(text, children, false)
  }
}