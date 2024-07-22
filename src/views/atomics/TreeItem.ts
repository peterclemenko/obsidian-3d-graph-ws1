export type HtmlBuilder = (containerEl: HTMLElement) => void | PromiseLike<void>;

export class TreeItem {
  private readonly $inner: HTMLElement;
  private readonly childrenBuilders: HtmlBuilder[];
  private $treeItem: HTMLDivElement;
  private $self: HTMLDivElement;
  private $innerWrapper: HTMLDivElement;

  constructor($inner: HTMLElement, children: HtmlBuilder[]) {
    this.$inner = $inner;
    this.childrenBuilders = children;
    this.$treeItem = document.createElement("div");
    this.toggleCollapse(true);
    this.$self = document.createElement("div");
    this.$innerWrapper = document.createElement("div");
  }

  async render(containerEl: HTMLElement) {
    this.$treeItem.classList.add("graph-control-section", "tree-item");

    this.$self.classList.add("tree-item-self");
    this.$self.addEventListener("click", () => {
      this.toggleCollapse();
    });

    this.$innerWrapper.classList.add("tree-item-inner");
    this.$innerWrapper.appendChild(this.$inner);
    this.$self.appendChild(this.$innerWrapper);
    this.$treeItem.appendChild(this.$self);
    containerEl.appendChild(this.$treeItem);

    await this.renderChildren();
  }

  private async renderChildren() {
    const $children = document.createElement("div");
    $children.classList.add("tree-item-children");
    this.$treeItem.appendChild($children);

    const promises = this.childrenBuilders.map((build: HtmlBuilder) => build($children));
    await Promise.all(promises);
  }

  private toggleCollapse(doCollapse?: boolean) {
    if (doCollapse === undefined) {
      doCollapse = !this.$treeItem.classList.contains("is-collapsed");
    }
    this.$treeItem.classList.toggle("is-collapsed", doCollapse);
  }
}
