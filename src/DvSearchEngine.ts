import type { SearchConfig } from "@/Interfaces";
import { ActiveSearchEngine } from "@/Interfaces";
import type Graph3dPlugin from "@/main";
import { createNotice } from "@/util/createNotice";
import type { TAbstractFile } from "obsidian";
import { getAPI } from "obsidian-dataview";

export class DvSearchEngine extends ActiveSearchEngine {
  private plugin: Graph3dPlugin;
  constructor(plugin: Graph3dPlugin) {
    super(false);
    this.plugin = plugin;
  }

  checkDvEnabled() {
    const dv = getAPI(this.plugin.app);
    if (!dv) {
      createNotice(
        "Dataview is not enabled but you are using dataview search engine. Please update it in your plugin setting."
      );
      throw new Error("Dataview is not enabled");
    }
  }

  parseQueryToConfig(query: string): SearchConfig {
    this.checkDvEnabled();
    throw new Error("Method not implemented.");
  }

  searchFiles(config: SearchConfig): TAbstractFile[] {
    this.checkDvEnabled();
    throw new Error("Method not implemented.");
  }
}
