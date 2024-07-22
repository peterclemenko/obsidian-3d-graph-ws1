import { GraphType } from "@/SettingsSchemas";
import type { Graph } from "@/graph/Graph";
import { Graph3dView } from "@/views/graph/3dView/Graph3dView";
import { getNewLocalGraph } from "@/views/graph/3dView/LocalGraph3dView";
import { PostProcessorGraphSettingManager } from "@/views/settings/graphSettingManagers/PostProcessorGraphSettingManager";
import type { Component, MarkdownView, TFile } from "obsidian";
import type { Graph3DViewMarkdownRenderChild } from "@/views/graph/Graph3DViewMarkdownRenderChild";
import { ForceGraph } from "@/views/graph/ForceGraph";
import type Graph3dPlugin from "@/main";

export class PostProcessorGraph3dView extends Graph3dView<
  PostProcessorGraphSettingManager,
  MarkdownView
> {
  itemView: MarkdownView;
  parent: Graph3DViewMarkdownRenderChild;
  settingManager: PostProcessorGraphSettingManager;

  public handleSearchResultChange(): void {
    this.updateGraphData();
  }
  public handleGroupColorSearchResultChange(): void {
    this.forceGraph.interactionManager.updateColor();
  }
  public handleMetadataCacheChange(): void {
    this.updateGraphData();
  }

  protected updateGraphData() {
    super.updateGraphData(this.getNewGraphData());
  }

  protected getNewGraphData(): Graph {
    const graph = getNewLocalGraph(this.plugin, {
      centerFile: this.parent.markdownView.file,
      searchResults: this.settingManager.searchResult.value.filter.files,
      filterSetting: {
        // TODO: since this `getNewLocalGraph` function is originally for local graph, the setting is a bit different, we have to manually set it for now
        ...this.settingManager.getCurrentSetting().filter,
        depth: 1,
        linkType: "both",
      },
    });
    return graph;
  }
  private constructor(
    plugin: Graph3dPlugin,
    contentEl: HTMLElement,
    markdownView: MarkdownView,
    parent: Graph3DViewMarkdownRenderChild
  ) {
    super(contentEl as HTMLDivElement, plugin, GraphType.postProcessor, markdownView);
    this.parent = parent;
    this.itemView = markdownView as MarkdownView & {
      file: TFile;
    };
    this.settingManager = PostProcessorGraphSettingManager.new(this);
  }

  static new(
    plugin: Graph3dPlugin,
    contentEl: HTMLElement,
    markdownView: MarkdownView,
    parent: Graph3DViewMarkdownRenderChild
  ) {
    const view = new PostProcessorGraph3dView(plugin, contentEl, markdownView, parent);
    view.onReady();
    // put the setting view in the content el
    return view;
  }

  getParent(): Component {
    return this.parent;
  }

  onReady(): void {
    super.onReady();
    // first we need to create the force graph
    this.forceGraph = new ForceGraph(
      this as typeof this.forceGraph.view,
      getNewLocalGraph(this.plugin)
    );
    // post process graph will not have 3d graph
    //  setting manager init view
    // this.settingManager.initNewView(true);
  }
}
