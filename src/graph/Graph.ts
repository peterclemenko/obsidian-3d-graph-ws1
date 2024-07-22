import type { ResolvedLinkCache } from "@/graph/Link";
import { Link } from "@/graph/Link";
import { Node } from "@/graph/Node";
import { copy } from "copy-anything";
import type { App, TAbstractFile } from "obsidian";

export class Graph {
  public readonly nodes: Node[];
  public readonly links: Link[];

  // Indexes to quickly retrieve nodes and links by id
  private readonly nodeIndex: Map<string, number>;
  private readonly linkIndex: Map<string, Map<string, number>>;

  constructor(
    nodes: Node[],
    links: Link[],
    nodeIndex: Map<string, number>,
    linkIndex: Map<string, Map<string, number>>
  ) {
    this.nodes = nodes;
    this.links = links;
    this.nodeIndex = nodeIndex || new Map<string, number>();
    this.linkIndex = linkIndex || new Map<string, Map<string, number>>();
  }

  public getNodeByPath = (path: string): Node | null => {
    const index = this.nodeIndex.get(path);
    if (typeof index === "number") {
      return this.nodes[index] ?? null;
    }
    return null;
  };

  public getNodeById(id: string): Node | null {
    const index = this.nodeIndex.get(id);
    if (typeof index === "number") {
      return this.nodes[index] ?? null;
    }
    return null;
  }

  // Returns a link by its source and target node ids
  public getLinkByIds(sourceNodeId: string, targetNodeId: string): Link | null {
    const sourceLinkMap = this.linkIndex.get(sourceNodeId);
    if (sourceLinkMap) {
      const index = sourceLinkMap.get(targetNodeId);
      if (index !== undefined) {
        // @ts-ignore
        return this.links[index];
      }
    }
    return null;
  }

  public getLinksFromNode(sourceNodeId: string): Link[] {
    const linkIndexes = this.linkIndex.get(sourceNodeId);
    if (linkIndexes) {
      return Array.from(linkIndexes.values())
        .map((index) => this.links[index])
        .filter(Boolean);
    }
    return [];
  }

  /**
   * given a node id, return all the links that contains this node
   */
  public getLinksWithNode(nodeId: string): Link[] {
    const links: Link[] = [];

    this.linkIndex.forEach((targetMap, sourceId) => {
      if (sourceId === nodeId) {
        links.push(
          // @ts-ignore
          ...Array.from(targetMap.values()).map((index) => this.links[index])
        );
      } else if (targetMap.has(nodeId)) {
        const index = targetMap.get(nodeId);
        if (typeof index === "number") {
          // @ts-ignore
          links.push(this.links[index]);
        }
      }
    });

    return links;
  }

  // Clones the graph
  public clone = (): Graph => {
    return new Graph(
      copy(this.nodes),
      copy(this.links),
      copy(this.nodeIndex),
      copy(this.linkIndex)
    );
  };

  public static createEmpty = (): Graph => {
    return new Graph([], [], new Map(), new Map());
  };

  // Creates a graph using the Obsidian API
  public static createFromApp = (app: App): Graph => {
    const map = getMapFromMetaCache(app.metadataCache.resolvedLinks);
    const config = app.vault.config;
    const userExcludedFolders = config.userIgnoreFilters;
    const allFiles = userExcludedFolders
      ? app.vault
          .getFiles()
          .filter((file) => !userExcludedFolders.some((folder) => file.path.startsWith(folder)))
      : app.vault.getFiles();

    const nodes = Node.createFromFiles(allFiles);
    return Graph.createFromLinkMap(map, nodes);
  };

  public static createFromLinkMap(
    map: {
      [x: string]: string[];
    },
    nodes: Node[]
  ) {
    // Create new instances of nodes
    const newNodes = nodes.map((node) => new Node(node.name, node.path, node.val));
    const nodeMap = new Map<string, Node>();
    newNodes.forEach((node) => nodeMap.set(node.id, node));

    const links: Link[] = [];

    Object.entries(map).forEach(([sourceId, targetIds]) => {
      const sourceNode = nodeMap.get(sourceId);
      if (!sourceNode) return;

      targetIds.forEach((targetId) => {
        const targetNode = nodeMap.get(targetId);
        if (!targetNode) return;

        // Create new instances of links
        const link = new Link(sourceNode, targetNode);
        links.push(link);

        // As we are creating new nodes, we need to make sure they are properly linked
        sourceNode.addNeighbor(targetNode);
        sourceNode.addLink(link);
        targetNode.addLink(link);
      });
    });

    return new Graph(newNodes, links, Node.createNodeIndex(newNodes), Link.createLinkIndex(links));
  }

  /**
   * filter the nodes of the graph, the links will be filtered automatically.
   * @param predicate what nodes to keep
   * @param graph the graph to filter
   * @returns a new graph
   */
  public filter = (
    predicate: (node: Node) => boolean,
    linksPredicate?: (link: Link) => boolean
  ) => {
    // Filter nodes based on the predicate
    const filteredNodes = this.nodes.filter(predicate);

    // Create a quick lookup set for filtered node IDs
    const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));

    // Filter links
    const filteredLinks = this.links.filter((link) => {
      // Check if both source and target nodes are in the filtered node set
      const linkIsValid =
        filteredNodeIds.has(link.source.id) && filteredNodeIds.has(link.target.id);

      // Apply the linksPredicate if provided
      return linkIsValid && (!linksPredicate || linksPredicate(link));
    });

    // transform the link to linkmap
    const linkMap = Link.createLinkMap(filteredLinks);

    return Graph.createFromLinkMap(linkMap, filteredNodes);
  };

  public static compare = (graph1: Graph, graph2: Graph): boolean => {
    // Quick checks for lengths
    if (graph1.nodes.length !== graph2.nodes.length) {
      return false;
    }
    if (graph1.links.length !== graph2.links.length) {
      return false;
    }

    // Compare nodes
    for (const node1 of graph1.nodes) {
      const node2Index = graph2.nodeIndex.get(node1.id);
      // @ts-ignore
      if (node2Index === undefined || graph2.nodes[node2Index].id !== node1.id) {
        return false;
      }
    }

    // Compare links
    for (const link1 of graph1.links) {
      const graph2SourceLinkMap = graph2.linkIndex.get(link1.source.id);
      if (!graph2SourceLinkMap) {
        return false;
      }

      const graph2LinkIndex = graph2SourceLinkMap.get(link1.target.id);
      if (graph2LinkIndex === undefined) {
        return false;
      }

      const link2 = graph2.links[graph2LinkIndex];
      if (!link2 || link2.source.id !== link1.source.id || link2.target.id !== link1.target.id) {
        return false;
      }
    }

    return true;
  };

  /**
   * get the files from the graph
   */
  public static getFiles(app: App, graph: Graph): TAbstractFile[] {
    return graph.nodes.map((node) => app.vault.getAbstractFileByPath(node.path)).filter(Boolean);
  }

  public isAcyclic = (): boolean => {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    for (const node of this.nodes) {
      if (this.isCyclicUtil(node.id, visited, recStack)) {
        return false;
      }
    }
    return true;
  };

  private isCyclicUtil = (nodeId: string, visited: Set<string>, recStack: Set<string>): boolean => {
    if (!visited.has(nodeId)) {
      // Add to visited and recursion stack
      visited.add(nodeId);
      recStack.add(nodeId);

      // Get all adjacent nodes (i.e., following the direction of links)
      const adjNodes = this.getLinksFromNode(nodeId).map((link) =>
        link.source.id === nodeId ? link.target.id : link.source.id
      );

      for (const neighborId of adjNodes) {
        if (!visited.has(neighborId) && this.isCyclicUtil(neighborId, visited, recStack)) {
          return true;
        } else if (recStack.has(neighborId)) {
          // If the node is in the recursion stack, it means we've found a cycle
          return true;
        }
      }
    }

    // Remove from recursion stack
    recStack.delete(nodeId);
    return false;
  };
}

const getMapFromMetaCache = (resolvedLinks: ResolvedLinkCache) => {
  const result: Record<string, string[]> = {};
  Object.keys(resolvedLinks).map((nodeId) => {
    result[nodeId] =
      Object.keys(resolvedLinks[nodeId]!).map((nodePath) => {
        return nodePath;
      }) ?? [];
  });

  // remove self links
  Object.keys(result).forEach((nodeId) => {
    result[nodeId] = result[nodeId]?.filter((nodePath) => nodePath !== nodeId) ?? [];
  });
  return result;
};
