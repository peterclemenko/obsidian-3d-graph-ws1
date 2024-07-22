import type { PassiveSearchEngine } from "@/Interfaces";
import type Graph3dPlugin from "@/main";
import { AsyncQueue } from "@/util/AsyncQueue";
import { waitForStable } from "@/util/waitFor";
import type { SearchView, TAbstractFile, TFile } from "obsidian";

export type SearchResultFile = ReturnType<typeof getFilesFromSearchResult>[0];

/**
 * given the result from `getResultFromSearchView`, return the files
 */
export const getFilesFromSearchResult = (rawSearchResult: unknown) => {
  // @ts-ignore
  return Array.from(rawSearchResult.keys()) as TFile[];
};

export const getResultFromSearchView = async (searchView: SearchView) => {
  await waitForStable(() => {
    return searchView.dom.resultDomLookup.size;
  }, {});
  return searchView.dom.resultDomLookup;
};

/**
 * this is the built in search engine that uses the obsidian search engine
 */
export class DefaultSearchEngine implements PassiveSearchEngine {
  useBuiltInSearchInput = true;
  plugin: Graph3dPlugin;

  constructor(plugin: Graph3dPlugin) {
    this.plugin = plugin;
  }

  /**
   * given a search result container element, add a mutation observer to it
   */
  addMutationObserver(
    searchResultContainerEl: HTMLDivElement,
    view: SearchView,
    mutationCallback: (files: TAbstractFile[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any
  ) {
    let files: TAbstractFile[] = [];
    const asyncQueue = new AsyncQueue();

    const observer = new MutationObserver(async (mutations) => {
      // if the search result is loading or the cache is not ready, then we know that the search must not be ready yet
      if (!this.plugin.cacheIsReady) return;

      //  disable this because seem like this will cause a bug of some group not updating color
      // if (searchResultContainerEl.classList.contains("is-loading")) return;

      files = getFilesFromSearchResult(await getResultFromSearchView(view));

      // if the async queue is empty, add a task to it
      if (asyncQueue.queue.length === 0)
        asyncQueue.push(async () => {
          await waitForStable(
            () => {
              return files.length;
            },
            {
              timeout: 3000,
              minDelay: 200,
              interval: 100,
            }
          );
          mutationCallback(files);
        });
    });
    observer.observe(searchResultContainerEl, {
      childList: true,
      subtree: true,
    });
  }
}
