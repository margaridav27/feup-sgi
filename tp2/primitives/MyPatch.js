import { CGFnurbsSurface, CGFnurbsObject } from "../../lib/CGF.js";

/**
 * MyPatch
 * @constructor
 * @param scene - reference to MyScene object
 * @param degreeU - degree in U
 * @param degreeV - degree in V
 * @param partsU - divisions U 
 * @param partsV - divisions V
 * @param controlPoints - list of control points, divided by U and V
 */
export class MyPatch {
  /**
   * 
   * @param {CGFscene} scene 
   * @param {integer} degreeU 
   * @param {integer} partsU 
   * @param {integer} degreeV 
   * @param {integer} partsV 
   * @param {array} controlPoints 
   */
  constructor(scene, degreeU, partsU, degreeV, partsV, controlPoints) {
    const nurbsSurface = new CGFnurbsSurface(degreeU, degreeV, controlPoints);
    this.nurbsObject = new CGFnurbsObject(scene, partsU, partsV, nurbsSurface);
  }

  display() {
    this.nurbsObject.display();
  }
}
