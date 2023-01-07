import { CGFobject } from "../../lib/CGF.js";

/**
 * MyTorus
 * @constructor
 * @param scene - reference to CGFscene object
 * @param inner - inner radius
 * @param outer - outer radius
 * @param slices - number of slices around the inner radius
 * @param loops - number of loops around the circular axis
 */
export class MyTorus extends CGFobject {
  /**
   * @constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {float} inner - inner radius
   * @param {float} outer - outer radius
   * @param {integer} slices - number of slices around the inner radius
   * @param {integer} loops - number of loops around the circular axis
   */
  constructor(scene, inner, outer, slices, loops) {
    super(scene);

    this.inner = inner;
    this.outer = outer;
    this.slices = slices;
    this.loops = loops;

    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [];
    this.normals = [];
    this.indices = [];
    this.texCoords = [];
    this.defaultTexCoords = [];

    // slices
    let alpha = 0;
    let deltaAlpha = (2 * Math.PI) / this.slices;

    // loops
    let beta = 0;
    let deltaBeta = (2 * Math.PI) / this.loops;

    for (let slice = 0; slice <= this.slices; slice++) {
      const sinAlpha = Math.sin(alpha);
      const cosAlpha = Math.cos(alpha);

      beta = 0;
      for (let loop = 0; loop <= this.loops; loop++) {
        const sinBeta = Math.sin(beta);
        const cosBeta = Math.cos(beta);

        const x = (this.outer + this.inner * cosAlpha) * cosBeta;
        const y = (this.outer + this.inner * cosAlpha) * sinBeta;
        const z = this.inner * sinAlpha;

        const s = 1 - slice / this.slices;
        const t = 1 - loop / this.loops;

        this.vertices.push(x, y, z);
        this.normals.push(cosBeta * cosAlpha, sinBeta * cosAlpha, sinAlpha);
        this.texCoords.push(s, t);
        this.defaultTexCoords.push(s, t);

        beta += deltaBeta;
      }

      alpha += deltaAlpha;
    }

    for (let slice = 0; slice < this.slices; slice++) {
      for (let loop = 0; loop < this.loops; loop++) {
        const first = slice * (this.loops + 1) + loop;
        const second = first + this.loops + 1;

        this.indices.push(first, second + 1, second);
        this.indices.push(first, first + 1, second + 1);
      }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  /**
   * Updates the list of texture coordinates of the torus
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
