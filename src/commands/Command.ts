import { deleteNote } from "@/commands/deleteNote";
import { createNotice } from "@/util/createNotice";
import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";
import type { Node } from "@/graph/Node";
import { showShortestPath } from "@/commands/showShortestPath";

export interface Command {
  title: string;
  showConditon?: (view: BaseGraph3dView, nodes: Set<Node>) => boolean;
  function: (view: BaseGraph3dView, nodes: Set<Node>) => void;
}
export const commands: Command[] = [
  {
    title: "Delete Note",
    function: deleteNote,
  },
  {
    title: "Test Command",
    function: (view, nodes) => {
      for (const node of nodes) {
        const file = view.plugin.app.vault.getAbstractFileByPath(node.path);
        if (file) createNotice(`run on ${file.name}`);
      }
    },
  },
  {
    title: "Shortest Path",
    showConditon: (view, nodes) => nodes.size === 2,
    function: showShortestPath,
  },
];
