export const addTextInput = (
  containerEl: HTMLElement,
  value: string,
  onChange: (value: string) => void
) => {
  const inputEl = document.createElement("input");
  inputEl.value = value;
  inputEl.addEventListener("change", () => {
    onChange(inputEl.value);
  });
  containerEl.appendChild(inputEl);
};
