import { ButtonComponent } from "obsidian";
import { AddNodeGroupItem } from "@/views/settings/categories/AddGroupSettingItem";
import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";
import type { addSearchInput } from "@/views/atomics/addSearchInput";

const getRandomColor = () => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

export const addNodeGroupButton = (
  containerEl: HTMLElement,
  view: BaseGraph3dView,
  searchInputs: Awaited<ReturnType<typeof addSearchInput>>[]
) => {
  // make sure there is only one button
  containerEl.querySelector(".graph-color-button-container")?.remove();

  const buttonContainerEl = containerEl.createDiv({
    cls: "graph-color-button-container",
  });

  const nodeGroupButton: { groupItems: Awaited<ReturnType<typeof AddNodeGroupItem>>[] } = {
    groupItems: [],
  };

  new ButtonComponent(buttonContainerEl)
    .setClass("mod-cta")
    .setButtonText("Add Group")
    .onClick(async () => {
      const newGroup = {
        query: "",
        color: getRandomColor(),
      };
      // add a group to group settings
      view.settingManager.updateCurrentSettings((setting) => {
        setting.value.groups.push(newGroup);
        // add a group to UI as well, add it in the containerEl before the button container el
      });

      // we need to get the latest current setting so that index will be correct
      const index = view.settingManager.getCurrentSetting().groups.length - 1;
      // add a group to search result as well
      view.settingManager.searchResult.value.groups[index] = {
        files: [],
      };
      await AddNodeGroupItem(newGroup, containerEl, view, index, searchInputs);
      containerEl.append(buttonContainerEl);
    });
  return nodeGroupButton;
};
