import type { State } from "@/util/State";
import type { SearchView, TAbstractFile } from "obsidian";

/**
 * the config object of the search engine
 */
export type SearchConfig = {
  /**
   * the file name
   */
  file: string;
  path: string;
  extension: string;
  tag: string;
};

export interface ISettingManager<SettingType = unknown> {
  /**
   * save settings
   */
  saveSettings(): Promise<void>;

  /**
   * update the settings of the plugin. The updateFunc will be called with the current settings as the argument
   * @returns the updated settings
   */
  updateSettings(updateFunc: (setting: State<SettingType>) => void): SettingType;

  /**
   * get the settings of the plugin
   */
  getSettings(): SettingType;

  /**
   * return the settings of the plugin
   */
  loadSettings(): Promise<SettingType>;
}

abstract class SearchEngine {
  readonly useBuiltInSearchInput: boolean;

  constructor(useBuiltInSearchInput: boolean) {
    this.useBuiltInSearchInput = useBuiltInSearchInput;
  }
}

export abstract class ActiveSearchEngine extends SearchEngine {
  /**
   * parse the query to config
   */
  abstract parseQueryToConfig(query: string): SearchConfig;
  /**
   * search for files
   */
  abstract searchFiles(config: SearchConfig): TAbstractFile[];
}

/**
 *  a passive search engine is not responsible for searching files, but it will listen to the change of the search result container and return the files
 */
export abstract class PassiveSearchEngine extends SearchEngine {
  abstract addMutationObserver(
    searchResultContainerEl: HTMLDivElement,
    view: SearchView,
    mutationCallback: (files: TAbstractFile[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any
  ): void;
}

export interface IFileManager {
  /**
   * get all the files in the vault
   */
  getFiles(): void;

  /**
   * get all the markdown files in the vault
   */
  getMarkdownFiles(): void;

  /**
   * get all files and folders in the vault
   */
  getAllFilesAndFolders(): void;

  /**
   * given a query, search for files
   */
  searchFiles(query: string): TAbstractFile[];
}
