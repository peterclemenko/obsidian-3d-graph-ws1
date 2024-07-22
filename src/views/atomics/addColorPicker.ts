/**
 * append a color picker to the container element
 */
export const addColorPicker = (
  containerEl: HTMLElement,
  /**
   * the current color, must be hex format
   */
  value: string,
  /**
   * callback for when the color is changed
   */
  onChange: (value: string) => void
) => {
  const input = document.createElement("input");
  input.type = "color";
  input.value = value;
  input.addEventListener("input", () => {
    onChange(input.value);
  });
  containerEl.appendChild(input);
};
