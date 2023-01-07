import { CGFtexture, CGFshader } from "../../lib/CGF.js";

/**
 * MySpriteSheet
 * @constructor
 * @param scene - reference to CGFscene object
 * @param texture - filename of the texture to be applied
 * @param nCols - number of columns of the sprite sheet
 * @param nRows - number of rows of the sprite sheet
 */
export class MySpriteSheet {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {string} texture - filename of the texture to be applied
   * @param {integer} nCols - number of columns of the sprite sheet
   * @param {integer} nRows - number of rows of the sprite sheet
   */
  constructor(scene, texture, nCols, nRows) {
    this.scene = scene;

    this.nCols = nCols;
    this.nRows = nRows;

    this.texture = new CGFtexture(this.scene, texture);

    this.shader = new CGFshader(
      this.scene.gl,
      "./shaders/sprite.vert",
      "./shaders/sprite.frag"
    );
    this.shader.setUniformsValues({ texture: 0 });
    this.shader.setUniformsValues({ nCols: this.nCols, nRows: this.nRows });
  }

  /**
   * Gets the number of columns of the sprite sheet
   * @method getNCols
   * @returns {integer} number of columns of the sprite sheet
   */
  getNCols() {
    return this.nCols;
  }

  /**
   * Gets the number of rows of the sprite sheet
   * @method getNRows
   * @returns {integer} number of rows of the sprite sheet
   */
  getNRows() {
    return this.nRows;
  }

  /**
   * Activates the current cell to be presented, based on the values of the column and row passed by parameters
   * @method activateCellByColRow
   * @param {integer} col 
   * @param {integer} row 
   */
  activateCellByColRow(col, row) {
    this.scene.setActiveShaderSimple(this.shader);
    this.shader.setUniformsValues({ col, row });
    this.texture.bind(0);
  }
}
