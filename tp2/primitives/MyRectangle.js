import { CGFobject } from "../../lib/CGF.js";
/**
 * MyRectangle
 * @constructor
 * @param scene - reference to MyScene object
 * @param x1 - x coordinate of rectangle's corner 1
 * @param x2 - x coordinate of rectangle's corner 2
 * @param y1 - y coordinate of rectangle's corner 1
 * @param y2 - x coordinate of rectangle's corner 2
 */
export class MyRectangle extends CGFobject {
  /**
   * @constructor
   * @param {CGFscene} scene 
   * @param {float} x1 
   * @param {float} x2 
   * @param {float} y1 
   * @param {float} y2 
   */
  constructor(scene, id, x1, x2, y1, y2) {
    super(scene);
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;

    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [
      this.x1,
      this.y1,
      0, //0
      this.x2,
      this.y1,
      0, //1
      this.x1,
      this.y2,
      0, //2
      this.x2,
      this.y2,
      0, //3
    ];

    //Counter-clockwise reference of vertices
    this.indices = [
      0, 1, 2, 1, 3, 2,

      2, 1, 0, 2, 3, 1,
    ];

    //Facing Z positive
    this.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];

    this.defaultTexCoords = [
      0,
      this.y2 - this.y1,
      this.x2 - this.x1,
      this.y2 - this.y1,
      0,
      0,
      this.x2 - this.x1,
      0,
    ];

    this.texCoords = [
      0,
      this.y2 - this.y1,
      this.x2 - this.x1,
      this.y2 - this.y1,
      0,
      0,
      this.x2 - this.x1,
      0,
    ];

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  /**
   * Updates the list of texture coordinates of the rectangle
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
