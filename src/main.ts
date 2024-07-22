import type { App, HoverParent, HoverPopover, PluginManifest } from "obsidian";
import { MarkdownView, Plugin } from "obsidian";
import { State } from "@/util/State";
import { Graph } from "@/graph/Graph";
import type { ResolvedLinkCache } from "@/graph/Link";
import { deepCompare } from "@/util/deepCompare";
import "@total-typescript/ts-reset";
import "@total-typescript/ts-reset/dom";
import { eventBus } from "@/util/EventBus";
import { SettingTab } from "@/views/SettingTab";
import { config } from "@/config";
import { MyFileManager } from "@/FileManager";
import { PluginSettingManager } from "@/SettingManager";
import { GraphType } from "@/SettingsSchemas";
import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";
import { GlobalGraphItemView } from "@/views/graph/GlobalGraphItemView";
import { LocalGraphItemView } from "@/views/graph/LocalGraphItemView";
import { Graph3DViewMarkdownRenderChild } from "@/views/graph/Graph3DViewMarkdownRenderChild";

export default class Graph3dPlugin extends Plugin implements HoverParent {
  _resolvedCache: ResolvedLinkCache;
  public readonly cacheIsReady: State<boolean> = new State(
    this.app.metadataCache.resolvedLinks !== undefined
  );
  private isCacheReadyOnce = false;
  /**
   *  we keep a global graph here because we dont want to create a new graph every time we open a graph view
   */
  public globalGraph: Graph;

  public fileManager: MyFileManager;
  public settingManager: PluginSettingManager;

  public activeGraphViews: BaseGraph3dView[] = [];

  public mousePosition = { x: 0, y: 0 };

  public hoverPopover: HoverPopover | null = null;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    // this will be initialized in the on cache changed function
    this._resolvedCache = undefined as unknown as ResolvedLinkCache;
    // this will be initialized in the on cache changed function
    this.globalGraph = undefined as unknown as Graph;

    this.onGraphCacheChanged();

    this.settingManager = new PluginSettingManager(this);

    // this will be initialized in the onload function because we need to wait for the setting manager to initialize
    this.fileManager = undefined as unknown as MyFileManager;
  }

  /**
   * initialize all the things here
   */
  async onload() {
    // load the setting using setting manager
    await this.settingManager.loadSettings();

    // get the setting from setting manager
    // const setting = this.settingManager.getSetting("test");

    // initalise the file manager
    this.fileManager = new MyFileManager(this);

    // init the theme
    this.cacheIsReady.value = this.app.metadataCache.resolvedLinks !== undefined;
    this.onGraphCacheChanged();

    // init listeners
    this.initListeners();

    this.addRibbonIcon(config.icon, config.displayText.global, this.openGlobalGraph);

    this.addCommand({
      id: "open-3d-graph-global",
      name: "Open Global 3D Graph",
      callback: this.openGlobalGraph,
    });

    this.addCommand({
      id: "open-3d-graph-local",
      name: "Open Local 3D Graph",
      callback: this.openLocalGraph,
    });

    this.registerDomEvent(window, "mousemove", (event) => {
      // set the mouse position
      this.mousePosition.x = event.clientX;
      this.mousePosition.y = event.clientY;
    });

    this.addSettingTab(new SettingTab(this.app, this));

    // register global view
    this.registerView(config.viewType.global, (leaf) => {
      return new GlobalGraphItemView(leaf, this);
    });

    // register local view
    this.registerView(config.viewType.local, (leaf) => {
      return new LocalGraphItemView(leaf, this);
    });

    // register markdown code block processor
    this.registerMarkdownCodeBlockProcessor("3d-graph", (source, el, ctx) => {
      // get the markdown view of this file
      const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView;
      ctx.addChild(new Graph3DViewMarkdownRenderChild(el, this, source, ctx, markdownView));
    });

    // register hover link source
    this.registerHoverLinkSource("3d-graph", {
      defaultMod: true,
      display: "3D Graph",
    });
  }

  onunload(): void {
    super.unload();
    // unregister the resolved cache listener
    this.app.metadataCache.off("resolved", this.onGraphCacheReady);
    this.app.metadataCache.off("resolve", this.onGraphCacheChanged);
  }

  private initListeners() {
    // all files are resolved, so the cache is ready:
    this.app.metadataCache.on("resolved", this.onGraphCacheReady);
    // the cache changed:
    this.app.metadataCache.on("resolve", this.onGraphCacheChanged);

    // show open local graph button in file menu
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!file) return;
        menu.addItem((item) => {
          item
            .setTitle("Open in local 3D Graph")
            .setIcon(config.icon)
            .onClick(() => this.openLocalGraph());
        });
      })
    );
  }

  /**
   * this will be called the when the cache is ready.
   * And this will hit the else clause of the `onGraphCacheChanged` function
   */
  private onGraphCacheReady = () => {
    // console.log("Graph cache is ready");
    this.cacheIsReady.value = true;
    this.onGraphCacheChanged();
  };

  /**
   * check if the cache is ready and if it is, update the global graph
   */
  public onGraphCacheChanged = () => {
    // check if the cache actually updated
    // Obsidian API sends a lot of (for this plugin) unnecessary stuff
    // with the resolve event
    if (
      this.cacheIsReady.value &&
      !deepCompare(this._resolvedCache, this.app.metadataCache.resolvedLinks)
    ) {
      this._resolvedCache = structuredClone(this.app.metadataCache.resolvedLinks);
      this.globalGraph = Graph.createFromApp(this.app);

      if (this.isCacheReadyOnce) {
        // update graph view
        this.activeGraphViews.forEach((view) => {
          view.handleMetadataCacheChange();
        });
      }
    } else {
      this.isCacheReadyOnce = true;
      // console.log(
      //   "changed but ",
      //   this.cacheIsReady.value,
      //   " and ",
      //   deepCompare(this._resolvedCache, this.app.metadataCache.resolvedLinks)
      // );

      // update graph views
      this.activeGraphViews.forEach((view) => {
        view.handleMetadataCacheChange();
      });
    }
  };

  /**
   * Opens a local graph view in a new leaf
   */
  private openLocalGraph = () => {
    const localGraphItemView = this.app.workspace.getActiveViewOfType(LocalGraphItemView);
    if (localGraphItemView) {
      this.app.workspace.setActiveLeaf(localGraphItemView.leaf);
    } else this.openGraph(GraphType.local);
  };

  /**
   * Opens a global graph view in the current leaf
   */
  private openGlobalGraph = () => {
    const globalGraphView = this.app.workspace.getActiveViewOfType(GlobalGraphItemView);
    if (globalGraphView) {
      this.app.workspace.setActiveLeaf(globalGraphView.leaf);
    } else this.openGraph(GraphType.global);
  };

  /**
   * this function will open a graph view in the current leaf
   */
  private openGraph = async (graphType: GraphType) => {
    eventBus.trigger("open-graph");

    const leaf = this.app.workspace.getLeaf(graphType === GraphType.local ? "split" : false);
    await leaf.setViewState({
      type: graphType === GraphType.local ? config.viewType.local : config.viewType.global,
      active: true,
    });
  };
}
