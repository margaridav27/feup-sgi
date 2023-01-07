const UP_DOWN_DURATION = 0.3;
const BEZIER_DURATION = 1;
const LARGE_UP_OFFSET = 1.5;
const LARGE_BEZIER_P2_HEIGHT = 5;
const SMALL_UP_OFFSET = 0.5;
const SMALL_BEZIER_P2_HEIGHT = 1;

/**
 * MyPieceCaptureAnimation
 * @constructor
 * @param cellPosition - position of the cell
 * @param cellSide - length of the cell side
 */
export class MyPieceCaptureAnimation {
  /**
   * @constructor
   * @param {{row: number, col: number}} cellPosition - position of the cell
   * @param {float} cellSide - length of the cell side
   */
  constructor(cellPosition, cellSide) {
    this.cellSide = cellSide;
    this.cellPosition = cellPosition;
    this.p1 = {
      position: vec3.fromValues(0, 0,this.cellSide > 0.5 ? -LARGE_UP_OFFSET:-SMALL_UP_OFFSET ),
      rotation: vec3.fromValues(1.57, 0, 0),
    };
    this.p2 = undefined;
    this.p3 = undefined;
    this.finalPos = undefined;
    this.curveDuration = undefined;
    this.animDuration = undefined;
    this.scaleFactor = undefined;

    this.animStart = undefined;
    this.currMatrix = undefined;
    this.capturedWasKing = undefined;
    this.revert = false;
    this.callback = undefined;
  }

  /**
   * Determines if the animation is active
   * @method isActive
   * @returns {boolean} true if the animation is active, false otherwise
   */
  isActive() {
    return this.animStart !== undefined;
  }

  /**
   * Starts the animation
   * @method startAnim
   * @param {object} to - final position of the move
   * @param {number} t - currentTime 
   * @param {function} callback - function to be called when the animation overs 
   */
  startAnim(to, t, callback) {
    this.setTo(to);
    this.animStart = t;
    this.currMatrix = mat4.create();
    this.callback = callback;
    this.update(t);
  }

  /**
   * Starts a reverted animation
   * @method revertAnim
   * @param {object} to - final position of the move
   * @param {boolean} capturedWasKing - true if the piece was a king, false otherwise
   */
  revertAnim(to, capturedWasKing) {
    this.setTo(to);
    this.capturedWasKing = capturedWasKing;
    this.revert = true;
    this.animStart = -1;
    this.updateCurrMatrix(...this.getTransformationsFinalTrack(1));
  }

  /**
   * Called when the animation overs
   * @method endAnimation
   */
  endAnimation() {
    this.animStart = undefined;

    if (this.revert) {
      this.revert = false;
      this.capturedWasKing = false;
    }

    if (this.callback !== undefined) {
      this.callback();
      this.callback = undefined;
    }
  }

  /**
   * Updates the animation properties according to the final position of the move
   * @method setTo
   * @param {object} to - final position of the move
   */
  setTo(to) {
    const { row, col } = this.cellPosition;
    const { x, z } = to.position;
    const xValue = (x - ((row +0.5)*this.cellSide))/this.cellSide;
    const zValue = (z - ((col +0.5)*this.cellSide))/this.cellSide;

    this.scaleFactor = to.scaleFactor;
    const p2Height = this.cellSide > 0.5 ? LARGE_BEZIER_P2_HEIGHT : SMALL_BEZIER_P2_HEIGHT;
    this.p2 = vec3.fromValues(xValue / 2, z / 2, -p2Height);
    this.p3 = {
      position: vec3.fromValues(xValue, zValue, -to.height),
      rotation: vec3.fromValues(0, 0, 0),
    };
    this.finalPos = vec3.fromValues(xValue, zValue, to.getPiecePosition());

    this.curveDuration = BEZIER_DURATION;
    this.animDuration = this.curveDuration + 2 * UP_DOWN_DURATION;
  }

  /**
   * Updates the current matrix
   * @method updateCurrMatrix
   * @param {vec3} translation - translation vector
   * @param {vec3} rotation - rotation vector
   * @param {vec3} scale - scale vector
   */
  updateCurrMatrix(translation, rotation) {
    const result = mat4.create();

    mat4.translate(result, result, translation);
    if (this.cellSide > 0.5) {
      mat4.rotateZ(result, result, rotation[2]);
      mat4.rotateY(result, result, rotation[1]);
      mat4.rotateX(result, result, rotation[0]); 
    }

    this.currMatrix = result;
  }

  /**
   * Gets the point of the bezier curve corresponding to t
   * @method getBezierPoint
   * @param {number} t - time 
   * @returns {[x: float, z: float, y: float]} point of the curve
   */
  getBezierPoint(t) {
    const x = (1-t)*(1-t)*this.p1.position[0] + 2*(1-t)*t*this.p2[0] + t*t*this.p3.position[0];
    const z = (1-t)*(1-t)*this.p1.position[1] + 2*(1-t)*t*this.p2[1] + t*t*this.p3.position[1];
    const y = (1-t)*(1-t)*this.p1.position[2] + 2*(1-t)*t*this.p2[2] + t*t*this.p3.position[2];
    return [x, z, y];
  }

  /**
   * Gets the transformations of the first track of the animation according to a ratio 
   * @method getTransformationsInitialTrack
   * @param {float} ratio - ratio value
   * @returns {[translation: vec3, rotation: vec3]} transformations
   */
  getTransformationsInitialTrack(ratio) {
    const translation = vec3.create();
    vec3.lerp(translation, vec3.fromValues(0, 0, 0), this.p1.position, ratio);

    const rotation = vec3.create();
    vec3.lerp(rotation, vec3.fromValues(0, 0, 0), this.p1.rotation, ratio);

    return [translation, rotation];
  }

  /**
   * Gets the transformations of the bezier curve of the animation according to a ratio
   * @method getTransformationsBezierCurve
   * @param {float} ratio - ratio value
   * @returns {[translation: vec3, rotation: vec3]} transformations
   */
  getTransformationsBezierCurve(ratio) {
    const translation = vec3.fromValues(...this.getBezierPoint(ratio));

    const rotation = vec3.create();
    vec3.lerp(rotation, this.p1.rotation, this.p3.rotation, ratio);
    
    return [translation, rotation];
  }
  
  /**
   * Gets the transformations of the final track of the animation according to a ratio 
   * @method getTransformationsFinalTrack
   * @param {float} ratio - ratio value
   * @returns {[translation: vec3, rotation: vec3]} transformations
   */
  getTransformationsFinalTrack(ratio) {
    const translation = vec3.create();
    vec3.lerp(translation, this.p3.position, this.finalPos, ratio);

    const rotation = this.p3.rotation;

    return [translation, rotation];
  }

  /**
   * Update function, called periodically, which updates the transformations matrix
   * @method update
   * @param {number} t currentTime 
   */
  update(t) {
    if (this.animStart === undefined) return;
    if (this.animStart === -1) this.animStart = t;

    const timeOffset = t - this.animStart;
    const delta = (this.revert) ? this.animDuration-timeOffset : timeOffset ;
    let transformations = undefined;

    if (delta < UP_DOWN_DURATION) {
      let ratio = Math.max(delta / UP_DOWN_DURATION, 0);
      if (ratio === 0 && this.revert) {
        const animOver = !this.capturedWasKing(t);
        if (animOver) this.endAnimation();
      }
      transformations = this.getTransformationsInitialTrack(ratio);
    } else if (delta <= UP_DOWN_DURATION + this.curveDuration) {
      const ratio = (delta - UP_DOWN_DURATION) / this.curveDuration;
      transformations = this.getTransformationsBezierCurve(ratio);
    } else {
      let ratio = Math.min((delta - UP_DOWN_DURATION - this.curveDuration) / UP_DOWN_DURATION, 1);
      if (ratio === 1 && !this.revert) this.endAnimation();
      transformations = this.getTransformationsFinalTrack(ratio);
    }
    this.updateCurrMatrix(...transformations);
  }

  /**
   * Gets the current transformations matrix
   * @method apply
   * @returns {mat4} current transformations matrix
   */
  apply() {
    return this.currMatrix; 
  }
}
