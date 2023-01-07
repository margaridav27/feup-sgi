import { MyKeyframeAnimation } from "./MyKeyframeAnimation.js";

/**
 * MyPickableAnimation
 * @constructor
 * @param keyframes - array of the animation keyframes
 */
export class MyPickableAnimation extends MyKeyframeAnimation {
  /**
   * @constructor
   * @param {array} keyframes - array of the animation keyframes
   */
  constructor(keyframes) {
    super(keyframes);

    this.pickTime = undefined;
    this.reverse = false;
    this.picked = false;
    this.maxAnimationTime = this.keyframes.at(-1).instant;
  }

  /**
   * Sets the animation as picked, if it is not already
   * @method handlePick
   */
  handlePick() {
    if (this.picked) return;
    this.picked = true;
  }

  /**
   * Update function, called periodically, which updates the current transformation matrix
   * @method update
   * @param {float} t - currentTime
   */
  update(t) {
    // The animation update only works upon picking
    if (!this.picked) return;

    if (this.pickTime === undefined) this.pickTime = t;
    const deltaT = t - this.pickTime;
    const tSeconds = this.reverse
      ? Math.max(this.maxAnimationTime - deltaT, 0)
      : Math.min(this.maxAnimationTime, deltaT);

    let [curr, next] = this.getInterval(tSeconds);

    if (curr === null) this.currMatrix = null;
    const lastKeyFrame = next === null;

    // Reset picking related attributes
    if (
      (lastKeyFrame && !this.reverse) ||
      (tSeconds <= this.keyframes[0].instant && this.reverse)
    ) {
      this.picked = false;
      this.pickTime = undefined;
      this.reverse = !this.reverse;
    }

    if (lastKeyFrame) return;

    this.currMatrix = this.getDeltaMatrix(curr, next, tSeconds);
  }
}
