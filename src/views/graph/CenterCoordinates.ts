import * as THREE from "three";

const origin = new THREE.Vector3(0, 0, 0);

export class CenterCoordinates {
  public readonly arrowsGroup = new THREE.Group();

  constructor(visibility = false) {
    const xDir = new THREE.Vector3(1, 0, 0);
    const yDir = new THREE.Vector3(0, 1, 0);
    const zDir = new THREE.Vector3(0, 0, 1);

    xDir.normalize();
    yDir.normalize();
    zDir.normalize();

    const length = 100;

    const xArrow = new THREE.ArrowHelper(xDir, origin, length, 16711680);
    const yArrow = new THREE.ArrowHelper(yDir, origin, length, 65280);
    const zArrow = new THREE.ArrowHelper(zDir, origin, length, 255);

    this.arrowsGroup.add(xArrow, yArrow, zArrow);

    this.arrowsGroup.visible = visibility;
  }

  setVisibility(visibility: boolean) {
    this.arrowsGroup.visible = visibility;
  }

  setLength(length: number) {
    this.arrowsGroup.children.forEach((arrow) => {
      (arrow as THREE.ArrowHelper).setLength(length);
    });
  }
}
