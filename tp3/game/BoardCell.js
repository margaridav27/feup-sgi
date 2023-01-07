import { CGFappearance, CGFscene, CGFshader } from "../../lib/CGF.js";
import { MyPieceCaptureAnimation } from "../animations/MyPieceCaptureAnimation.js";
import { MyRectangle } from "../primitives/MyRectangle.js";
import { END_ANIMATION, DURING_ANIMATION, NO_ANIMATION } from "./Board.js";
import { OUTER_DIAMETER } from "./GamePiece.js";

export const CAPTURE = 1;
export const MOVE = 0;
const DISPLAY_OFFSET = 25;
const CELL_FALL = 6;
const FALL_SPEED = 0.006;
const PIECE_DIST_OFFSET = -0.6;
const PIECE_TIME_OFFSET = 100;
const LARGE_COLLISION_OFFSET = 0.075;
const SMALL_COLLISION_OFFSET = 0.005;

const TRACKING_LIGHT_ID = "piece-spot";
const TRACKING_LIGHT_INDEX = 7;

/**
 * BoardCell
   * @constructor
   * @param scene - reference to CGFscene object
   * @param id - cell's identifier
   * @param size - cell's size
   * @param position - cell's position
   * @param color - cell's color
   * @param piece - cell's piece | undefined if it is an empty cell
 */
export class BoardCell {
  /**
   * @constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {integer} id - cell's identifier
   * @param {float} size - cell's size
   * @param {{row: integer, col: integer}} position - cell's position
   * @param {{r: float, g: float, b: float}} color - cell's color
   * @param {GamePiece | undefined} piece - cell's piece | undefined if it is an empty cell
   */
  constructor(scene, id, size, position, color, piece = undefined) {
    this.scene = scene;

    this.id = id;
    this.size = size;
    this.position = position;
    this.collisionOffset = this.size > 0.5 ? LARGE_COLLISION_OFFSET:SMALL_COLLISION_OFFSET;

    this.piece = piece;
    this.movingPiece = undefined;

    this.callback = undefined;

    this.creationTime = new Date();
    this.firstDisplay = this.id * DISPLAY_OFFSET;
    this.fallAnimEnd = this.creationTime.getTime() + this.firstDisplay + CELL_FALL / FALL_SPEED;

    this.primitive = new MyRectangle(
      this.scene,
      `cell_${this.position["row"]}_${this.position["col"]}`,
      0,
      this.size,
      0,
      this.size
    );

    this.movingAnimationOver = true;
    this.movingPiece = undefined;
    this.callback = undefined;
    this.toKingAnimationisTheKiller = false;
    this.undoStarted = false;
    
    this.initMaterial(color);
    this.initShaders();
    this.captureAnimStarted = false;
    this.captureAnim = new MyPieceCaptureAnimation(this.position, this.size);

    this.trackingLight = undefined;
  }

  /**
   * Initializes cell's materials
   * @method initMaterial
   * @param {{r: float, g: float, b: float}} color - cell's color
   */
  initMaterial(color) {
    this.material = new CGFappearance(this.scene);
    this.material.setAmbient(color.r, color.g, color.b, 1);
    this.material.setDiffuse(color.r, color.g, color.b, 1);
    this.material.setSpecular(color.r, color.g, color.b, 1);
    this.material.setEmission(0, 0, 0, 1);
    this.material.setShininess(10);
  }

  /**
   * Initializes cell's shaders
   * @method initShaders
   */
  initShaders() {
    this.shaderMove = new CGFshader(
      this.scene.gl,
      "shaders/validMove.vert",
      "shaders/validMove.frag"
    );
    this.shaderMove.setUniformsValues({
      uSampler: 0,
      color: [1, 1, 0],
    });

    this.shaderCapture = new CGFshader(
      this.scene.gl,
      "shaders/validMove.vert",
      "shaders/validMove.frag"
    );
    this.shaderCapture.setUniformsValues({
      uSampler: 0,
      color: [0, 1, 0],
    });
  }

  /**
   * Gets the cell's identifier
   * @method getID
   * @returns {integer} cell's identifier
   */
  getID() {
    return this.id;
  }

  /**
   * Gets the cell's position
   * @method getPosition
   * @returns {{row: integer, col: integer}} cell's position'
   */
  getPosition() {
    return this.position;
  }

  /**
   * Gets the duration of its piece's move animation
   * @method getAnimDuration
   * @param {BoardCell} to - piece's new cell
   * @returns {float | -1} duration of the move according to the cells distance and the
   *  piece speed, -1 if the cell is empty 
   */
  getAnimDuration(to) {
    if (this.isEmpty()) return -1;
    const toPosition = to.getPosition();
    const distance = Math.sqrt(
      Math.pow(this.position["row"] - toPosition["row"], 2) +
        Math.pow(this.position["col"] - toPosition["col"], 2)
    );
    return distance / this.piece.getSpeed();
  }

  /**
   * Gets the size of the cell
   * @method getSize
   * @returns {float} cell's size
   */
  getSize() {
    return this.size;
  }

  /**
   * Gets the cell's piece
   * @method getPiece
   * @returns {GamePiece | undefined} cell's previous piece | undefined if the cell was empty
   */
  getPiece() {
    return this.piece;
  }

  /**
   * Sets the cell's piece
   * @method setPiece
   * @param {GamePiece} piece - cell's new piece 
   */
  setPiece(piece) {
    this.piece = piece;
  }

  /**
   * Sets the cell as empty
   * @method setEmpty
   * @returns {GamePiece | undefined} cell's previous piece | undefined if the cell was empty
   */
  setEmpty() {
    const piece = this.piece;
    this.piece = undefined;
    return piece;
  }

  /**
   * Determines if the cell is empty
   * @method isEmpty
   * @returns true if it is empty, false otherwise
   */
  isEmpty() {
    return this.piece === undefined;
  }

  /**
   * Determines if the capture animation has already started
   * @method captureAnimHasStarted
   * @returns {boolean} true if it has already started, false otherwise
   */
  captureAnimHasStarted() {
    return this.captureAnimStarted;
  }

  /**
   * Determines if the capture animation is over
   * @method captureAnimIsOver
   * @returns {boolean} true if it is over, false otherwise
   */
  captureAnimIsOver() {
    return !this.captureAnim.isActive();
  }

  /**
   * Resets the information about the capture animation
   * @method resetCaptureAnim
   */
  resetCaptureAnim() {
    this.captureAnimStarted = false;
  }

  /**
   * Reverts the capture animation
   * @method revertAnim
   * @param {object} from - support where the piece is stored 
   * @param {boolean} wasKing - true if the piece was king before the capture, false otherwise 
   * @param {GamePiece} piece - previously captured piece
   */
  revertAnim(from, wasKing, piece) {
    this.captureAnimStarted = true;

    const capturedWasKing = ((t) => {
      if (wasKing && !piece.getIsKing()) {
        if (!piece.isTransforming()) piece.setKing();
        else piece.update(t);
        return true;
      }
      return false;
    }).bind(this);

    this.captureAnim.revertAnim(from, capturedWasKing);
  }

  /**
   * Starts the capture animation
   * @method startCaptureAnim
   * @param {object} to - support where the piece should be stored 
   * @param {float} t - currentTime 
   * @param {function} callback - function to be called when the animation overs
   * @returns 
   */
  startCaptureAnim(to, t, callback) {
    if (this.captureAnim.isActive()) return;

    this.captureAnimStarted = true;
    this.captureAnim.startAnim(to, t, callback);
  }

  /**
   * Function to be called when the moving animation ends
   * @method endMovingAnimation
   * @returns {DURING_ANIMATION | END_ANIMATION} state of the moving animation (-1: during animation | 0: end animation)
   */
  endMovingAnimation() {
    this.movingAnimationOver = true;
    if (this.movingPiece.toKing) {
      this.piece.setKing();
      if (this.movingPiece.capture === undefined)
        this.toKingAnimationisTheKiller = true;
      return DURING_ANIMATION;
    }
    return END_ANIMATION;
  }

  /**
   * Function called when all the animations of a move are over
   * @method animationsOver
   */
  animationsOver() {
    this.undoStarted = false;
    this.toKingAnimationisTheKiller = false;

    this.movingPiece.to.setPiece(this.piece);
    this.setEmpty();
    this.movingPiece = undefined;

    this.turnOffTrackingLight();

    this.callback();
    this.callback = undefined;
  }

  /**
   * Function called when the capture animation of the opponent's piece is over
   * @method captureAnimOver
  */
  captureAnimOver() {
    if (this.movingPiece.capture !== undefined) {
      this.movingPiece.capture.capturedCell.resetCaptureAnim();
    }

    const pieceTransforming = this.movingAnimationOver && this.movingPiece.toKing && this.piece.isTransforming();
    if (!this.movingAnimationOver || pieceTransforming) {
      // the animationsOver function should be called when the animation of transforming into king is over
      this.toKingAnimationisTheKiller = true;
      return;
    }

    this.animationsOver();
  }

  /**
   * Determines if the creation animation is over
   * @method creationAnimIsOver
   * @returns {boolean} true if it is over, false otherwise  
   */
  creationAnimIsOver() {
    return this.fallAnimEnd === undefined;
  }

  /**
   * Undos a capture
   * @method undoCapture
   */
  undoCapture() {
    this.undoStarted = true;
    this.movingPiece.captureSupp.popPiece();
    this.movingPiece.capture.capturedCell.setPiece(this.movingPiece.capture.capturedPiece);
    
    const wasKing = this.movingPiece.undo !== undefined ? this.movingPiece.undo.wasKing : false;
    this.movingPiece.capture.capturedCell.revertAnim(this.movingPiece.captureSupp, wasKing, this.movingPiece.capture.capturedPiece);
  }

  /**
   * Moves the cell's piece to another cell and executes the capture/undo capture
   *  animation if it necessary
   * @method movePiece
   * @param {BoardCell} to - piece's new cell
   * @param {{capturedCell: BoardCell, capturedPiece: GamePiece, support: object} | undefined} capture - capturedCell and capturedPiece if it is a capture move | undefined otherwise
   * @param {object} support - support where the piece should be stored if exists a capture
   * @param {function} callback - function to be called when all the animations are over
   * @param {{toKing: boolean, wasKing: boolean} | undefined} undo - undo's information | undefined if the move is not an undo
   */
  movePiece(to, capture, support, callback, undo=undefined) {
    this.movingAnimationOver = false;
    this.callback = callback;

    const duration = this.getAnimDuration(to);
    if (duration === -1) return;

    let toKing = false;
    if (!this.piece.getIsKing()) {
      const toCol = to.getPosition().col;
      toKing = this.piece.getPlayer() ? toCol === 7 : toCol === 0;
    }

    let collision = undefined;
    if (capture !== undefined) {
      const { row } = capture.capturedCell.getPosition();
      const rowOffset = Math.abs(this.position.row - row) === 1 ? 0 : Math.abs(this.position.row - row);
      collision = Math.sqrt(Math.pow(this.size, 2) * 2) - OUTER_DIAMETER * support.scaleFactor + rowOffset;
    }

    this.movingPiece = {
      to: to,
      toKing: toKing,
      capture: capture,
      undo: undo,
      captureSupp: support,
      firstUpdate: undefined,
      duration: duration,
      currMatrix: mat4.create(),
      collision: collision
    };

    if (undo !== undefined) {
      if (undo.toKing) this.piece.unsetKing();
      if (capture !== undefined) this.undoCapture();
    }
  }

  /**
   * Displays the cell's piece
   * @method displayPiece
   */
  displayPiece() {
    if (this.piece === undefined) return;

    const wasCaptured = this.captureAnim.isActive();
    const pieceIsMoving = (this.movingPiece !== undefined) || wasCaptured;

    if (pieceIsMoving) {
      this.scene.pushMatrix();
      this.scene.multMatrix(wasCaptured ? this.captureAnim.apply() : this.movingPiece.currMatrix);
    }
    
    this.piece.display();
    if (pieceIsMoving) this.scene.popMatrix();
  }

  /**
   * Displays the cell
   * @method display
   * @param {MOVE | CAPTURE | undefined} cellType - determines the shader that should be applied to the cell (MOVE: 0, CAPTURE: 1), none if undefined
   * @param {mat4 | undefined} transMatrix - transformation matrix that should be applied to the piece when an invalid pick occurs
   */
  display(cellType = undefined, transMatrix = undefined) {
    const currDateTime = new Date().getTime();
    if (this.creationTime !== undefined) {
      if (
        currDateTime - this.creationTime.getTime() <
        this.firstDisplay
      )
        return;
      this.creationTime = undefined;
    }

    this.scene.pushMatrix();

    let matrix = mat4.create(); // cell's matrix
    const pieceOffset = mat4.create(); // offset during the fall animation

    if (this.fallAnimEnd !== undefined) {
      const t = this.fallAnimEnd - currDateTime;
      let y = t * FALL_SPEED;
      let piece_dist = PIECE_DIST_OFFSET;

      if (t <= 0) {
        y = 0;
        const piece_time = t + PIECE_TIME_OFFSET;
        if (piece_time <= 0) {
          piece_dist = 0;
          this.fallAnimEnd = undefined;
        } else {
          const ratio = piece_time / PIECE_TIME_OFFSET;
          piece_dist *= ratio;
        }
      }

      // fall animation offset
      mat4.translate(pieceOffset, pieceOffset, [0, 0, piece_dist]);
      mat4.translate(matrix, matrix, [0, y, 0]);
    }

    // cell's position
    mat4.translate(matrix, matrix, [
      this.position["row"] * this.size,
      0,
      this.position["col"] * this.size,
    ]);
    mat4.rotateX(matrix, matrix, 1.57);
    this.scene.multMatrix(matrix);

    if (cellType !== undefined) {
      if (cellType === MOVE) this.scene.setActiveShader(this.shaderMove);
      else this.scene.setActiveShader(this.shaderCapture);
    }

    this.material.apply();
    this.primitive.display();

    if (cellType !== undefined)
      this.scene.setActiveShader(this.scene.defaultShader);

    this.scene.multMatrix(pieceOffset);
    mat4.scale(matrix, mat4.create(), [this.size, this.size, 1]);
    this.scene.multMatrix(matrix);
    if (transMatrix !== undefined) this.scene.multMatrix(transMatrix);
    this.displayPiece();
    this.scene.popMatrix();
  }

  /**
   * Turns on the tracking light
   * @method turnOnTrackingLight
   * @param {{x: float, z: float}} offset - board's position 
   */
  turnOnTrackingLight(offset) {
    const height = this.size === 0.75 ? 0.75 : 0.5;
    const target = [
      offset.x + this.position.row * this.size + this.size / 2,
      0.0,
      offset.z + this.position.col * this.size + this.size / 2,
    ];
    const position = [target[0], height, target[2], 1.0];
    const angle = Math.atan(this.size / 2 / height) * (180 / Math.PI);

    const trackingLight = this.scene.lights[TRACKING_LIGHT_INDEX];

    // adjust position, direction and cut off angle
    trackingLight.setPosition(
      position[0],
      position[1],
      position[2],
      position[3]
    );
    trackingLight.setSpotDirection(
      target[0] - position[0],
      target[1] - position[1],
      target[2] - position[2]
    );
    trackingLight.setSpotCutOff(angle);

    // adjust color
    const color = Object.values(this.piece.getColor());
    trackingLight.setDiffuse(color[0], color[1], color[2], 1.0);
    trackingLight.setSpecular(color[0], color[1], color[2], 1.0);

    this.scene.turnOnLight(TRACKING_LIGHT_ID);
    if (this.size > 0.5) trackingLight.setVisible(true);
    trackingLight.update();

    this.trackingLight = {
      light: trackingLight,
      originalPosition: position,
    }
  }

  /**
   * Turns off the tracking light
   * @method turnOffTrackingLight
   */
  turnOffTrackingLight() {
    if (this.trackingLight === undefined) return;
    this.scene.turnOffLight(TRACKING_LIGHT_ID);
    this.trackingLight.light.setVisible(false);
    this.trackingLight = undefined;
  }

  /**
   * Update function, called periodically, which updates the animation of transform to king
   * @method transformToKing
   * @param {float} t - currTime 
   * @returns {DURING_ANIMATION | END_ANIMATION | NO_ANIMATION} state of animation (-1: during animation | 0: end animation | 1: no animation)
   */
  transformToKing(t) {
    if (this.movingPiece.toKing && this.piece.isTransforming()) {
      this.piece.update(t);
      return DURING_ANIMATION;
    }
    if (this.toKingAnimationisTheKiller) {
      this.animationsOver();
      return NO_ANIMATION;
    }
    return END_ANIMATION;
  }

  /**
	 * Updates the tracking light position
   * @method updateTrackingLight
   * @param {vec3} translation - translation that should be applied to the tracking light
   */
  updateTrackingLight(translation) {
    if (this.trackingLight === undefined) return;

    const offset = { x: translation[0] * this.size, z: translation[1] * this.size }
    this.trackingLight.light.setPosition(
      this.trackingLight.originalPosition[0] + offset.x,
      this.trackingLight.originalPosition[1],
      this.trackingLight.originalPosition[2] + offset.z,
      this.trackingLight.originalPosition[3]
    );
    this.trackingLight.light.update();
  }

  /**
	 * Update function, called periodically, which updates the cell's shader
   * @method updateShader
   * @param {float} t - currentTime
   */
  updateShader(t) {
    const timeFactor = (t / 250) % 6.28;
    this.shaderMove.setUniformsValues({ timeFactor });
    this.shaderCapture.setUniformsValues({ timeFactor });
  }

  /**
   * Updates the moving piece current matrix and the tracking light
   * @method updateCurrMatrix
   * @param {float} t - currentTime
   * @returns {float} distance that the piece is translated
   */
  updateCurrMatrix(t) {
    const toPosition = this.movingPiece.to.getPosition();
    const delta = t / this.movingPiece.duration;
    const deltaRow = (toPosition["row"] - this.position["row"]) * delta;
    const deltaCol = (toPosition["col"] - this.position["col"]) * delta;
    const translation = [
      deltaRow,
      deltaCol,
      0,
    ];
    mat4.translate(this.movingPiece.currMatrix, mat4.create(), translation);

    this.updateTrackingLight(translation);
    
    return Math.sqrt(Math.pow(deltaRow, 2) + Math.pow(deltaCol, 2));
  }

  /**
	 * Update function, called periodically, which updates the cell components
   * @method update
   * @param {float} t - currentTime 
   * @returns {DURING_ANIMATION | END_ANIMATION | NO_ANIMATION} state of the animations (-1: during animation | 0: end animation | 1: no animation)
   */
  update(t) {
    const tSeconds = t / 1000;
    let returnValue = DURING_ANIMATION;
  
    if (this.movingPiece !== undefined && this.movingPiece.capture !== undefined) {
      const captureOver = this.movingPiece.capture.capturedCell.captureAnimHasStarted() && this.movingPiece.capture.capturedCell.captureAnimIsOver();
      if (captureOver && !this.movingPiece.capture.capturedPiece.isTransforming())
        this.captureAnimOver();
      else this.movingPiece.capture.capturedCell.update(t); // update its captureAnim
    }

    // update its animation and its piece
    this.captureAnim.update(tSeconds);
    if (this.piece !== undefined && this.piece.isTransforming()) {
      this.piece.update(tSeconds);
      return DURING_ANIMATION;
    }

    // if all animations are over
    if (this.movingPiece === undefined) return NO_ANIMATION;

    if (this.movingAnimationOver) return this.transformToKing(tSeconds);

    if (this.movingPiece.firstUpdate === undefined) this.movingPiece.firstUpdate = t / 100;
    const currInstant = Math.min((t / 100) - this.movingPiece.firstUpdate, this.movingPiece.duration);
    if (currInstant === this.movingPiece.duration)
      returnValue = this.endMovingAnimation();
    
    const deltaV = this.updateCurrMatrix(currInstant);
    const startCapturedMove = this.movingPiece.capture !== undefined &&
      deltaV >= (this.movingPiece.collision - this.collisionOffset) &&
      !this.movingPiece.capture.capturedCell.captureAnimHasStarted();
    // start the other piece animation
    if (!this.movingPiece.undo && startCapturedMove) {
      this.movingPiece.capture.capturedCell.startCaptureAnim(
        this.movingPiece.captureSupp,
        tSeconds,
        () => {
          this.movingPiece.capture.capturedCell.setEmpty();
          this.movingPiece.captureSupp.pushPiece(this.movingPiece.capture.capturedPiece);
        }
      );

      // If the captured piece is a king piece, it should transform
      // to a normal piece to be stored in the support
      if (this.movingPiece.capture.capturedPiece.getIsKing()) {
        this.movingPiece.capture.capturedPiece.unsetKing();
      }
    }

    if (returnValue === END_ANIMATION && this.movingPiece.capture === undefined)
      this.animationsOver();

		return returnValue;
  }
}
