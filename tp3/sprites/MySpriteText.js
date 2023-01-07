import { MyRectangle } from "../primitives/MyRectangle.js";
import { MySpriteSheet } from "./MySpriteSheet.js";

const VALID_TEXT_COLOR = (color) => color === "white" || color === "black";
const VALID_TEXT_WEIGHT = (weight) => weight === "regular" || weight === "bold";

/**
 * MySpriteText
 * @constructor
 * @param scene - reference to CGFscene object
 * @param text - text to be displayed
 * @param textWeight - text's weight (regular or bold)
 * @param textColor - text's color (white or black)
 */
export class MySpriteText {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {string} text - text to be displayed
   * @param {string} textWeight - text's weight (regular or bold)
   * @param {string} textColor - text's color (white or black)
   */
  constructor(scene, text, textWeight = "regular", textColor = "white") {
    this.scene = scene;

    this.background = new MyRectangle(this.scene, "spriteTextBg", 0, 1, 0, 1);

    this.text = text;
    this.textColor = VALID_TEXT_COLOR(textColor) ? textColor : "white";
    this.textWeight = VALID_TEXT_WEIGHT(textWeight) ? textWeight : "regular";

    this.spriteSheet = new MySpriteSheet(
      this.scene,
      `scenes/images/fonts/font-${this.textColor}-${this.textWeight}.png`,
      16,
      8
    );
  }

  /**
   * Gets the text to be displayed
   * @method getText
   * @returns {string} text to be displayed
   */
  getText() {
    return this.text;
  }

  /**
   * Gets the text's length
   * @method getTextLength
   * @returns {integer} text's length
   */
  getTextLength() {
    return this.text.length;
  }

  /**
   * Gets the row and the column of the cell of the sprite sheet with the character passed by parameter
   * @method getPosition
   * @param {string} character - the character to get the row and the column of
   */
  getPosition(character) {
    if (character == " ") return [0, 0];

    let charCode = character.charCodeAt();
    if (charCode >= 32 && charCode <= 122) charCode -= 32;
    else return [0, 0]; // Invalid character, show '?'

    const col = charCode % this.spriteSheet.getNCols();
    const row = Math.floor(charCode / this.spriteSheet.getNCols());
    return [col, row];
  }

  /**
   * Sets the text's weight to either regular or bold (regular if the parameter is invalid)
   * @method setTextWeight
   * @param {string} textWeight
   */
  setTextWeight(textWeight) {
    this.textWeight = VALID_TEXT_WEIGHT(textWeight) ? textWeight : "regular";

    this.spriteSheet = new MySpriteSheet(
      this.scene,
      `scenes/images/fonts/font-${this.textColor}-${this.textWeight}.png`,
      16,
      8
    );
  }

  /**
   * Sets the text's color to either white or black (white if the parameter is invalid)
   * @method setTextColor
   * @param {string} textColor
   */
  setTextColor(textColor) {
    this.textColor = VALID_TEXT_COLOR(textColor) ? textColor : "white";

    this.spriteSheet = new MySpriteSheet(
      this.scene,
      `scenes/images/fonts/font-${this.textColor}${this.textWeight}.png`,
      16,
      8
    );
  }

  /**
   * Displays the sprite text
   * @method display
   */
  display() {
    for (let i = 0; i < this.text.length; i++) {
      let matrix = mat4.create();
      mat4.translate(matrix, matrix, [i - this.text.length / 2, 0, 0]);

      const position = this.getPosition(this.text[i]);
      this.spriteSheet.activateCellByColRow(position[0], position[1]);

      this.scene.pushMatrix();
      this.scene.multMatrix(matrix);
      this.background.display();
      this.scene.popMatrix();
    }

    this.scene.setActiveShaderSimple(this.scene.defaultShader);
  }
}
