import { ActiveSearchEngine } from "@/Interfaces";
import type { BaseGraph3dView } from "@/views/graph/3dView/Graph3dView";
import { spawnLeafView } from "@/views/leafView";
import type { SearchView, TAbstractFile } from "obsidian";
import { TextComponent } from "obsidian";

/**
 * depends on the search engine, this might be a normal text input or a built-in search input
 *
 * @remarks
 * the search input doesn't perform the search, it only display the input
 */
export const addSearchInput = async (
  containerEl: HTMLElement,
  /**
   * the current value
   */
  value: string,
  /**
   * callback for when the value is changed.
   *
   * When the input is changed, the will use the search engine to parse and look for the files
   *
   * @param value the new value
   * @param files the files that match the query
   */
  onChange: (value: string) => void,
  view: BaseGraph3dView
) => {
  const searchEl = containerEl.createDiv({
    // cls :
  });
  if (!view.plugin.fileManager.searchEngine.useBuiltInSearchInput) {
    const text = new TextComponent(searchEl).setValue(value).onChange((value) => {
      onChange(value);
    });

    text.inputEl.parentElement?.addClasses([
      "search-input-container",
      "global-search-input-container",
    ]);
    return;
  }

  const [searchLeaf] = spawnLeafView(view.plugin, searchEl);

  await searchLeaf.setViewState({
    type: "search",
  });

  // add searchEl to containerEl
  containerEl.appendChild(searchEl);

  const searchElement = searchLeaf.containerEl.querySelector(
    ".workspace-leaf-content[data-type='search']"
  ) as HTMLDivElement;
  // element.style.removeProperty("overflow");
  const searchRowEl = searchElement.querySelector(".search-row") as HTMLDivElement;
  const searchResultContainerEl = searchElement.querySelector(
    ".search-result-container"
  ) as HTMLDivElement;
  const searchResultInfoEl = searchElement.querySelector(".search-results-info") as HTMLDivElement;
  const extraSettingButtonEl = searchRowEl.querySelector(
    ".setting-editor-extra-setting-button"
  ) as HTMLDivElement;
  extraSettingButtonEl?.remove();
  searchResultContainerEl.style.visibility = "hidden";
  searchResultContainerEl.style.height = "0px";
  searchResultContainerEl.style.position = "absolute";
  searchResultInfoEl.style.visibility = "hidden";
  searchResultInfoEl.style.height = "0px";
  searchResultInfoEl.style.position = "absolute";
  searchRowEl.style.margin = "0px";
  // move the element to the containerEl
  containerEl.appendChild(searchRowEl);
  const inputEl = searchRowEl.getElementsByTagName("input")[0]!;
  const settingIconEl = searchRowEl.querySelector(
    ".clickable-icon[aria-label='Search settings']"
  ) as HTMLDivElement;
  const matchCaseIconEl = searchRowEl.querySelector(
    "div.search-input-container > div[aria-label='Match case'] "
  ) as HTMLDivElement;
  const clearButtonEl = searchRowEl.querySelector(".search-input-clear-button") as HTMLDivElement;
  settingIconEl?.remove();
  matchCaseIconEl?.remove();
  inputEl.value = value;
  inputEl.oninput = async (e: Event<HTMLInputElement>) => {
    // @ts-ignore
    onChange(e.currentTarget?.value);
  };

  clearButtonEl.onclick = () => {
    // if inputEl has is-loading, then do nothing
    // if (inputEl.classList.contains("is-loading")) return;
    onChange("");
  };

  // this make search that the search result container el is alaways visible
  if (view.itemView) view.itemView.containerEl.appendChild(searchResultContainerEl);

  // if it is a passive engine, we need to enable mutation observer

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addMutationObserver = (callback: (files: TAbstractFile[]) => void, data?: any) => {
    if (view.plugin.fileManager.searchEngine instanceof ActiveSearchEngine)
      throw new Error(
        "you don't need mutation observer for active search engine, this function should not be called"
      );

    view.plugin.fileManager.searchEngine.addMutationObserver(
      searchResultContainerEl,
      searchLeaf.view as SearchView,
      callback,
      data
    );
  };

  // debug
  // const observer = new MutationObserver(async (mutations) => {
  //   // if the search result is loading or the cache is not ready, then we know that the search must not be ready yet
  //   if (!view.plugin.cacheIsReady) return;
  //   //  disable this because seem like this will cause a bug of some group not updating color
  //   // if (searchResultContainerEl.classList.contains("is-loading")) return;

  //   const files = getFilesFromSearchResult(
  //     await getResultFromSearchView(searchLeaf.view as SearchView)
  //   );

  //   console.log(files);
  // });

  // observer.observe(searchResultContainerEl, {
  //   childList: true,
  //   subtree: true,
  // });

  const triggerSearch = () => {
    // if the input is empty, return
    if (inputEl.value === "") return;

    inputEl.dispatchEvent(
      new KeyboardEvent("keypress", {
        key: "Enter",
      })
    );
  };

  return { searchRowEl, addMutationObserver, triggerSearch };
};
