import { CGFobject } from "../../lib/CGF.js";

/**
 * MyCilinder
 * @constructor
 * @param scene - reference to MyScene object
 * @param slices - number of divisions around the Y axis
 * @param stacks - number of divisions along the Y axis
 * @param topRadius - radius of the top circle
 * @param bottomRadius - radius of the bottom circle
 * @param height - height of the cylinder
 */
export class MyCylinder extends CGFobject {
  /**
   * @method constructor
   * @param {CGFscene} scene 
   * @param {integer} slices 
   * @param {integer} stacks 
   * @param {float} topRadius 
   * @param {float} bottomRadius 
   * @param {float} height 
   */
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
    var currentHeight = 0;
    var alphaHeight = this.height / this.stacks;
    var currentRadius = this.bottomRadius;
    var alphaRadius = (this.topRadius - this.bottomRadius) / this.stacks;

    var cosValues = [...Array(this.slices + 1).keys()].map((value) =>
      Math.cos(value * alphaAng)
    );
    var sinValues = [...Array(this.slices + 1).keys()].map((value) =>
      Math.sin(value * alphaAng)
    );

    const deltaR = Math.abs(this.topRadius - this.bottomRadius);
    const zNormalAngle = deltaR / Math.sqrt(deltaR ^ (2 + this.height) ^ 2);

    for (var stack = 0; stack <= this.stacks; stack++) {
      for (var slice = 0; slice <= this.slices; slice++) {
        var sa = sinValues[slice];
        var ca = cosValues[slice];

        this.vertices.push(
          currentRadius * ca,
          currentRadius * sa,
          currentHeight
        );

        this.defaultTexCoords.push(slice / this.slices,  1 - (stack / this.stacks));
        this.texCoords.push(slice / this.slices, 1 - (stack / this.stacks));
        
        this.normals.push(ca, sa, zNormalAngle);
      }
      currentRadius += alphaRadius;
      currentHeight += alphaHeight;
    }

    for (var stack = 0; stack < this.stacks; stack++) {
      for (var slice = 0; slice < this.slices; slice += 1) {
        var v1 = slice + stack * (this.slices + 1);
        var v2 = slice + stack * (this.slices + 1) + 1;
        var v3 = slice + (stack + 1) * (this.slices + 1);
        var v4 = slice + (stack + 1) * (this.slices + 1) + 1;
        this.indices.push(v4, v3, v1);
        this.indices.push(v1, v2, v4);

        this.indices.push(v1, v3, v4);
        this.indices.push(v4, v2, v1);
      }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  /**
   * Updates the list of texture coordinates of the cylinder
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
