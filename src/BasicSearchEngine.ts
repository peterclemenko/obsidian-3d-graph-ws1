import type { SearchConfig } from "@/Interfaces";
import { ActiveSearchEngine } from "@/Interfaces";
import type Graph3dPlugin from "@/main";
import type { TAbstractFile } from "obsidian";

export class BasicSearchEngine extends ActiveSearchEngine {
  private plugin: Graph3dPlugin;

  constructor(plugin: Graph3dPlugin) {
    super(false);
    this.plugin = plugin;
  }

  parseQueryToConfig(query: string): SearchConfig {
    throw new Error("Method not implemented.");
  }

  searchFiles(config: SearchConfig): TAbstractFile[] {
    // base on the json, filter the files
    throw new Error("Method not implemented.");
  }
}
