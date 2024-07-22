import { State } from "@/util/State";
import type { LocalGraphSettings } from "@/SettingsSchemas";
import { type LocalGraph3dView } from "@/views/graph/3dView/LocalGraph3dView";
import { GraphSettingManager } from "@/views/settings/graphSettingManagers/GraphSettingsManager";

export class LocalGraphSettingManager extends GraphSettingManager<
  LocalGraphSettings,
  LocalGraph3dView
> {
  protected currentSetting: State<LocalGraphSettings>;

  private constructor(parentView: LocalGraph3dView) {
    super(parentView);
    const pluginSetting = parentView.plugin.settingManager.getSettings();
    this.currentSetting = new State(pluginSetting.temporaryLocalGraphSetting);
  }

  static new(parentView: LocalGraph3dView) {
    const settingManager = new LocalGraphSettingManager(parentView);
    settingManager.onReady();
    return settingManager;
  }
}
