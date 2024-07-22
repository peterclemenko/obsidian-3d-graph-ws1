export const addPicker = (
  containerEl: HTMLElement,
  /**
   * the current value
   */
  value: string,
  /**
   * callback for when the value is changed
   */
  onChange: (value: string) => void
) => {
  const input = document.createElement("input");
  input.value = value;
  input.addEventListener("change", () => {
    onChange(input.value);
  });
  containerEl.appendChild(input);
};
