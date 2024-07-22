import type { App, TFile } from "obsidian";
import type Graph3dPlugin from "@/main";
import type { QuickSwitcherPlugin } from "@/typings/types-obsidian";
import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";

export const getMySwitcher = (view: BaseGraph3dView) => {
  const switcherInstance = (view.plugin.app.internalPlugins.plugins.switcher as QuickSwitcherPlugin)
    .instance;
  const QuickSwitcherModal = switcherInstance?.QuickSwitcherModal;
  if (!QuickSwitcherModal) return;
  // you need the options to open quick switcher, https://github.com/darlal/obsidian-switcher-plus/blob/2a1a8ccb0ca955397aa7516b746853427f5483ec/src/settings/switcherPlusSettings.ts#L132-L134
  const MySwitcher = class extends QuickSwitcherModal {
    constructor(app: App, public plugin: Graph3dPlugin) {
      // @ts-ignore
      super(app, switcherInstance.options);
    }

    async getSuggestions(query: string) {
      const suggestions = await super.getSuggestions(query);
      const allFilePaths = view
        .getForceGraph()
        ?.instance.graphData()
        .nodes.map((n) => n.path);
      return suggestions.filter(Boolean).filter((s) => {
        // only show files in this view
        return s.file ? allFilePaths?.includes(s.file.path) : false;
      });
    }

    // @ts-ignore
    onChooseSuggestion(item: { file: TFile }, evt: MouseEvent | KeyboardEvent) {
      view.getForceGraph()?.interactionManager.searchNode(item.file.path);
    }
  };
  return MySwitcher;
};
