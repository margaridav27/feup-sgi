import { CGFnurbsSurface, CGFnurbsObject } from "../../lib/CGF.js";

/**
 * MyPatch
 * @constructor
 * @param scene - reference to CGFscene object
 * @param degreeU - degree in U
 * @param degreeV - degree in V
 * @param partsU - divisions U
 * @param partsV - divisions V
 * @param controlPoints - list of control points, divided by U and V
 */
export class MyPatch {
  /**
   *
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {integer} degreeU - degree in U
   * @param {integer} partsU - divisions U
   * @param {integer} degreeV - degree in V
   * @param {integer} partsV - divisions V
   * @param {array} controlPoints - list of control points, divided by U and V
   */
  constructor(scene, degreeU, partsU, degreeV, partsV, controlPoints) {
    const nurbsSurface = new CGFnurbsSurface(degreeU, degreeV, controlPoints);
    this.nurbsObject = new CGFnurbsObject(scene, partsU, partsV, nurbsSurface);
  }

  display() {
    this.nurbsObject.display();
  }
}
