import { BasicSearchEngine } from "@/BasicSearchEngine";
import { DvSearchEngine } from "@/DvSearchEngine";
import type { IFileManager, PassiveSearchEngine } from "@/Interfaces";
import { ActiveSearchEngine } from "@/Interfaces";
import { DefaultSearchEngine as DefaultSearchEngine } from "@/PassiveSearchEngine";
import { SearchEngineType } from "@/SettingsSchemas";
import type Graph3dPlugin from "@/main";

/**
 * this class will handle the active searching of a graph view.
 */
export class MyFileManager implements IFileManager {
  private plugin: Graph3dPlugin;

  private _searchEngine: ActiveSearchEngine | PassiveSearchEngine;

  constructor(plugin: Graph3dPlugin) {
    this.plugin = plugin;
    this._searchEngine = this._setSearchEngine();
  }

  /**
   * @internal
   */
  private _setSearchEngine() {
    const getSearchEngine = (searchEngine: SearchEngineType, plugin: Graph3dPlugin) => {
      if (searchEngine === SearchEngineType.default) return new DefaultSearchEngine(plugin);
      else if (searchEngine === SearchEngineType.dataview) return new DvSearchEngine(plugin);
      else return new BasicSearchEngine(plugin);
    };
    return getSearchEngine(
      this.plugin.settingManager.getSettings().pluginSetting.searchEngine,
      this.plugin
    );
  }

  get searchEngine() {
    return this._searchEngine;
  }

  setSearchEngine() {
    this._searchEngine = this._setSearchEngine();
  }

  getFiles() {
    return this.plugin.app.vault.getFiles();
  }
  getMarkdownFiles() {
    return this.plugin.app.vault.getMarkdownFiles();
  }
  getAllFilesAndFolders() {
    return this.plugin.app.vault.getAllLoadedFiles();
  }
  searchFiles(query: string) {
    // check whether it is active search engine
    if (this._searchEngine instanceof ActiveSearchEngine) {
      return this._searchEngine.searchFiles(this._searchEngine.parseQueryToConfig(query));
    }
    throw new Error("passive search engine cannot search files");
  }
}
