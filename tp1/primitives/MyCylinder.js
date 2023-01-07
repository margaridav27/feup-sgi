import { CGFobject } from "../../lib/CGF.js";
/**
 * MyCilinder
 * @constructor
 * @param scene - Reference to MyScene object
 * @param slices - number of divisions around the Y axis
 */

export class MyCylinder extends CGFobject {
  constructor(scene, slices, topRadius, bottomRadius, height, stacks) {
    super(scene);

    this.slices = slices;
    this.topRadius = topRadius;
    this.bottomRadius = bottomRadius;
    this.height = height;
    this.stacks = stacks;

    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    this.defaultTexCoords = [];
    this.indices = [];

    var alphaAng = (2 * Math.PI) / this.slices;
    var coord = 0;
    var alphaCoord = 1 / this.slices;
    var currentHeight = 0;
    var alphaHeight = this.height / this.stacks;
    var currentRadius = this.bottomRadius;
    var alphaRadius = (this.topRadius - this.bottomRadius) / this.stacks;

    var cosValues = [...Array(this.slices).keys()].map((value) =>
      Math.cos(value * alphaAng)
    );
    var sinValues = [...Array(this.slices).keys()].map((value) =>
      Math.sin(value * alphaAng)
    );

    const deltaR = Math.abs(this.topRadius - this.bottomRadius);
    const zNormalAngle = deltaR / Math.sqrt(deltaR ^ (2 + this.height) ^ 2);

    for (var k = 0; k <= this.stacks; k++) {
      for (var i = 0; i < this.slices; i++) {
        var sa = sinValues[i];
        var ca = cosValues[i];

        this.vertices.push(
          currentRadius * ca,
          currentRadius * sa,
          currentHeight
        );

        this.defaultTexCoords.push(1 - coord, 0);
        this.defaultTexCoords.push(1 - coord, 1);

        this.texCoords.push(1 - coord, 0);
        this.texCoords.push(1 - coord, 1);

        this.normals.push(ca, sa, zNormalAngle);

        coord += alphaCoord;
      }
      currentRadius += alphaRadius;
      currentHeight += alphaHeight;
    }

    for (var k = 0; k < this.stacks; k++) {
      var t = k * this.slices;
      var max = t + this.slices;
      for (var i = 0; i < this.slices; i += 1) {
        var var1 = t + i;
        var var2 = max + i;
        var var3 = var1 + 1 == max ? t : var1 + 1;
        var var4 = var1 + 1 == max ? max : var2 + 1;

        this.indices.push(var1, var2, var3);
        this.indices.push(var2, var4, var3);

        this.indices.push(var3, var2, var1);
        this.indices.push(var3, var4, var2);
      }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  /**
   * @method updateTexCoords
   * Updates the list of texture coordinates of the rectangle
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
