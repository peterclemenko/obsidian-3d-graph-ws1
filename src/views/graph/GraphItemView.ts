import type { GraphType } from "@/SettingsSchemas";
import { config } from "@/config";
import type Graph3dPlugin from "@/main";
import type { GlobalGraph3dView } from "@/views/graph/3dView/GlobalGraph3dView";
import type { LocalGraph3dView } from "@/views/graph/3dView/LocalGraph3dView";
import type { WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";

export abstract class GraphItemView extends ItemView {
  readonly plugin: Graph3dPlugin;
  /**
   * although we have a graph type in graph 3d view, we still need this graph type here in the item view
   * because the `getViewType` and `getDisplayText` method is called before the graph 3d view is created
   */
  abstract readonly graphType: GraphType.local | GraphType.global;
  /**
   * in the graph item view, the graph 3d view can only be either local or global
   */
  abstract graph3dView: LocalGraph3dView | GlobalGraph3dView;

  constructor(
    leaf: WorkspaceLeaf,
    plugin: Graph3dPlugin
    // graphType: GraphType.local | GraphType.global
  ) {
    super(leaf);
    this.plugin = plugin;
  }

  onload(): void {
    super.onload();
    this.plugin.activeGraphViews.push(this.graph3dView);
  }

  onunload(): void {
    super.onunload();
    this.graph3dView.getForceGraph().instance._destructor();
    this.plugin.activeGraphViews = this.plugin.activeGraphViews.filter(
      (view) => view !== this.graph3dView
    );
  }

  getDisplayText(): string {
    return config.displayText[this.graphType];
  }

  getViewType(): string {
    return config.viewType[this.graphType];
  }

  getIcon(): string {
    return config.icon;
  }

  onResize() {
    super.onResize();
    if (this.graph3dView) this.graph3dView.getForceGraph().updateDimensions();
  }
}
