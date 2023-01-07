import { MyPatch } from "../primitives/MyPatch.js";

/**
 * MyCylindricalPatch
 * @constructor
 * @param scene - reference to CGFscene object
 */
export class MyCylindricalPatch {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   */
  constructor(scene) {
    this.scene = scene;
    this.initPrimitives();
  }

  initPrimitives() {
    this.side = new MyPatch(this.scene, 2, 20, 3, 20, [
      [
        [-1, 0, 0, 1],
        [-1, 0, -1.33, 1],
        [1, 0, -1.33, 1],
        [1, 0, 0, 1],
      ],
      [
        [-1, 0.5, 0, 1],
        [-1, 0.5, -1.33, 1],
        [1, 0.5, -1.33, 1],
        [1, 0.5, 0, 1],
      ],
      [
        [-1, 1, 0, 1],
        [-1, 1, -1.33, 1],
        [1, 1, -1.33, 1],
        [1, 1, 0, 1],
      ],
    ]);
    this.bottom = new MyPatch(this.scene, 1, 20, 3, 20, [
      [
        [-1, 0, 0, 1],
        [-0.25, 0, 0, 1],
        [0.75, 0, 0, 1],
        [1, 0, 0, 1],
      ],
      [
        [-1, 0, 0, 1],
        [-1, 0, -1.33, 1],
        [1, 0, -1.33, 1],
        [1, 0, 0, 1],
      ],
    ]);
  }

  displayHalf() {
    let matrix = mat4.create();

    // top
    this.scene.pushMatrix();
    mat4.translate(matrix, matrix, [0, 1, 0]);
    mat4.rotateZ(matrix, matrix, 3.14);
    this.scene.multMatrix(matrix);
    this.bottom.display();

    this.bottom.display();

    this.side.display();

    this.scene.popMatrix();
  }

  display() {
    let matrix = mat4.create();

    this.scene.pushMatrix();

    // one half
    this.displayHalf();

    // other half
    mat4.rotateY(matrix, matrix, 3.14);
    this.scene.multMatrix(matrix);
    this.displayHalf();

    this.scene.popMatrix();
  }
}
