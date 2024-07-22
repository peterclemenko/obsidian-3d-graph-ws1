import { Graph } from "@/graph/Graph";
import type { Node } from "@/graph/Node";
import type { Link } from "@/graph/Link";
import type Graph3dPlugin from "@/main";
import { Graph3dView } from "@/views/graph/3dView/Graph3dView";
import type { SearchResult } from "@/views/settings/graphSettingManagers/GraphSettingsManager";
import { LocalGraphSettingManager } from "@/views/settings/graphSettingManagers/LocalGraphSettingManager";
import type { Component, TAbstractFile, TFile } from "obsidian";
import { type LocalGraphItemView } from "@/views/graph/LocalGraphItemView";
import type { LocalGraphSettings } from "@/SettingsSchemas";
import { GraphType } from "@/SettingsSchemas";
import { ForceGraph } from "@/views/graph/ForceGraph";

/**
 *
 * @param graph
 * @param id the center node id
 * @param depth the max distance of the link away from the center node. If depth is 1,
 * then it mean the links directly connected to the center node. If depth is 2, then it means the links
 * directly connected to the center node and the links connected to the links connected to the center node
 * @param linkType
 * @returns nodes and link of a local graph. If link type is inlinks and outlinks, then it will be acyclic
 */
const traverseNode = (
  graph: Graph,
  id: string,
  depth: number,
  linkType: "both" | "outlinks" | "inlinks"
): { nodes: Node[]; links: Link[] } => {
  const visitedNodes = new Set<string>();
  const visitedLinks = new Set<Link>();
  const validLinks = new Set<Link>();
  const queue: { node: Node; depth: number }[] = [];

  const startNode = graph.getNodeById(id);
  if (startNode) {
    queue.push({ node: startNode, depth: 0 });
  }

  while (queue.length > 0) {
    const { node, depth: currentDepth } = queue.shift()!;
    if (!node) continue;
    visitedNodes.add(node.id);

    if (currentDepth < depth) {
      node.links.forEach((link) => {
        if (visitedLinks.has(link)) {
          return; // Skip already visited links
        }

        const neighbor = link.source === node ? link.target : link.source;
        const isOutlink = link.source === node;
        const isInlink = link.target === node;

        if (
          linkType === "both" ||
          (linkType === "outlinks" && isOutlink) ||
          (linkType === "inlinks" && isInlink)
        ) {
          let linkValid = false;
          visitedLinks.add(link);
          // if linktype is both, simply add to valid link
          // if link type is not both, then we need to check if the link is valid
          // a link is not valid when the neighbour node is already visited
          // because if the neighbour is already visit, there must be a link pointing to it
          if (linkType == "both") {
            linkValid = true;
          } else {
            // if link type is both, then we need to check if the link is valid
            // a link is not valid when the neighbour node is already visited
            // because if the neighbour is already visit, there must be a link pointing to it
            if (!visitedNodes.has(neighbor.id)) {
              linkValid = true;
            }
          }

          if (linkValid) validLinks.add(link);
          if (!visitedNodes.has(neighbor.id) && linkValid) {
            queue.push({ node: neighbor, depth: currentDepth + 1 });
          }
        }
      });
    }
  }

  return {
    nodes: [...visitedNodes].map((nodeId) => graph.getNodeById(nodeId)).filter(Boolean),
    links: [...validLinks],
  };
};

/**
 * this is called by the plugin to create a new local graph.
 * It will not have any setting. The files is also
 */
export const getNewLocalGraph = (
  plugin: Graph3dPlugin,
  config?: {
    centerFile: TAbstractFile | null;
    searchResults: SearchResult["filter"]["files"];
    filterSetting: LocalGraphSettings["filter"];
  }
) => {
  // get a new local graph (updated with cache) to make sure that the graph is updated with the latest cache

  // get the current search result

  // get the current show attachments and show orphans from graph setting

  // compose a new graph
  const centerFile = config?.centerFile ?? plugin.app.workspace.getActiveFile();

  if (!centerFile || !config) return Graph.createEmpty();

  const { nodes, links } = traverseNode(
    plugin.globalGraph,
    centerFile.path,
    config.filterSetting.depth,
    config.filterSetting.linkType
  );

  // active file must exist in local graph
  const graph = plugin.globalGraph
    // filter the nodes and links
    .filter(
      (node) => {
        // the center file, which must be shown
        if (node.path === centerFile.path) return true;
        return nodes.some((n) => n.path === node.path);
      },

      (link) => {
        return links.some(
          (l) => l.source.path === link.source.path && l.target.path === link.target.path
        );
      }
    )
    .filter((node) => {
      // the center file, which must be shown
      if (node.path === centerFile.path) return true;
      // if node is not a markdown  and show attachment is false, then we will not show it
      if (!node.path.endsWith(".md") && !config.filterSetting.showAttachments) return false;
      //  if the search query is not empty and the search result is empty, then we don't need to filter the search result
      if (config.searchResults.length === 0 && config.filterSetting.searchQuery === "") return true;
      // if the node is not in the files, then we will not show it, except
      return config.searchResults.some((file) => file.path === node.path);
    })
    .filter((node) => {
      // the center file, which must be shown
      if (node.path === centerFile.path) return true;
      // if node is an orphan and show orphan is false, then we will not show it
      if (node.links.length === 0 && !config.filterSetting.showOrphans) return false;
      return true;
    });

  return graph;
};

type ConstructorParameters = [
  plugin: Graph3dPlugin,
  contentEl: HTMLDivElement,
  itemView: LocalGraphItemView
];

export class LocalGraph3dView extends Graph3dView<LocalGraphSettingManager, LocalGraphItemView> {
  settingManager: LocalGraphSettingManager;
  /**
   * when the app is just open, this can be null
   */
  currentFile: TAbstractFile | null;

  private constructor(
    plugin: Graph3dPlugin,
    contentEl: HTMLDivElement,
    itemView: LocalGraphItemView
  ) {
    super(contentEl, plugin, GraphType.local, itemView);
    this.currentFile = this.plugin.app.workspace.getActiveFile();
    this.settingManager = LocalGraphSettingManager.new(this);

    // register event on this item view
    this.itemView.registerEvent(
      this.plugin.app.workspace.on("file-open", this.handleFileChange.bind(this))
    );
  }

  getParent(): Component {
    return this.itemView;
  }

  protected onReady() {
    super.onReady();
    type LocalGraph3dView = typeof this.forceGraph.view;
    this.forceGraph = new ForceGraph(this as LocalGraph3dView, getNewLocalGraph(this.plugin));
    this.settingManager.initNewView({
      collapsed: true,
    });
  }

  public handleFileChange = (file: TFile) => {
    if (!file) return;
    this.currentFile = file;
    this.updateGraphData();
  };

  public handleSearchResultChange(): void {
    this.updateGraphData();
  }

  public handleMetadataCacheChange(): void {
    this.updateGraphData();
  }

  protected getNewGraphData(): Graph {
    const graph = getNewLocalGraph(this.plugin, {
      centerFile: this.currentFile,
      searchResults: this.settingManager.searchResult.value.filter.files,
      filterSetting: this.settingManager.getCurrentSetting().filter,
    });
    return graph;
  }

  protected updateGraphData() {
    super.updateGraphData(this.getNewGraphData());
  }

  public handleGroupColorSearchResultChange(): void {
    this.forceGraph?.interactionManager.updateColor();
  }

  public handleSettingUpdate(
    newSetting: LocalGraphSettings,
    ...path: NestedKeyOf<LocalGraphSettings>[]
  ): void {
    super.handleSettingUpdate(newSetting, ...path);
    if (path.some((p) => p === "filter.depth" || p === "filter.linkType")) {
      this.updateGraphData();
    }
  }

  static new(...args: ConstructorParameters) {
    const view = new LocalGraph3dView(...args);
    view.onReady();
    // put the setting view in the content el

    return view;
  }
}
