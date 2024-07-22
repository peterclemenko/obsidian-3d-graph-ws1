import { type Link } from "@/graph/Link";
import type { TAbstractFile } from "obsidian";

export class Node {
  public readonly id: string;
  public readonly name: string;
  public readonly path: string;
  public readonly val: number; // = weight, currently = 1 because scaling doesn't work well

  public readonly neighbors: Node[];
  public readonly links: Link[];
  public labelEl: HTMLDivElement | null = null;

  constructor(name: string, path: string, val = 10, neighbors: Node[] = [], links: Link[] = []) {
    this.id = path;
    this.name = name;
    this.path = path;
    this.val = val;
    this.neighbors = neighbors;
    this.links = links;
  }

  // Creates an array of nodes from an array of files (from the Obsidian API)
  static createFromFiles(files: TAbstractFile[]): Node[] {
    return files.map((file) => {
      return new Node(file.name, file.path);
    });
  }

  /**
   * given a node, check if it is a neighbour of current node. If yes,
   * Links together two nodes as neighbors (node -> neighbor).
   *
   */
  addNeighbor(neighbor: Node) {
    if (!this.isNeighborOf(neighbor)) {
      if (!this.neighbors.includes(neighbor)) this.neighbors.push(neighbor);
      if (!neighbor.neighbors.includes(this)) neighbor.neighbors.push(this);
    }
  }

  // Pushes a link to the node's links array if it doesn't already exist
  addLink(link: Link) {
    if (!this.links.some((l) => l.source === link.source && l.target === link.target)) {
      this.links.push(link);
    }
  }

  // Whether the node is a neighbor of another node
  public isNeighborOf(node: Node | string) {
    if (node instanceof Node) return this.neighbors.includes(node);
    else return this.neighbors.some((neighbor) => neighbor.id === node);
  }

  public static compare = (a: Node, b: Node) => {
    return a.path === b.path;
  };

  public static createNodeIndex(nodes: Node[]) {
    const nodeIndex = new Map<string, number>();
    nodes.forEach((node, index) => {
      nodeIndex.set(node.id, index);
    });
    return nodeIndex;
  }

  public static checkNodesValid = (nodes: Node[]) => {
    // check if there are duplicate nodes
    const nodeSet = new Set(nodes);
    if (nodeSet.size !== nodes.length) {
      throw new Error("Duplicate nodes found");
    }

    // check if there are duplicate neighbors in a node
    nodes.forEach((node) => {
      const neighborSet = new Set(node.neighbors);
      if (neighborSet.size !== node.neighbors.length) {
        throw new Error(`Duplicate neighbors found for node ${node.name}`);
      }
    });
  };
}
