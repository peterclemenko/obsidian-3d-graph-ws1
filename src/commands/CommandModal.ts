import { FuzzySuggestModal } from "obsidian";
import type { Node } from "@/graph/Node";
import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";
import type { Command } from "@/commands/Command";
import { commands } from "@/commands/Command";

export class CommandModal extends FuzzySuggestModal<Command> {
  private nodes: Set<Node>;
  private view: BaseGraph3dView;

  constructor(view: BaseGraph3dView, selectedNodes: Set<Node>) {
    super(view.plugin.app);
    this.nodes = selectedNodes;
    this.view = view;
  }

  getItems() {
    return commands.filter((command) => command.showConditon?.(this.view, this.nodes) ?? true);
  }

  getItemText(command: Command): string {
    return command.title;
  }

  onChooseItem(command: Command, evt: MouseEvent | KeyboardEvent) {
    command.function(this.view, this.nodes);
  }
}
