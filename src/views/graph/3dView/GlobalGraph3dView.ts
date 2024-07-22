import type { GlobalGraphSettings } from "@/SettingsSchemas";
import { GraphType } from "@/SettingsSchemas";
import type Graph3dPlugin from "@/main";
import type { GlobalGraphItemView } from "@/views/graph/GlobalGraphItemView";
import { Graph3dView } from "@/views/graph/3dView/Graph3dView";
import type { SearchResult } from "@/views/settings/graphSettingManagers/GraphSettingsManager";
import { GlobalGraphSettingManager } from "@/views/settings/graphSettingManagers/GlobalGraphSettingManager";
import { ForceGraph } from "@/views/graph/ForceGraph";
import type { Component } from "obsidian";

const getNewGlobalGraph = (
  plugin: Graph3dPlugin,
  config?: {
    searchResults: SearchResult["filter"]["files"];
    filterSetting: GlobalGraphSettings["filter"];
  }
) => {
  if (!config) return plugin.globalGraph;
  return plugin.globalGraph
    .clone()
    .filter((node) => {
      // if node is not a markdown  and show attachment is false, then we will not show it
      if (!node.path.endsWith(".md") && !config.filterSetting.showAttachments) return false;
      //  if the search query is not empty and the search result is empty, then we don't need to filter the search result
      if (config.searchResults.length === 0 && config.filterSetting.searchQuery === "") return true;
      // if the node is not in the files, then we will not show it
      return config.searchResults.some((file) => file.path === node.path);
    })
    .filter((node) => {
      // if node is an orphan and show orphan is false, then we will not show it
      if (node.links.length === 0 && !config.filterSetting.showOrphans) return false;
      return true;
    });
};

export class GlobalGraph3dView extends Graph3dView<GlobalGraphSettingManager, GlobalGraphItemView> {
  settingManager: GlobalGraphSettingManager;
  private constructor(
    plugin: Graph3dPlugin,
    contentEl: HTMLDivElement,
    itemView: GlobalGraphItemView
  ) {
    super(contentEl, plugin, GraphType.global, itemView);
    this.settingManager = GlobalGraphSettingManager.new(this);
  }

  public handleGroupColorSearchResultChange(): void {
    this.forceGraph?.interactionManager.updateColor();
  }

  public handleSearchResultChange(): void {
    this.updateGraphData();
  }

  protected getNewGraphData() {
    return getNewGlobalGraph(this.plugin, {
      searchResults: this.settingManager.searchResult.value.filter.files,
      filterSetting: this.settingManager.getCurrentSetting().filter,
    });
  }

  protected updateGraphData() {
    super.updateGraphData(this.getNewGraphData());
  }

  public handleMetadataCacheChange(): void {
    this.updateGraphData();
  }

  static new(plugin: Graph3dPlugin, contentEl: HTMLDivElement, itemView: GlobalGraphItemView) {
    const view = new GlobalGraph3dView(plugin, contentEl, itemView);
    view.onReady();
    return view;
  }

  getParent(): Component {
    return this.itemView;
  }

  protected onReady(): void {
    super.onReady();
    // first we need to create the force graph
    this.forceGraph = new ForceGraph(this as typeof this.forceGraph.view, this.plugin.globalGraph);
    // then we need to init the setting manager
    this.settingManager.initNewView({
      collapsed: true,
    });
  }
}
