import { CGFobject } from "../../lib/CGF.js";

/**
 * MySphere
 * @constructor
 * @param scene - reference to CGFscene object
 * @param slices - number of slices around Y axis
 * @param stacks - number of stacks along Y axis, from the center to the poles (half of sphere)
 * @param radius - radius of the sphere
 */

export class MySphere extends CGFobject {
  /**
   * @method constructor
   * @param  {CGFscene} scene - reference to CGFscene object
   * @param  {integer} slices - number of slices around Y axis
   * @param  {integer} stacks - number of stacks along Y axis, from the center to the poles (half of sphere)
   * @param  {float} radius - radius of the sphere
   */
  constructor(scene, slices, radius, stacks) {
    super(scene);

    this.slices = slices;
    this.radius = radius;
    this.stacks = stacks * 2;

    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [];
    this.indices = [];
    this.normals = [];
    this.texCoords = [];
    this.defaultTexCoords = [];

    var phi = 0;
    var theta = 0;
    var phiInc = Math.PI / this.stacks;
    var thetaInc = (2 * Math.PI) / this.slices;
    var latVertices = this.slices + 1;

    // build an all-around stack at a time, starting on "north pole" and proceeding "south"
    for (let longitude = 0; longitude <= this.stacks; longitude++) {
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      // in each stack, build all the slices around, starting on latitude 0
      theta = 0;
      for (let latitude = 0; latitude <= this.slices; latitude++) {
        //--- Vertices coordinates
        var x = Math.cos(-theta) * sinPhi * this.radius;
        var y = Math.sin(theta) * sinPhi * this.radius;
        var z = cosPhi * this.radius;

        this.vertices.push(x, y, z);

        //--- Indices
        if (longitude < this.stacks && latitude < this.slices) {
          var current = longitude * latVertices + latitude;
          var next = current + latVertices;
          // pushing two triangles using indices from this round (current, current+1)
          // and the ones directly south (next, next+1)
          // (i.e. one full round of slices ahead)

          this.indices.push(current + 1, current, next);
          this.indices.push(current + 1, next, next + 1);
        }

        //--- Normals
        // at each vertex, the direction of the normal is equal to
        // the vector from the center of the sphere to the vertex.
        // in a sphere of radius equal to one, the vector length is one.
        // therefore, the value of the normal is equal to the position vectro
        const length = Math.sqrt(
          Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2)
        ); // To normalize
        this.normals.push(x / length, y / length, z / length);
        theta += thetaInc;

        //--- Texture Coordinates

        this.defaultTexCoords.push(
          latitude / this.slices,
          longitude / this.stacks
        );
        this.texCoords.push(latitude / this.slices, longitude / this.stacks);
      }

      phi += phiInc;
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  /**
   * Updates the list of texture coordinates of the sphere
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
