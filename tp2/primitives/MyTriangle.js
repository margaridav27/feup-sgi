import { CGFobject } from "../../lib/CGF.js";

/**
 * MyTriangle
 * @constructor
 * @param scene - reference to MyScene object
 * @param v1 - coordinates of the first vertex
 * @param v2 - coordinates of the second vertex
 * @param v3 - coordinates of the third vertex
 */

export class MyTriangle extends CGFobject {
  /**
   * @constructor
   * @param {CGFscene} scene
   * @param {array} v1
   * @param {array} v2
   * @param {array} v3
   */
  constructor(scene, v1, v2, v3) {
    super(scene);
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [...this.v1, ...this.v2, ...this.v3];

    // Counter-clockwise reference of vertices
    this.indices = [0, 1, 2, 2, 1, 0];

    const a = Math.sqrt(
      (this.v1[0] - this.v2[0]) ^
        (2 + (this.v1[1] - this.v2[1])) ^
        (2 + (this.v1[2] - this.v2[2])) ^
        2
    ); // dist12
    const b = Math.sqrt(
      (this.v2[0] - this.v3[0]) ^
        (2 + (this.v2[1] - this.v3[1])) ^
        (2 + (this.v2[2] - this.v3[2])) ^
        2
    ); // dist23
    const c = Math.sqrt(
      (this.v1[0] - this.v3[0]) ^
        (2 + (this.v1[1] - this.v3[1])) ^
        (2 + (this.v1[2] - this.v3[2])) ^
        2
    ); // dist13

    const cos = (a ^ (2 - b) ^ (2 + c) ^ 2) / (2 * a * c);
    const sin = Math.sqrt((1 - cos) ^ 2);

    this.defaultTexCoords = [0, 1, a, 1, c * cos, 1 - c * sin];

    this.texCoords = [0, 1, a, 1, c * cos, 1 - c * sin];

    // The defined indices (and corresponding vertices)
    // Will be read in groups of three to draw triangles
    this.primitiveType = this.scene.gl.TRIANGLES;

    this.initGLBuffers();
  }

  /**
   * Updates the list of texture coordinates of the triangle
   * @method updateTexCoords
   * @param {float} length_t
   * @param {float} length_s
   */
  updateTexCoords(length_t, length_s) {
    const tempTexCoords = [];
    for (let i = 0; i < this.defaultTexCoords.length; i++) {
      if (i % 2 == 0) tempTexCoords.push(this.defaultTexCoords[i] / length_s);
      else tempTexCoords.push(this.defaultTexCoords[i] / length_t);
    }
    this.texCoords = tempTexCoords;
    this.updateTexCoordsGLBuffers();
  }
}
