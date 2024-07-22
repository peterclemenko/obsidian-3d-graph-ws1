import { TreeItem } from "@/views/atomics/TreeItem";
import type { ItemView, TAbstractFile } from "obsidian";
import { ExtraButtonComponent } from "obsidian";
import { UtilitySettingsView } from "@/views/settings/categories/UtilitySettingsView";
import { SavedSettingsView } from "@/views/settings/categories/SavedSettingsView";
import { FilterSettingsView } from "@/views/settings/categories/FilterSettingsView";
import { PluginSettingManager } from "@/SettingManager";
import type { StateChange } from "@/util/State";
import { State } from "@/util/State";
import { GroupSettingsView } from "@/views/settings/categories/GroupSettingsView";
import { DisplaySettingsView } from "@/views/settings/categories/DisplaySettingsView";
import type { BaseGraph3dView, Graph3dView } from "@/views/graph/3dView/Graph3dView";
import { waitFor } from "@/util/waitFor";
import type {
  GlobalGraphSettings,
  GraphSetting,
  LocalGraphSettings,
  SavedSetting,
} from "@/SettingsSchemas";
import { GraphType } from "@/SettingsSchemas";
import { LifeCycle } from "@/util/LifeCycle";
import { classes } from "polytype";

export type SearchResult = {
  filter: {
    files: Prettify<Omit<TAbstractFile, "vault" | "parent">>[];
  };
  groups: {
    files: Prettify<Omit<TAbstractFile, "vault" | "parent">>[];
  }[];
};

export type BaseGraphSettingManager = GraphSettingManager<GraphSetting, BaseGraph3dView>;

export abstract class GraphSettingManager<
  S extends GraphSetting,
  V extends Graph3dView<GraphSettingManager<S, V>, ItemView>
> extends classes(LifeCycle) {
  protected graphView: V;
  protected abstract currentSetting: State<S>;
  protected settingChanges: StateChange<unknown, S>[] = [];

  readonly containerEl: HTMLDivElement;
  protected settingsButton: ExtraButtonComponent;
  protected graphControlsEl?: HTMLDivElement;

  public filterSettingView?: Awaited<ReturnType<typeof FilterSettingsView>>;
  public groupSettingView?: Awaited<ReturnType<typeof GroupSettingsView>>;
  public displaySettingView?: Awaited<ReturnType<typeof DisplaySettingsView>>;

  public searchResult: State<SearchResult> = new State({
    filter: { files: [] },
    groups: [],
  } as SearchResult);
  protected searchResultChanges: StateChange<unknown, SearchResult>[] = [];

  protected constructor(graphView: V) {
    super();
    this.graphView = graphView;
    // create a div for the setting
    this.containerEl = document.createElement("div");
    this.containerEl.classList.add("graph-settings-view");

    // add the setting button to this div
    this.settingsButton = new ExtraButtonComponent(this.containerEl)
      .setIcon("settings")
      .setTooltip("Open graph settings")
      .onClick(this.onSettingsButtonClicked);
    this.settingsButton.extraSettingsEl.addClasses(["clickable-icon"]);
  }

  private onSettingsButtonClicked = () => {
    this.toggleCollapsed(false);
  };

  // toggle the view to collapsed or expanded
  toggleCollapsed(collapsed: boolean) {
    if (collapsed) {
      this.settingsButton.setDisabled(false);
      this.settingsButton.extraSettingsEl.classList.remove("hidden");
      this.graphControlsEl?.classList.add("hidden");
    } else {
      this.settingsButton.setDisabled(true);
      this.settingsButton.extraSettingsEl.classList.add("hidden");
      this.graphControlsEl?.classList.remove("hidden");
    }
  }

  /**
   * this function will initialize a new view for setting and then append it to the current graph view
   */
  initNewView(
    config: {
      collapsed?: boolean;
    } = {}
  ) {
    const { collapsed = false } = config;
    // check if the contentEl of the graph View already contains the containerEl of setting manager, if not add it
    if (!this.graphView.contentEl.contains(this.containerEl)) {
      this.graphView.contentEl.appendChild(this.containerEl);
    }

    // this ensure that the graph controls element is empty
    this.graphControlsEl?.remove();
    // also remove all the search result container
    this.graphView.itemView.containerEl
      .querySelectorAll(".search-result-container")
      .forEach((el) => el.remove());

    this.graphControlsEl = document.createElement("div");
    this.graphControlsEl.classList.add("graph-controls");

    this.containerEl.appendChild(this.graphControlsEl);

    // create the control buttons
    this.appendGraphControlsItems(this.graphControlsEl.createDiv({ cls: "control-buttons" }));

    // add the filter settings
    this.appendSettingGroup(
      this.graphControlsEl,
      this.currentSetting.value.filter,
      "Filters",
      async (...args) => {
        this.filterSettingView = await FilterSettingsView(...args, this);
        return this.filterSettingView;
      }
    );

    // add the group settings
    this.appendSettingGroup(
      this.graphControlsEl,
      this.currentSetting.value.groups,
      "Groups",
      async (...args) => {
        this.groupSettingView = await GroupSettingsView(...args, this.graphView);
        return this.groupSettingView;
      }
    );

    // add the display settings
    this.appendSettingGroup(
      this.graphControlsEl,
      this.currentSetting.value,
      "Display",
      (...args) => {
        this.displaySettingView = DisplaySettingsView(...args, this);
        return this.displaySettingView;
      }
    );

    // add the utility settings
    this.appendSettingGroup(this.graphControlsEl, undefined, "Utils", (_, containerEl) =>
      UtilitySettingsView(containerEl, this.graphView)
    );

    // add the saved settings
    this.appendSettingGroup(this.graphControlsEl, undefined, "Saved settings", (_, containerEl) =>
      SavedSettingsView(containerEl, this.graphView)
    );

    this.toggleCollapsed(collapsed);

    // this will keep triggering search until at least it trigger once
    waitFor(() => {
      return this.triggerSearch();
    }, {});
  }

  /**
   * return the current setting. This is useful for saving the setting
   */
  public getCurrentSetting(): State<S>["value"] {
    return this.currentSetting.value;
  }

  public getGraphView() {
    return this.graphView;
  }

  triggerSearch() {
    // console.log(this.filterSettingView, this.groupSettingView);
    this.filterSettingView?.triggerSearch();
    this.groupSettingView?.triggerSearch();
    return Boolean(this.filterSettingView && this.groupSettingView);
  }

  private appendGraphControlsItems(containerEl: HTMLElement) {
    new ExtraButtonComponent(containerEl)
      .setIcon("refresh-cw")
      .setTooltip("Refresh")
      .onClick(() => {
        this.graphView.refreshGraph();
      });
    new ExtraButtonComponent(containerEl)
      .setIcon("eraser")
      .setTooltip("Clear setting")
      .onClick(() => this.resetSettings());
    new ExtraButtonComponent(containerEl)
      .setIcon("x")
      .setTooltip("Close")
      .onClick(() => {
        this.toggleCollapsed(true);
      });
  }

  // utility function to append a setting
  private appendSettingGroup<S>(
    containerEl: HTMLDivElement,
    setting: S,
    title: string,
    view: (setting: S, containerEl: HTMLElement) => void
  ) {
    const header = document.createElement("header");
    header.classList.add("graph-control-section-header");
    header.innerHTML = title;
    const item = new TreeItem(header, [(containerEl: HTMLElement) => view(setting, containerEl)]);
    item.render(containerEl);
  }

  /**
   * this will reset the settings to the default settings. This will reset the setting view.
   */
  public resetSettings() {
    // also clear all the search result
    this.searchResult.value.filter.files = [];
    this.searchResult.value.groups = [];

    // reset the current setting
    this.updateCurrentSettings((setting) => {
      // @ts-ignore
      setting.value =
        //
        PluginSettingManager.getNewSetting(this.graphView.graphType);
    });

    this.initNewView();
  }

  public applySettings(newSetting: SavedSetting["setting"]) {
    // clear an init the search result
    this.searchResult.value.filter.files = [];
    this.searchResult.value.groups = newSetting.groups.map((g) => ({
      files: [],
    }));
    this.updateCurrentSettings((setting) => {
      // @ts-ignore
      setting.value =
        //
        newSetting;
    });
    this.initNewView();
  }

  /**
   * this will update the current setting and return the updated setting
   */
  updateCurrentSettings(
    /**
     * user can directly update the setting
     */
    updateFunc: (setting: State<S>) => void,
    /**
     * you can use this to tell the graph view to update the graph view.
     * Set this to false when there are sequential update
     */
    shouldUpdateGraphView = true
  ) {
    updateFunc(this.currentSetting);

    // also update the plugin setting manager
    this.graphView.plugin.settingManager.updateSettings((setting) => {
      if (this.graphView.graphType === GraphType.local)
        setting.value.temporaryLocalGraphSetting = this.currentSetting.value as LocalGraphSettings;
      else
        setting.value.temporaryGlobalGraphSetting = this.currentSetting
          .value as GlobalGraphSettings;
    });

    if (shouldUpdateGraphView)
      // tell the graph to handle setting update
      // if path length is 0, then it means the whole setting is updated
      this.unpackStateChanges();

    return this.currentSetting.value;
  }

  /**
   * this will get all the changes in the state and unpack it to the graph view.
   * Then reset the state changes
   */
  private unpackStateChanges() {
    const changes = [...new Set(this.settingChanges.map((c) => c.currentPath as NestedKeyOf<S>))];
    // if it is replace the whole setting, then we will not unpack the changes
    // if (!changes.includes("") && !changes.includes("filter.searchQuery"))
    this.graphView.handleSettingUpdate(
      this.currentSetting.value,
      // remove duplicates
      // @ts-ignore
      ...changes
    );

    this.settingChanges = [];
  }

  protected onReady() {
    this.currentSetting.onChange((change) => this.settingChanges.push(change));
    this.searchResult.onChange((change) => {
      this.searchResultChanges.push(change);
      if (change.currentPath === "filter.files") {
        this.graphView.handleSearchResultChange();
      } else if (change.currentPath.startsWith("groups")) {
        this.graphView.handleGroupColorSearchResultChange();
      }
    });
  }
}
