export type DropIndication =
  | {
      type: "bar";
      top: number;
      depth: number;
    }
  | {
      type: "over";
      top: number;
      height: number;
    };
