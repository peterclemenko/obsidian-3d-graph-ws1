import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { Node } from "@/graph/Node";
import type { BaseForceGraph } from "@/views/graph/ForceGraph";
import type { Link } from "@/graph/Link";
import { CommandModal } from "@/commands/CommandModal";
import { CommandClickNodeAction, GraphType } from "@/SettingsSchemas";
import { createNotice } from "@/util/createNotice";
import { hexToRGBA } from "@/util/hexToRGBA";
import type { TFile } from "obsidian";

const origin = new THREE.Vector3(0, 0, 0);
const cameraLookAtCenterTransitionDuration = 1000;
const LINK_PARTICLE_MULTIPLIER = 2;
export const FOCAL_FROM_CAMERA = 400;
const selectedColor = "#CCA700";
const PARTICLE_FREQUECY = 4;
const LINK_ARROW_WIDTH_MULTIPLIER = 5;

/**
 * this instance handle all the interaction. In other words, the interaction manager
 */
export class ForceGraphEngine {
  private forceGraph: BaseForceGraph;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tween: { [tweenId: string]: TWEEN.Tween<any> | undefined } = {};
  private spaceDown = false;
  private commandDown = false;
  private selectedNodes = new Set<Node>();
  /**
   * the node connected to the hover node
   */
  public readonly highlightedNodes: Set<string> = new Set();
  /**
   * the links connected to the hover node
   */
  public readonly highlightedLinks: Set<Link> = new Set();
  hoveredNode: Node | null = null;

  // zooming
  private isZooming = false;
  private startZoomTimeout: Timer | undefined;
  private endZoomTimeout: Timer | undefined;

  constructor(forceGraph: BaseForceGraph) {
    this.forceGraph = forceGraph;
    this.initListeners();
  }

  onZoom(event: WheelEvent) {
    const camera = this.forceGraph.instance.camera() as THREE.PerspectiveCamera;
    // check if it is start zooming using setTimeout
    // if it is, then cancel the animation
    if (!this.isZooming && !this.startZoomTimeout) {
      this.startZoomTimeout = setTimeout(() => {
        // console.log("this should only show once");
        if (!this.isZooming) {
          clearTimeout(this.startZoomTimeout);
          this.startZoomTimeout = undefined;
          this.isZooming = true;
          this.onZoomStart();
        }
        return;
      }, 100);
    }

    const distanceToCenter = camera.position.distanceTo(origin);
    camera.updateProjectionMatrix();
    this.forceGraph.centerCoordinates.setLength(distanceToCenter / 10);

    if (this.isZooming) {
      clearTimeout(this.endZoomTimeout);
      this.endZoomTimeout = setTimeout(() => {
        this.endZoomTimeout = undefined;
        this.isZooming = false;
        this.onZoomEnd();
      }, 100);
    }
  }

  private onZoomEnd() {}

  private onZoomStart = () => {
    const tweens = Object.keys(this.tween);
    if (tweens) {
      Object.values(this.tween).forEach((tween) => {
        if (tween) {
          tween.stop();
        }
      });
      // remove the tween
      this.tween = {};
    }
  };

  onNodeDrag = (node: Node & Coords, translate: Coords) => {
    // https://github.com/vasturiano/3d-force-graph/issues/279#issuecomment-587135032
    if (this.forceGraph.view.settingManager.getCurrentSetting().display.dontMoveWhenDrag)
      this.forceGraph.instance.cooldownTicks(0);
    if (this.selectedNodes.has(node)) {
      // moving a selected node
      [...this.selectedNodes]
        .filter((selNode) => selNode !== node) // don't touch node being dragged
        .forEach((node) =>
          ["x", "y", "z"].forEach(
            // @ts-ignore
            (coord) => (node[`f${coord}`] = node[coord] + translate[coord])
          )
        ); // translate other nodes by same amount
    }
  };

  onNodeDragEnd = (node: Node & Coords) => {
    const setting = this.forceGraph.view.settingManager.getCurrentSetting();
    // https://github.com/vasturiano/3d-force-graph/issues/279#issuecomment-587135032
    if (setting.display.dontMoveWhenDrag) this.forceGraph.instance.cooldownTicks(Infinity);
    if (this.selectedNodes.has(node)) {
      // finished moving a selected node
      [...this.selectedNodes]
        .filter((selNode) => selNode !== node) // don't touch node being dragged
        // @ts-ignore
        .forEach((node) => ["x", "y", "z"].forEach((coord) => (node[`f${coord}`] = undefined))); // unfix controlled nodes
    }
  };

  onNodeRightClick = (node: Node & Coords, event: MouseEvent) => {
    const plugin = this.forceGraph.view.plugin;
    const pluginSetting = plugin.settingManager.getSettings().pluginSetting;
    if (this.commandDown || event.ctrlKey) {
      const clickedNodeFile = this.findFileByNode(node);
      if (
        pluginSetting.commandRightClickNode === CommandClickNodeAction.openNodeInNewTab &&
        clickedNodeFile
      ) {
        // open file in new tab
        this.openFileInNewTab(clickedNodeFile);
      } else if (pluginSetting.commandRightClickNode === CommandClickNodeAction.focusNode)
        this.focusOnCoords(node);
      return;
    }

    // open context menu
    if (!this.selectedNodes.has(node)) {
      this.selectedNodes.clear();
      this.selectedNodes.add(node);
    }
    //   show a modal
    const modal = new CommandModal(this.forceGraph.view, this.selectedNodes);
    const promptEl = modal.containerEl.querySelector(".prompt");
    const dv = promptEl?.createDiv({
      text: `Commands will be run for ${this.selectedNodes.size} nodes.`,
    });
    dv?.setAttribute("style", "padding: var(--size-4-3); font-size: var(--font-smaller);");
    modal.open();
  };

  onNodeClick = (node: Node & Coords, event: MouseEvent) => {
    const plugin = this.forceGraph.view.plugin;
    const pluginSetting = plugin.settingManager.getSettings().pluginSetting;
    if (event.shiftKey) {
      const isSelected = this.selectedNodes.has(node);
      // multi-selection
      isSelected ? this.selectedNodes.delete(node) : this.selectedNodes.add(node);
      return;
    }
    const clickedNodeFile = this.findFileByNode(node);

    if (this.commandDown || event.ctrlKey) {
      if (
        pluginSetting.commandLeftClickNode === CommandClickNodeAction.openNodeInNewTab &&
        clickedNodeFile
      ) {
        // open file in new tab
        this.openFileInNewTab(clickedNodeFile);
      } else if (pluginSetting.commandLeftClickNode === CommandClickNodeAction.focusNode)
        this.focusOnCoords(node);
      return;
    }

    if (clickedNodeFile) {
      if (this.forceGraph.view.graphType === GraphType.local) {
        // open file in new tab
        this.openFileInNewTab(clickedNodeFile);
      } else {
        // open file in current tab (active leaf)
        this.forceGraph.view.itemView.leaf.openFile(clickedNodeFile);
      }
    }
  };

  onNodeHover = (node: Node | null) => {
    if ((!node && !this.highlightedNodes.size) || (node && this.hoveredNode === node)) return;

    // set node label text
    if (node) {
      const text = this.getNodeLabelText(node);
      this.forceGraph.nodeLabelEl.textContent = text;
      // @ts-ignore
      this.forceGraph.nodeLabelEl.style.color = node.color;
      this.forceGraph.nodeLabelEl.style.opacity = "1";
    } else {
      this.forceGraph.nodeLabelEl.style.opacity = "0";
    }

    this.clearHighlights();

    // add the new highlighted nodes and link
    if (node) {
      this.highlightedNodes.add(node.id);
      node.neighbors.forEach((neighbor) => this.highlightedNodes.add(neighbor.id));
      const nodeLinks = this.forceGraph.instance.graphData().getLinksWithNode(node.id);
      if (nodeLinks) nodeLinks.forEach((link) => this.highlightedLinks.add(link));
    }

    const shouldUseCommand =
      this.forceGraph.view.plugin.app.internalPlugins.getPluginById("page-preview").instance
        .overrides["3d-graph"] !== false;
    // show the hover preview
    if (node && node.labelEl && ((shouldUseCommand && this.commandDown) || !shouldUseCommand)) {
      this.forceGraph.view.hoverPopover?.hide();
      this.forceGraph.view.eventBus.trigger("open-node-preview", node);
      this.forceGraph.view.eventBus.trigger("open-node-preview", node);
    }

    this.hoveredNode = node ?? null;
    this.updateColor();
  };

  /**
   * when hover on node or link, they are highlighted. This function will clear the highlight
   */
  private clearHighlights = () => {
    this.highlightedNodes.clear();
    this.highlightedLinks.clear();
  };

  updateNodeLabelDiv() {
    this.forceGraph.instance.nodeThreeObject(this.forceGraph.instance.nodeThreeObject());
  }

  /**
   * this will update the color of the nodes and links
   */
  updateColor() {
    // trigger update of highlighted objects in scene
    this.forceGraph.instance
      .nodeColor(this.forceGraph.instance.nodeColor())
      .linkColor(this.forceGraph.instance.linkColor())
      .linkDirectionalParticles(this.forceGraph.instance.linkDirectionalParticles());
  }

  getLinkColor = (link: Link) => {
    const color = this.isHighlightedLink(link)
      ? this.forceGraph.view.settingManager.getCurrentSetting().display.linkHoverColor
      : this.forceGraph.view.theme.graphLine;
    return hexToRGBA(color, this.getIsAnyHighlighted() && !this.isHighlightedLink(link) ? 0.2 : 1);
  };

  getLinkWidth = (link: Link) => {
    const setting = this.forceGraph.view.settingManager.getCurrentSetting();
    return this.isHighlightedLink(link)
      ? setting.display.linkThickness * 1.5
      : setting.display.linkThickness;
  };

  getLinkDirectionalParticles = (link: Link) => {
    return this.isHighlightedLink(link) ? PARTICLE_FREQUECY : 0;
  };

  getLinkDirectionalParticleWidth = () => {
    const setting = this.forceGraph.view.settingManager.getCurrentSetting();
    return setting.display.linkThickness * LINK_PARTICLE_MULTIPLIER;
  };

  onLinkHover = (link: Link | null) => {
    this.clearHighlights();

    if (link) {
      this.highlightedLinks.add(link);
      this.highlightedNodes.add(link.source.id);
      this.highlightedNodes.add(link.target.id);
    }
    this.updateColor();
  };

  findFileByNode = (node: Node): TFile | undefined => {
    return this.forceGraph.view.plugin.app.vault.getFiles().find((f) => f.path === node.path);
  };

  public getNodeOpacityEasedValue = (node: Node) => {
    // get the position of the node
    // @ts-ignore
    const obj = node.__threeObj as THREE.Object3D | undefined;
    if (!obj) return 0;
    const nodePosition = obj.position;
    // then get the distance between the node and this.myCube , console.log it
    const distance = nodePosition.distanceTo(this.forceGraph.myCube.position);
    // change the opacity of the nodeEl base on the distance
    // the higher the distance, the lower the opacity
    // when the distance is 300, the opacity is 0
    const distanceFromFocal =
      this.forceGraph.view.settingManager.getCurrentSetting().display.distanceFromFocal;
    const normalizedDistance = Math.min(distance, distanceFromFocal) / distanceFromFocal;
    const easedValue = 0.5 - 0.5 * Math.cos(normalizedDistance * Math.PI);
    return easedValue;
  };

  getLinkDirectionalArrowLength = () => {
    const settings = this.forceGraph.view.settingManager.getCurrentSetting();

    return (
      settings.display.linkThickness *
      LINK_ARROW_WIDTH_MULTIPLIER *
      (settings.display.showLinkArrow ? 1 : 0)
    );
  };

  private isHighlightedLink = (link: Link): boolean => {
    return this.highlightedLinks.has(link);
  };

  public getNodeLabelText = (node: Node) => {
    const settings = this.forceGraph.view.settingManager.getCurrentSetting();
    const fullPath = node.path;
    const fileNameWithExtension = node.name;
    const fullPathWithoutExtension = fullPath.substring(0, fullPath.lastIndexOf("."));
    const fileNameWithoutExtension = fileNameWithExtension.substring(
      0,
      fileNameWithExtension.lastIndexOf(".")
    );
    const text = !settings.display.showExtension
      ? settings.display.showFullPath
        ? fullPathWithoutExtension
        : fileNameWithoutExtension
      : settings.display.showFullPath
      ? fullPath
      : fileNameWithExtension;
    return text;
  };

  initListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        this.spaceDown = true;
        // this.controls.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
      }
      if (e.metaKey) this.commandDown = true;
    });

    document.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        this.spaceDown = false;
        // this.controls.mouseButtons.LEFT = THREE.MOUSE.LEFT;
      }
      if (!e.metaKey) this.commandDown = false;
    });
  }

  /**
   *
   * if the input is undefined, return the current camera position. else this will move the camera to a specific position.
   */
  public cameraPosition(
    position: Partial<Coords> | undefined,
    lookAt: Coords | undefined,
    transitionDuration: number | undefined
  ) {
    const instance = this.forceGraph.instance;
    const camera = instance.camera();
    const controls = instance.controls() as OrbitControls;
    const tween = this.tween;
    if (position === undefined && lookAt === undefined && transitionDuration === undefined) {
      return {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
    }

    if (position) {
      const finalPos = position;
      const finalLookAt = lookAt || { x: 0, y: 0, z: 0 };

      if (!transitionDuration) {
        // no animation

        setCameraPos(finalPos);
        setLookAt(finalLookAt);
      } else {
        const camPos = Object.assign({}, camera.position);
        const camLookAt = getLookAt();

        // create unique id for position tween
        const posTweenId = Math.random().toString(36).substring(2, 15);

        tween[posTweenId] = new TWEEN.Tween(camPos)
          .to(finalPos, transitionDuration)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(setCameraPos)
          .onComplete(() => {
            tween[posTweenId] = undefined;
          })
          .start();

        // create unique id for lookAt tween
        const lookAtTweenId = Math.random().toString(36).substring(2, 15);

        // Face direction in 1/3rd of time
        tween[lookAtTweenId] = new TWEEN.Tween(camLookAt)
          .to(finalLookAt, transitionDuration / 3)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(setLookAt)
          .onComplete(() => {
            tween[lookAtTweenId] = undefined;
          })
          .start();
      }

      // eslint-disable-next-line no-inner-declarations
      function setCameraPos(pos: Partial<Coords>) {
        const { x, y, z } = pos;
        if (x !== undefined) camera.position.x = x;
        if (y !== undefined) camera.position.y = y;
        if (z !== undefined) camera.position.z = z;
      }

      // eslint-disable-next-line no-inner-declarations
      function setLookAt(lookAt: Coords) {
        const lookAtVect = new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z);
        if (controls.target) {
          controls.target = lookAtVect;
        } else {
          // Fly controls doesn't have target attribute
          camera.lookAt(lookAtVect); // note: lookAt may be overridden by other controls in some cases
        }
      }

      // eslint-disable-next-line no-inner-declarations
      function getLookAt() {
        return Object.assign(
          new THREE.Vector3(0, 0, -1000).applyQuaternion(camera.quaternion).add(camera.position)
        );
      }
    }
  }

  /**
   * this will force the camera to look at a specific position
   * @param lookAt
   * @param transitionDuration
   */
  public cameraLookAt(lookAt: Coords, transitionDuration: number | undefined) {
    this.cameraPosition(undefined, lookAt, transitionDuration);
  }

  /**
   * this will force the camera to look at the center of the graph
   */
  public cameraLookAtCenter = () => {
    const cameraPosition = this.forceGraph.instance.camera().position;
    this.cameraPosition(cameraPosition, { x: 0, y: 0, z: 0 }, cameraLookAtCenterTransitionDuration);
  };

  public focusOnNodeByPath = (path: string) => {
    // TODO: test if this is right
    const node = (this.forceGraph.instance.graphData().nodes as (Node & Coords)[]).find(
      (n) => n.path === path
    );
    if (node) {
      this.focusOnCoords(node, 1000);
    }
  };

  public focusOnCoords = (coords: Coords, duration = 3000) => {
    // Aim at node from outside it
    const distance = FOCAL_FROM_CAMERA;
    const distRatio = 1 + distance / Math.hypot(coords.x, coords.y, coords.z);

    const newPos =
      coords.x || coords.y || coords.z
        ? { x: coords.x * distRatio, y: coords.y * distRatio, z: coords.z * distRatio }
        : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

    this.cameraPosition(
      newPos, // new position
      coords, // lookAt ({ x, y, z })
      duration // ms transition duration
    );
  };

  public isHighlightedNode = (node: Node): boolean => {
    return this.highlightedNodes.has(node.id);
  };

  public getNodeColor = (node: Node): string => {
    let color: string;
    const settings = this.forceGraph.view.settingManager.getCurrentSetting();
    const theme = this.forceGraph.view.theme;
    const searchResult = this.forceGraph.view.settingManager.searchResult;
    if (this.selectedNodes.has(node)) {
      color = selectedColor;
    } else if (this.isHighlightedNode(node)) {
      color =
        node === this.hoveredNode
          ? settings.display.nodeHoverColor
          : settings.display.nodeHoverNeighbourColor;
    } else {
      color = theme.graphNode;
      settings.groups.forEach((group, index) => {
        if (group.query.trim().length === 0) return;
        const searchStateGroup = searchResult.value.groups[index];
        if (searchStateGroup) {
          const searchGroupfilePaths = searchStateGroup.files.map((file) => file.path);

          // if the node path is in the searchGroupfiles, change the color to group.color
          if (searchGroupfilePaths.includes(node.path)) color = group.color;
        }
      });
    }
    const rgba = hexToRGBA(
      color,
      this.getIsAnyHighlighted() && !this.isHighlightedNode(node) ? 0.5 : 1
    );
    return rgba;
  };

  public getIsAnyHighlighted = () => {
    return this.highlightedNodes.size !== 0 || this.highlightedLinks.size !== 0;
  };

  public removeSelection() {
    this.selectedNodes.clear();
    this.updateColor();
  }

  public searchNode(path: string) {
    const targetNode = this.forceGraph.instance.graphData().getNodeByPath(path);
    if (targetNode) this.focusOnCoords(targetNode as Node & Coords);
    else createNotice("The node doesn't exist in the graph");
  }

  public openFileInNewTab(file: TFile) {
    this.forceGraph.view.plugin.app.workspace.getLeaf(false).openFile(file);
  }
}
