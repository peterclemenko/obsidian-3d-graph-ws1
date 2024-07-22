import { GraphType } from "@/SettingsSchemas";
import type Graph3dPlugin from "@/main";
import { GlobalGraph3dView } from "@/views/graph/3dView/GlobalGraph3dView";
import { GraphItemView } from "@/views/graph/GraphItemView";
import type { WorkspaceLeaf } from "obsidian";

export class GlobalGraphItemView extends GraphItemView {
  graph3dView: GlobalGraph3dView;
  graphType = GraphType.global as const;

  constructor(leaf: WorkspaceLeaf, plugin: Graph3dPlugin) {
    super(leaf, plugin);
    this.graph3dView = GlobalGraph3dView.new(this.plugin, this.contentEl as HTMLDivElement, this);
  }
}
