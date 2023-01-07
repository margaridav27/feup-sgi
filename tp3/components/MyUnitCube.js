import { MyRectangle } from "../primitives/MyRectangle.js";

/**
 * MyUnitCube
 * @constructor
 * @param scene - Reference to CGFscene object
 */
export class MyUnitCube {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   */
  constructor(scene) {
    this.scene = scene;
    this.face = new MyRectangle(this.scene, "unitCubeFace", 0, 1, 0, 1);
    this.transformations = [
      { translation: [0, 0, 0], rotation: { angle: 0, axis: [0, 0, 0] } },
      { translation: [1, 0, -1], rotation: { angle: 3.14, axis: [0, 1, 0] } },
      { translation: [1, 0, 0], rotation: { angle: 1.57, axis: [0, 1, 0] } },
      { translation: [0, 0, -1], rotation: { angle: -1.57, axis: [0, 1, 0] } },
      { translation: [0, 1, 0], rotation: { angle: -1.57, axis: [1, 0, 0] } },
      { translation: [0, 0, -1], rotation: { angle: 1.57, axis: [1, 0, 0] } },
    ];
  }

  display() {
    let matrix = mat4.create();

    this.scene.pushMatrix();

    for (const t of this.transformations) {
      this.scene.pushMatrix();
      mat4.translate(matrix, mat4.create(), [-0.5, 0, 0.5]); // center with y axis
      mat4.translate(matrix, matrix, t.translation);
      mat4.rotate(matrix, matrix, t.rotation.angle, t.rotation.axis);
      this.scene.multMatrix(matrix);
      this.face.display();
      this.scene.popMatrix();
    }

    this.scene.popMatrix();
  }
}
