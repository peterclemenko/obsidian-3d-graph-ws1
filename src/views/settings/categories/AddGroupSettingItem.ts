import { ExtraButtonComponent } from "obsidian";
import { addColorPicker } from "@/views/atomics/addColorPicker";
import { addSearchInput } from "@/views/atomics/addSearchInput";
import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";
import { DefaultSearchEngine } from "@/PassiveSearchEngine";
import type { GroupSettings } from "@/SettingsSchemas";

/**
 * given a group and a container element,
 * create a group setting item inside the container element
 */
export const AddNodeGroupItem = async (
  newGroup: GroupSettings[number],
  containerEl: HTMLElement,
  view: BaseGraph3dView,
  /**
   * the index of this group
   */
  index: number,
  searchInputs: Awaited<ReturnType<typeof addSearchInput>>[]
) => {
  // This group must exist

  const groupEl = containerEl.createDiv({ cls: "graph-color-group" });

  const searchInput = await addSearchInput(
    groupEl,
    newGroup.query,
    (value) => {
      view.settingManager.updateCurrentSettings((setting) => {
        setting.value.groups[index]!.query = value;
      });
    },
    view
  );

  if (searchInput && view.plugin.fileManager.searchEngine instanceof DefaultSearchEngine) {
    searchInput.addMutationObserver((files) => {
      if (view.settingManager.searchResult.value.groups[index] === undefined)
        view.settingManager.searchResult.value.groups[index] = { files: [] };
      view.settingManager.searchResult.value.groups[index]!.files = files.map((file) => ({
        name: file.name,
        path: file.path,
      }));
    }, `Group ${index}`);
  }

  // add the search input to the searchInputs
  searchInputs.push(searchInput);

  addColorPicker(groupEl, newGroup.color, (value) => {
    view.settingManager.updateCurrentSettings((setting) => {
      // This group must exist
      setting.value.groups[index]!.color = value;
    });
  });

  new ExtraButtonComponent(groupEl)
    .setIcon("cross")
    .setTooltip("Delete Group")
    .onClick(() => {
      // remove itself from the UI
      groupEl.remove();

      // remove from setting
      view.settingManager.updateCurrentSettings((setting) => {
        setting.value.groups.splice(index, 1);
      });

      // remove from the search result
      view.settingManager.searchResult.value.groups.splice(index, 1);

      // remove the nodeGroupItem from the view
      searchInputs.splice(index, 1);
    });

  return {
    searchInput,
  };
};
