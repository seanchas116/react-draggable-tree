export type DropIndication =
  | {
      type: "between";
      top: number;
      depth: number;
    }
  | {
      type: "over";
      top: number;
      height: number;
    };
