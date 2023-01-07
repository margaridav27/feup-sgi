import { MyUnitCube } from "../../components/MyUnitCube.js";
import { MySpriteText } from "../../sprites/MySpriteText.js";

/**
 * Button
 * @constructor
 * @param scene - reference to CGFscene object
 * @param id - button's ID (used to pass to registerForPick)
 * @param text - button's text
 * @param defaultMaterial - button's material when it is not selected
 * @param selectedMaterial - button's material when it is selected
 */
export class Button {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {integer} id - button's ID (used to pass to registerForPick)
   * @param {string} text - button's text
   * @param {CGFappearance} defaultMaterial - button's material when it is not selected
   * @param {CGFappearance} selectedMaterial - button's material when it is selected
   */
  constructor(scene, id, text, defaultMaterial, selectedMaterial) {
    this.scene = scene;
    this.id = id;
    this.selected = false;

    this.defaultMaterial = defaultMaterial;
    this.selectedMaterial = selectedMaterial;

    this.spriteText = new MySpriteText(this.scene, text);

    this.cube = new MyUnitCube(this.scene, "buttonCube", 0, 1, 0, 1);
  }

  /**
   * Gets button's ID
   * @method getId
   * @returns {integer} button's ID
   */
  getId() {
    return this.id;
  }

  /**
   * Gets button's text
   * @method getText
   * @returns {string} button's text
   */
  getSpriteText() {
    return this.spriteText;
  }

  /**
   * Selects button, affecting its material and text's weight
   * @method select
   */
  select() {
    this.spriteText.setTextWeight("bold");
    this.selected = true;
  }

  /**
   * Deselects button, affecting its material and text's weight
   * @method clearSelection
   */
  clearSelection() {
    this.spriteText.setTextWeight("regular");
    this.selected = false;
  }

  /**
   * Displays button, with a fixed length if so is specified, or with the text's length otherwise
   * @method display
   */
  display(fixedLength = this.spriteText.getTextLength()) {
    let matrix = mat4.create();

    this.scene.pushMatrix();

    if (this.selected) this.selectedMaterial.apply();
    else this.defaultMaterial.apply();

    this.scene.pushMatrix();
    mat4.translate(matrix, mat4.create(), [0, 0, 0.1]);
    mat4.scale(matrix, matrix, [fixedLength, 1, 0.2]);
    this.scene.multMatrix(matrix);
    this.cube.display();
    this.scene.popMatrix();

    this.scene.pushMatrix();
    mat4.translate(matrix, mat4.create(), [0, 0, 0.201]);
    this.scene.multMatrix(matrix);
    this.spriteText.display();
    this.scene.popMatrix();

    this.scene.popMatrix();
  }
}
