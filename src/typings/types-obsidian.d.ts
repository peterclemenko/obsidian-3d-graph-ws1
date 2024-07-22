/* eslint-disable @typescript-eslint/no-explicit-any */
import "obsidian";
import type { EphemeralState, SuggestModal, TFile, View, WorkspaceLeaf } from "obsidian";
import type { EmbeddedViewParent } from "@/views/leafView";

interface InternalPlugins {
  switcher: QuickSwitcherPlugin;
  "page-preview": InternalPlugin;
  graph: GraphPlugin;
  "global-search": GlobalSearchPlugin;
}

interface GlobalSearchPlugin extends Plugin {
  instance: {
    getGlobalSearchQuery: () => string;
    openGlobalSearch: (query: string) => void;
  };
}

interface OpenViewState {
  eState?: EphemeralState;
  state?: { mode: string };
  active?: boolean;
}

type SwitcherReturnType =
  | {
      downranked: boolean;
      file?: TFile;
      type: "file";
    }
  | undefined;
declare class QuickSwitcherModal extends SuggestModal<TFile> {
  getSuggestions(query: string): SwitcherReturnType[] | Promise<SwitcherReturnType[]>;

  renderSuggestion(value: TFile, el: HTMLElement): unknown;

  onChooseSuggestion(item: TFile, evt: MouseEvent | KeyboardEvent): unknown;
}

interface InternalPlugin {
  disable(): void;

  enable(): void;

  enabled: boolean;
  _loaded: boolean;
  instance: { name: string; id: string; [other: string]: any };
}

interface GraphPlugin extends InternalPlugin {
  views: { localgraph: (leaf: WorkspaceLeaf) => GraphView };
}

interface GraphView extends View {
  engine: typeof Object;
  renderer: { worker: { terminate(): void } };
}

interface QuickSwitcherPlugin extends InternalPlugin {
  instance: {
    name: string;
    id: string;
    QuickSwitcherModal: typeof QuickSwitcherModal;
  };
}

declare global {
  const i18next: {
    t(id: string): string;
  };

  interface Window {
    activeWindow: Window;
    activeDocument: Document;
  }
}

declare module "obsidian" {
  interface App {
    commands: {
      listCommands(): Command[];
      findCommand(id: string): Command;
      removeCommand(id: string): void;
      executeCommandById(id: string): void;
      commands: Record<string, Command>;
    };
    internalPlugins: {
      plugins: InternalPlugins;
      getPluginById<T extends keyof InternalPlugins>(id: T): InternalPlugins[T];
    };
    plugins: {
      manifests: Record<string, PluginManifest>;
      plugins: Record<string, Plugin> & {
        ["recent-files-obsidian"]: Plugin & {
          shouldAddFile(file: TFile): boolean;
        };
      };
      getPlugin(id: string): Plugin;
      getPlugin(id: "calendar"): CalendarPlugin;
    };
    dom: { appContainerEl: HTMLElement };
    viewRegistry: ViewRegistry;

    openWithDefaultApp(path: string): void;
  }

  interface ViewRegistry {
    typeByExtension: Record<string, string>; // file extensions to view types
    viewByType: Record<string, (leaf: WorkspaceLeaf) => View>; // file extensions to view types
  }

  interface CalendarPlugin {
    view: View;
  }

  interface WorkspaceParent {
    insertChild(index: number, child: WorkspaceItem, resize?: boolean): void;

    replaceChild(index: number, child: WorkspaceItem, resize?: boolean): void;

    removeChild(leaf: WorkspaceLeaf, resize?: boolean): void;

    containerEl: HTMLElement;
    children: any;
  }

  interface MarkdownView {
    file: TFile;
  }

  interface MarkdownEditView {
    editorEl: HTMLElement;
  }

  class MarkdownPreviewRendererStatic extends MarkdownPreviewRenderer {
    static registerDomEvents(
      el: HTMLElement,
      handlerInstance: unknown,
      cb: (el: HTMLElement) => unknown
    ): void;
  }

  interface WorkspaceLeaf {
    openLinkText(linkText: string, path: string, state?: unknown): Promise<void>;

    updateHeader(): void;

    containerEl: HTMLDivElement;
    working: boolean;
    parentSplit: WorkspaceParent;
    activeTime: number;
  }

  interface Workspace {
    recordHistory(leaf: WorkspaceLeaf, pushHistory: boolean): void;

    iterateLeaves(
      callback: (item: WorkspaceLeaf) => boolean | void,
      item: WorkspaceItem | WorkspaceItem[]
    ): boolean;

    iterateLeaves(
      item: WorkspaceItem | WorkspaceItem[],
      callback: (item: WorkspaceLeaf) => boolean | void
    ): boolean;

    getDropLocation(event: MouseEvent): {
      target: WorkspaceItem;
      sidedock: boolean;
    };

    recursiveGetTarget(event: MouseEvent, parent: WorkspaceParent): WorkspaceItem;

    recordMostRecentOpenedFile(file: TFile): void;

    onDragLeaf(event: MouseEvent, leaf: WorkspaceLeaf): void;

    onLayoutChange(): void; // tell Obsidian leaves have been added/removed/etc.
    activeLeafEvents(): void;

    floatingSplit: any;

    pushUndoHistory(leaf: WorkspaceLeaf, id: string, e: any): void;
  }

  interface Editor {
    getClickableTokenAt(pos: EditorPosition): {
      text: string;
      type: string;
      start: EditorPosition;
      end: EditorPosition;
    };
  }

  interface WorkspaceItem {
    side?: "left" | "right";
  }

  interface View {
    iconEl: HTMLElement;
    file: TFile;

    setMode(mode: MarkdownSubView): Promise<void>;

    followLinkUnderCursor(newLeaf: boolean): void;

    modes: Record<string, MarkdownSubView>;

    getMode(): string;

    headerEl: HTMLElement;
    contentEl: HTMLElement;
  }

  interface SearchView extends View {
    onKeyArrowRightInFocus(e: KeyboardEvent): void;

    onKeyArrowLeftInFocus(e: KeyboardEvent): void;

    onKeyArrowUpInFocus(e: KeyboardEvent): void;

    onKeyArrowDownInFocus(e: KeyboardEvent): void;

    onKeyEnterInFocus(e: KeyboardEvent): void;

    onKeyShowMoreBefore(e: KeyboardEvent): void;

    onKeyShowMoreAfter(e: KeyboardEvent): void;

    dom: any;
    searchComponent: SearchComponent;
    headerDom: any;
  }

  interface EmptyView extends View {
    actionListEl: HTMLElement;
    emptyTitleEl: HTMLElement;
  }

  interface FileManager {
    createNewMarkdownFile(folder: TFolder, fileName: string): Promise<TFile>;
  }

  enum PopoverState {
    Showing,
    Shown,
    Hiding,
    Hidden,
  }

  interface Menu {
    items: MenuItem[];
    dom: HTMLElement;
    hideCallback: () => unknown;
  }

  interface MenuItem {
    iconEl: HTMLElement;
    dom: HTMLElement;
  }

  interface EphemeralState {
    focus?: boolean;
    subpath?: string;
    line?: number;
    startLoc?: Loc;
    endLoc?: Loc;
    scroll?: number;
  }

  interface HoverParent {
    type?: string;
  }

  interface WorkspaceContainer {
    type: "window" | "split" | "tab";
  }

  interface HoverPopover {
    parent: EmbeddedViewParent | null;
    targetEl: HTMLElement;
    hoverEl: HTMLElement;

    position(pos?: MousePos): void;

    hide(): void;

    show(): void;

    shouldShowSelf(): boolean;

    timer: number;
    waitTime: number;

    shouldShow(): boolean;

    transition(): void;
  }

  interface MousePos {
    x: number;
    y: number;
  }

  interface Plugin {
    registerGlobalCommand(command: Command): void;
  }
}
