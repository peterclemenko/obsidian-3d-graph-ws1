import type { Node } from "@/graph/Node";

export class NodeGroup {
  query: string;
  color: string;

  constructor(query: string, color: string) {
    this.query = query;
    this.color = color;
  }

  // TODO: this should match the Obsidian API result
  static getRegex(query: string): RegExp {
    return new RegExp(query);
  }

  static matches(query: string, node: Node): boolean {
    return node.path.startsWith(this.sanitizeQuery(query));
  }

  static sanitizeQuery(query: string): string {
    const trimmedQuery = query.trim();
    if (trimmedQuery.startsWith("./")) return trimmedQuery.slice(1);
    else return trimmedQuery;
  }
}
