import { CGFappearance } from "../../lib/CGF.js";
import { PIECE_THICKNESS } from "./GamePiece.js";
import { MyCylindricalPatch } from "../components/MyCylindricalPatch.js";

/**
 * PieceSupport
 * @constructor
 * @param scene - reference to CGFscene object
 * @param dimensions - support's dimensions
 * @param position - support's position
 * @param palette - support's palette
 * @param scaleFactor - scale factor to be applied to the stored pieces
 */
export class PieceSupport {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {object} dimensions - support's dimensions
   * @param {object} position - support's position
   * @param {object} palette - support's palette
   * @param {float} scaleFactor - scale factor to be applied to the stored pieces
   */
  constructor(scene, dimensions, position, palette, scaleFactor) {
    this.scene = scene;

    this.scaleFactor = scaleFactor;
    this.dimensions = dimensions;
    this.position = position;
    this.pieces = [];

    this.initMaterials(palette);
    this.initPrimitives();
  }

  /**
   * Initializes support's materials
   * @method initMaterials 
   * @param {object} palette 
   */
  initMaterials(palette) {
    this.greyMaterial = new CGFappearance(this.scene);
    this.greyMaterial.setAmbient(
      palette.grey.r,
      palette.grey.g,
      palette.grey.b,
      1
    );
    this.greyMaterial.setDiffuse(
      palette.grey.r,
      palette.grey.g,
      palette.grey.b,
      1
    );
    this.greyMaterial.setSpecular(
      palette.grey.r,
      palette.grey.g,
      palette.grey.b,
      1
    );
    this.greyMaterial.setEmission(0, 0, 0, 1);
    this.greyMaterial.setShininess(10);
  }

  /**
   * Initializes support's primitives
   * @method initPrimitives
   */
  initPrimitives() {
    this.cylinder = new MyCylindricalPatch(this.scene);
  }

  /**
   * Gets the position of the support
   * @returns {object} support's position
   */
  getPosition() {
    return { ... this.position };
  }

  /**
   * Gets the height of the support
   * @returns {float} support's height
   */
  getHeight() {
    return this.dimensions.height;
  }

  /**
   * Gets the scale factor of the support
   * @returns {float} support's scale factor
   */
  getScaleFactor() {
    return this.scaleFactor;
  }

  /**
   * Gets the height value in which the next piece will be stored
   * @returns {float} height of the next stored piece
   */
  getPiecePosition() {
    return this.pieces.length * -PIECE_THICKNESS * this.scaleFactor;
  }

  /**
   * Pushes a piece to the support
   * @method pushPiece
   * @param {GamePiece} piece
   */
  pushPiece(piece) {
    this.pieces.push(piece);
  }

  /**
   * Pops a piece from the support
   * @method popPiece
   * @returns {GamePiece} piece on top of the support
   */
  popPiece() {
    return this.pieces.pop();
  }

  /**
   * Displays the support structure
   * @method display
   */
  displaySupport() {
    let matrix = mat4.create();

    // base
    this.scene.pushMatrix();
    mat4.scale(matrix, mat4.create(), [
      this.dimensions.baseRadius,
      this.dimensions.baseHeight,
      this.dimensions.baseRadius,
    ]);
    this.scene.multMatrix(matrix);
    this.cylinder.display();
    this.scene.popMatrix();

    this.scene.pushMatrix();
    mat4.scale(matrix, mat4.create(), [
      this.dimensions.radius,
      this.dimensions.height,
      this.dimensions.radius,
    ]);
    this.scene.multMatrix(matrix);
    this.cylinder.display();
    this.scene.popMatrix();
  }

  /**
   * Displays a piece on the support
   * @param {GamePiece} piece - piece to be displayed
   * @param {float} offset - translation offset
   */
  displayPiece(piece, offset) {
    let matrix = mat4.create();

    this.scene.pushMatrix();
    mat4.translate(matrix, matrix, [0, 0, offset * -PIECE_THICKNESS * this.scaleFactor]);
    this.scene.multMatrix(matrix);
    piece.display();
    this.scene.popMatrix();
  }

  /**
   * Displays all pieces on the support
   * @method displayPieces
   */
  displayPieces() {
    let matrix = mat4.create();

    this.scene.pushMatrix();
    mat4.translate(matrix, matrix, [0, this.dimensions.baseHeight + 0.05, 0]);
    mat4.rotateX(matrix, matrix, 1.57);
    mat4.scale(matrix, matrix, [this.scaleFactor, this.scaleFactor, 1]);
    mat4.translate(matrix, matrix, [-0.5, -0.5, 0.0536]); // TODO: try to eliminate magic numbers like these
    this.scene.multMatrix(matrix);
    this.pieces.forEach((piece, index) => this.displayPiece(piece, index));
    this.scene.popMatrix();
  }

  /**
   * Displays the support
   * @method display
   */
  display() {
    let matrix = mat4.create();

    this.scene.pushMatrix();
    this.greyMaterial.apply();
    mat4.translate(matrix, matrix, [this.position.x, 0, this.position.z]);
    this.scene.multMatrix(matrix);
    this.displaySupport();
    if (this.pieces.length !== 0) this.displayPieces();
    this.scene.popMatrix();
  }
}
