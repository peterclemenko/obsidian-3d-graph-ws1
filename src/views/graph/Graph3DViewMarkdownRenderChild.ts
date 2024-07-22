import type Graph3dPlugin from "@/main";
import { PostProcessorGraph3dView } from "@/views/graph/3dView/PostProcessorGraph3dView";
import type { MarkdownPostProcessorContext, MarkdownView } from "obsidian";
import { MarkdownRenderChild } from "obsidian";

export class Graph3DViewMarkdownRenderChild extends MarkdownRenderChild {
  plugin: Graph3dPlugin;
  source: string;
  ctx: MarkdownPostProcessorContext;
  markdownView: MarkdownView;

  // Add a property for the ResizeObserver
  resizeObserver: ResizeObserver;

  graph3dView: PostProcessorGraph3dView;

  constructor(
    contentEl: HTMLElement,
    plugin: Graph3dPlugin,
    source: string,
    ctx: MarkdownPostProcessorContext,
    markdownView: MarkdownView
  ) {
    super(contentEl);
    this.plugin = plugin;
    this.source = source;
    this.ctx = ctx;
    this.markdownView = markdownView;

    // Initialize the ResizeObserver to call the onResize method
    this.resizeObserver = new ResizeObserver((entries) => {
      // For this example, we're only observing the first entry (contentEl)
      this.onResize(entries[0]!);
    });

    // Start observing the content element
    this.resizeObserver.observe(contentEl);

    this.graph3dView = PostProcessorGraph3dView.new(
      this.plugin,
      this.containerEl,
      this.markdownView,
      this
    );
  }

  onload(): void {
    super.onload();
    this.plugin.activeGraphViews.push(this.graph3dView);
  }

  onunload(): void {
    super.unload();
    // the unload is called when the markdown view doesn't exist anymore
    // change to another file doesn't count
    // close the file count
    // console.log("unload");
    this.resizeObserver.disconnect();
    // destroy the graph and remove from the active graph views
    this.graph3dView.getForceGraph().instance._destructor();
    this.plugin.activeGraphViews = this.plugin.activeGraphViews.filter(
      (view) => view !== this.graph3dView
    );
  }

  // The method to be called when contentEl is resized
  onResize(entry: ResizeObserverEntry): void {
    // You can access the new dimensions of contentEl like this:
    const { width } = entry.contentRect;

    // Perform any actions you need on resize here
    this.graph3dView.getForceGraph().updateDimensions([width, 300]);

    // If you need to redraw or adjust anything related to the plugin or content,
    // this is where you'd do it.
  }
}
