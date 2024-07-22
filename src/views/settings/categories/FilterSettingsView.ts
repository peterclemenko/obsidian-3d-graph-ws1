import { Setting } from "obsidian";
import { addSearchInput } from "@/views/atomics/addSearchInput";
import type { BaseGraphSettingManager } from "@/views/settings/graphSettingManagers/GraphSettingsManager";
import type { State } from "@/util/State";
import { waitForStable } from "@/util/waitFor";
import { DefaultSearchEngine } from "@/PassiveSearchEngine";
import type { BaseFilterSettings, LocalFilterSetting, LocalGraphSettings } from "@/SettingsSchemas";
import { GraphType } from "@/SettingsSchemas";

export const FilterSettingsView = async (
  filterSettings: BaseFilterSettings | LocalFilterSetting,
  containerEl: HTMLElement,
  settingManager: BaseGraphSettingManager
) => {
  const graphView = settingManager.getGraphView();
  const searchInput = await addSearchInput(
    containerEl,
    filterSettings.searchQuery,
    (value) => {
      //update the current setting of the plugin
      settingManager.updateCurrentSettings((setting) => {
        setting.value.filter.searchQuery = value;
      });
    },
    graphView
  );

  // if this is a built-in search input, then we need to add a mutation observer
  if (
    searchInput &&
    settingManager.getGraphView().plugin.fileManager.searchEngine instanceof DefaultSearchEngine
  )
    searchInput.addMutationObserver((files) => {
      // the files is empty, by default, we will show all files
      settingManager.searchResult.value.filter.files = files.map((file) => ({
        name: file.name,
        path: file.path,
      }));
    });

  // add show attachments setting
  new Setting(containerEl).setName("Show attachments").addToggle((toggle) => {
    toggle.setValue(filterSettings.showAttachments || false).onChange(async (value) => {
      settingManager.updateCurrentSettings((setting) => {
        setting.value.filter.showAttachments = value;
      });
    });
  });

  // add show orphans setting
  new Setting(containerEl).setName("Show orphans").addToggle((toggle) => {
    toggle.setValue(filterSettings.showOrphans || false).onChange(async (value) => {
      settingManager.updateCurrentSettings((setting) => {
        setting.value.filter.showOrphans = value;
      });
    });
  });

  if (graphView.graphType === GraphType.local) {
    const localFilterSettings = filterSettings as LocalFilterSetting;
    let latestValue = localFilterSettings.depth;
    let activeCallId = 0; // Unique identifier for each call

    //  add a slider for the depth
    new Setting(containerEl).setName("Depth").addSlider((slider) => {
      slider
        .setLimits(1, 5, 1)
        .setValue(localFilterSettings.depth)
        .setDynamicTooltip()
        .onChange((value) => {
          latestValue = value;
          const currentCallId = ++activeCallId; // Increment and store the unique ID for this call

          waitForStable(() => latestValue, {
            timeout: 3000, // wait for a max of 3 seconds for stability
            minDelay: 300, // start checking after 300ms
            interval: 100, // check every 100ms
            rehitCount: 3, // require 3 consecutive checks with the same value
          }).then((stableValue) => {
            if (stableValue !== undefined && currentCallId === activeCallId) {
              // Only proceed if this is the latest call
              settingManager.updateCurrentSettings((setting: State<LocalGraphSettings>) => {
                setting.value.filter.depth = stableValue;
              });
            }
          });
        });
    });

    // add dropdown show incoming links setting
    new Setting(containerEl).setName("Show Incoming Links").addDropdown((dropdown) => {
      dropdown
        .addOptions({
          both: "Both",
          inlinks: "Inlinks",
          outlinks: "Outlinks",
        })
        .setValue(localFilterSettings.linkType)
        .onChange(async (value: "both" | "inlinks" | "outlinks") => {
          // update the setting
          settingManager.updateCurrentSettings((setting: State<LocalGraphSettings>) => {
            setting.value.filter.linkType = value;
            // we are putting false here because we know there are still some more to update
          });
        });
    });
  }
  const triggerSearch = async () => {
    searchInput?.triggerSearch();
  };

  return {
    searchInput,
    triggerSearch,
  };
};
