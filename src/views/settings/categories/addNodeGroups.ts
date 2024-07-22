import { AddNodeGroupItem } from "@/views/settings/categories/AddGroupSettingItem";
import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";
import type { addSearchInput } from "@/views/atomics/addSearchInput";
import type { GroupSettings } from "@/SettingsSchemas";

export const addNodeGroups = async (
  groupSettings: GroupSettings,
  containerEl: HTMLElement,
  view: BaseGraph3dView,
  nodeGroups: Awaited<ReturnType<typeof addSearchInput>>[]
) => {
  containerEl.querySelector(".node-group-container")?.remove();
  const nodeGroupContainerEl = containerEl.createDiv({
    cls: "graph-color-groups-container",
  });
  groupSettings.forEach(async (group, index) => {
    await AddNodeGroupItem(group, nodeGroupContainerEl, view, index, nodeGroups);
  });
};
