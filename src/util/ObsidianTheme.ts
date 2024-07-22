// function getColorFromStylesheet(selector: string, property: string): string | null {
//   try {
//     for (const sheet of Array.from(document.styleSheets)) {
//       const rules = sheet.cssRules ? Array.from(sheet.cssRules) : [];

//       for (const rule of rules) {
//         if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
//           return rule.style.getPropertyValue(property);
//         }
//       }
//     }
//   } catch (e) {
//     console.error("Error accessing stylesheets: ", e);
//   }
//   return null; // Return null if not found
// }

// Helper to access the current theme in TS
export class ObsidianTheme {
  backgroundPrimary: string;
  backgroundPrimaryAlt: string;
  backgroundSecondary: string;
  backgroundSecondaryAlt: string;

  backgroundModifierBorder: string;
  backgroundModifierSuccess: string;
  backgroundModifierError: string;

  colorAccent: string;
  interactiveAccentHover: string;

  textNormal: string;
  textMuted: string;
  textFaint: string;

  textAccent: string;

  graphNode: string;
  graphLine: string;

  // some others missing, but not needed currently

  constructor(root: HTMLElement) {
    this.backgroundPrimary = getComputedStyle(root).getPropertyValue("--background-primary").trim();
    this.backgroundPrimaryAlt = getComputedStyle(root)
      .getPropertyValue("--background-primary-alt")
      .trim();
    this.backgroundSecondary = getComputedStyle(root)
      .getPropertyValue("--background-secondary")
      .trim();
    this.backgroundSecondaryAlt = getComputedStyle(root)
      .getPropertyValue("--background-secondary-alt")
      .trim();

    this.backgroundModifierBorder = getComputedStyle(root)
      .getPropertyValue("--background-modifier-border")
      .trim();
    this.backgroundModifierSuccess = getComputedStyle(root)
      .getPropertyValue("--background-modifier-success")
      .trim();
    this.backgroundModifierError = getComputedStyle(root)
      .getPropertyValue("--background-modifier-error")
      .trim();

    this.colorAccent = getComputedStyle(root).getPropertyValue("--color-accent").trim();

    this.textNormal = getComputedStyle(root).getPropertyValue("--text-normal").trim();
    this.textMuted = getComputedStyle(root).getPropertyValue("--text-muted").trim();
    this.textFaint = getComputedStyle(root).getPropertyValue("--text-faint").trim();

    this.textAccent = getComputedStyle(root).getPropertyValue("--text-accent").trim();
    this.interactiveAccentHover = getComputedStyle(root)
      .getPropertyValue("--interactive-accent-hover")
      .trim();

    this.graphNode = getComputedStyle(root).getPropertyValue("--graph-node").trim();
    this.graphLine = getComputedStyle(root).getPropertyValue("--graph-line").trim();
  }
}
