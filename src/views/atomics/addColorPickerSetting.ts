import { addColorPicker } from "@/views/atomics/addColorPicker";
import { Setting } from "obsidian";

export const addColorPickerSetting = (
  containerEl: HTMLElement,
  options: {
    name: string;
    /**
     * the current color
     */
    value: string;
  },
  /**
   * callback for when the color is changed
   */
  onChange: (value: string) => void
) => {
  const setting = new Setting(containerEl).setName(options.name).setClass("mod-color-picker");
  addColorPicker(setting.settingEl, options.value, (value) => onChange(value));
};
