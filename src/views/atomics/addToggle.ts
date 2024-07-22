import { Setting } from "obsidian";

export const addToggle = (
  containerEl: HTMLElement,
  options: {
    name: string;
    /**
     * the current value
     */
    value: boolean;
  },
  /**
   * callback for when the value is changed
   */
  onChange: (value: boolean) => void
) => {
  const settings = new Setting(containerEl).setName(options.name).addToggle((toggle) => {
    return toggle.setValue(options.value).onChange(async (value) => {
      onChange(value);
    });
  });
  return settings;
};
