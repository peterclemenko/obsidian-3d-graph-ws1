import { GraphType } from "@/SettingsSchemas";
import type Graph3dPlugin from "@/main";
import { LocalGraph3dView } from "@/views/graph/3dView/LocalGraph3dView";
import { GraphItemView } from "@/views/graph/GraphItemView";
import type { WorkspaceLeaf } from "obsidian";

export class LocalGraphItemView extends GraphItemView {
  graphType = GraphType.local as const;
  graph3dView: LocalGraph3dView;
  constructor(leaf: WorkspaceLeaf, plugin: Graph3dPlugin) {
    super(leaf, plugin);
    this.graph3dView = LocalGraph3dView.new(this.plugin, this.contentEl as HTMLDivElement, this);
  }
}
