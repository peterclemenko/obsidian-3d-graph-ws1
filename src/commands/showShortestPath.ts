import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";
import type { Node } from "@/graph/Node";
import { createNotice } from "@/util/createNotice";

const getShortestPath = (node1: Node, node2: Node) => {
  const visited = new Set<Node>();
  const queue = [{ node: node1, path: [node1] }];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    // If this node is the destination, return the path we took to get here
    if (node === node2) {
      return path;
    }

    visited.add(node);

    // Go through all neighbors of the current node
    for (const neighbor of node.neighbors) {
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }
  // If we exhausted all possibilities and didn't find a path
  console.error("No path found between the two nodes");
  return null;
};

export const showShortestPath = (view: BaseGraph3dView, nodes: Set<Node>) => {
  const [node1, node2] = [...nodes].filter(Boolean);

  // figure the shortest path between the two nodes

  if (!node1 || !node2) {
    console.error("Invalid nodes provided");
    return null;
  }

  const path = getShortestPath(node1, node2);

  if (!path) {
    createNotice("Shortest path not found");
    return;
  }

  // set interval to highlight the path
  //   view.getForceGraph().interactionManager.focusOnNodeByPath(node.path)

  const interval = setInterval(() => {
    if (path.length > 0) {
      const node = path.shift()!;
      view.getForceGraph().interactionManager.focusOnNodeByPath(node.path);
    } else {
      clearInterval(interval);
    }
  }, 5000);
};
