import { State } from "@/util/State";
import type { GlobalGraphSettings } from "@/SettingsSchemas";
import type { GlobalGraph3dView } from "@/views/graph/3dView/GlobalGraph3dView";
import { GraphSettingManager } from "@/views/settings/graphSettingManagers/GraphSettingsManager";

export class GlobalGraphSettingManager extends GraphSettingManager<
  GlobalGraphSettings,
  GlobalGraph3dView
> {
  protected currentSetting: State<GlobalGraphSettings>;

  private constructor(parentView: GlobalGraph3dView) {
    super(parentView);
    this.currentSetting = new State(
      parentView.plugin.settingManager.getSettings().temporaryGlobalGraphSetting
    );
  }

  static new(parentView: GlobalGraph3dView) {
    const settingManager = new GlobalGraphSettingManager(parentView);
    settingManager.onReady();
    return settingManager;
  }
}
