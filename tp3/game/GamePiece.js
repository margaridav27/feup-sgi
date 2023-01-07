import { CGFtexture, CGFappearance } from "../../lib/CGF.js";
import { MyTorus } from "../primitives/MyTorus.js";

const NORMAL_SPEED = 1;
const KING_SPEED = 1.5;
const TRANSFORM_KING = 1;

const LARGE_SCALE_FACTOR = 1;
const LARGE_Y_OFFSET = 0.0536;
const SMALL_SCALE_FACTOR = 0.25;
const SMALL_Y_OFFSET = 0.0136;

export const PIECE_THICKNESS = 0.1015;
const INNER_THICKNESS = 0.3;
const MIDDLE_THICKNESS = 0.05;
const OUTER_THICKNESS = 0.846;
export const OUTER_DIAMETER = 0.846;

/**
 * GamePiece
 * @constructor
 * @param scene - reference to CGFscene object
 * @param player - piece owner
 * @param color - piece color according to its owner
 * @param cellSize - size of the board cells
 */
export class GamePiece {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {boolean} player - piece owner
   * @param {object} color - piece color according to its owner
   * @param {float} cellSize - size of the board cells
   */
  constructor(scene, player, color, cellSize) {
    this.scene = scene;
    this.color = color;
    this.player = player;
    this.isKing = false;

    this.cellSize = cellSize;

    this.animRevert = false;
    this.animStart = undefined;
    this.currOffset = 0;

    this.initPrimitives();
    this.initMaterials();
    this.initTexture();
  }

  /**
   * Initializes piece's primitives
   * @method initPrimitives
   */
  initPrimitives() {
    this.innerTorus = new MyTorus(this.scene, 0.0692, 0.104, 40, 40);
    this.middleTorus = new MyTorus(this.scene, 0.138, 0.231, 40, 40);
    this.outerTorus = new MyTorus(this.scene, 0.06, 0.4, 40, 40);
  }

  
  /**
   * Initializes piece's materials
   * @method initMaterials 
   */
  initMaterials() {
    this.material = new CGFappearance(this.scene);
    this.material.setAmbient(this.color.r, this.color.g, this.color.b, 1);
    this.material.setDiffuse(this.color.r, this.color.g, this.color.b, 1);
    this.material.setSpecular(this.color.r, this.color.g, this.color.b, 1);
    this.material.setEmission(0, 0, 0, 1);
    this.material.setShininess(10);

    this.middleMaterial = new CGFappearance(this.scene);
    this.middleMaterial.setAmbient(1, 1, 1, 1);
    this.middleMaterial.setDiffuse(1, 1, 1, 1);
    this.middleMaterial.setSpecular(1, 1, 1, 1);
    this.middleMaterial.setEmission(0, 0, 0, 1);
    this.middleMaterial.setShininess(10);
  }

  /**
   * Initializes piece's texture
   * @method initMaterials 
   */
  initTexture() {
    const filePath = `scenes/images/player${this.player ? 1 : 2}-plates.png`;
    this.middleTexture = new CGFtexture(this.scene, filePath);
  }

  /**
   * Gets the color of the piece
   * @method getColor
   * @returns {object} piece's color
   */
  getColor() {
    return this.color;
  }

  /**
   * Gets the owner of the piece
   * @method getPlayer
   * @returns {boolean} true if player1, false otherwise
   */
  getPlayer() {
    return this.player;
  }

  /**
   * Gets the speed of the piec
   * @method getSpeed
   * @returns {float} piece's speed
  */
  getSpeed() {
    return this.isKing ? KING_SPEED : NORMAL_SPEED;
  }

  /**
   * Gets the information about the piece type
   * @method getIsKing
   * @returns {boolean} true if the piece is king, false otherwise
   */
  getIsKing() {
    return this.isKing;
  }
  
  /**
   * Turns a piece into king and starts its transformation
   * @method setKing
   */
  setKing() {
    this.isKing = true;
    this.animStart = -1;
  }

  /**
   * Starts the transformation of the piece into a default piece
   * @method unsetKing
   */
  unsetKing() {
    this.animRevert = true;
    this.animStart = -1;
  }

  /**
   * Determines if the piece is suffering a transformation
   * @method isTransforming
   * @returns {boolean} true if the piece is suffering a transformation, false otherwise
   */
  isTransforming() {
    return this.animStart !== undefined;
  }

  /**
   * Ends the transformation animation
   * @method transformed
   */
  transformed() {
    this.animStart = undefined;
    if (this.animRevert) {
      this.isKing = false;
      this.animRevert = false;
    }
  }

  /**
   * Displays a plate
   * @method displayPlate
   * @param {float} offset - height offset to be used in the display 
   */
  displayPlate(offset) {
    const scaleFactor = this.cellSize > 0.5 ? LARGE_SCALE_FACTOR : SMALL_SCALE_FACTOR; 

    let matrix = mat4.create();

    this.scene.pushMatrix();
    mat4.translate(matrix, matrix, [0, 0, offset * -PIECE_THICKNESS * scaleFactor]);
    this.scene.multMatrix(matrix);

    this.scene.pushMatrix();
    this.material.apply();
    mat4.scale(matrix, mat4.create(), [1, 1, INNER_THICKNESS * scaleFactor]);
    this.scene.multMatrix(matrix);
    this.innerTorus.display();
    this.scene.popMatrix();

    this.scene.pushMatrix();
    this.middleMaterial.setTexture(this.middleTexture);
    this.middleMaterial.apply();
    mat4.scale(matrix, mat4.create(), [1, 1, MIDDLE_THICKNESS * scaleFactor]);
    this.scene.multMatrix(matrix);
    this.middleTorus.display();
    this.scene.popMatrix();

    this.material.apply();
    this.scene.pushMatrix();
    mat4.scale(matrix, mat4.create(), [1, 1, OUTER_THICKNESS * scaleFactor]);
    this.scene.multMatrix(matrix);
    this.outerTorus.display();
    this.scene.popMatrix();

    this.scene.popMatrix();
  }

  /**
   * Displays the piece
   * @method display
   */
  display() {
    const translationFactor = this.cellSize > 0.5 ? -LARGE_Y_OFFSET : -SMALL_Y_OFFSET;
    this.scene.pushMatrix();

    let matrix = mat4.create();
    mat4.translate(matrix, matrix, [0.5, 0.5, translationFactor]);
    this.scene.multMatrix(matrix);

    this.displayPlate(0);
    if (this.isKing) {
      this.displayPlate(Math.min(this.currOffset, 1));
      this.displayPlate(this.currOffset);
    }

    this.scene.popMatrix();
  }

  /**
   * Update function, called periodically, which updates the piece's animation
   * @method update
   * @param {float} t - currentTime 
   */
  update(t) {
    if (this.animStart === undefined) return;
    if (this.animStart === -1) this.animStart = t;

    const timeOffset = t - this.animStart;
    let delta = (this.animRevert) ? TRANSFORM_KING - timeOffset : timeOffset;

    if (delta <= 0 && this.animRevert) {
      delta = 0;
      this.transformed();
    } else if (delta >= TRANSFORM_KING && !this.animRevert) {
      delta = TRANSFORM_KING;
      this.transformed();
    }

    const half_offset = TRANSFORM_KING / 2;
    this.currOffset = (delta >= half_offset) ?
      delta * 2 / TRANSFORM_KING :
      Math.min(delta, half_offset) / half_offset; 
  }
}
