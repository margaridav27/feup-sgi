import { MyAnimation } from "./MyAnimation.js";

/**
 * MyKeyframeAnimation
 * @constructor
 * @param keyframes - array of the animation keyframes
 * @param loopTime - time of the animation loop
 */
export class MyKeyframeAnimation extends MyAnimation {
  /**
   * @constructor
   * @param {array} keyframes - array of the animation keyframes
   * @param {float} loopTime - time of the animation loop
   */
  constructor(keyframes, loopTime = null) {
    super();

    this.setKeyframes(keyframes);

    this.loop = loopTime !== null;
    this.loopTime = loopTime;

    this.currMatrix = mat4.create();
  }

  /**
   * Sets the keyframes array
   * @method setKeyframes
   * @param {array} keyframes - array of the animation keyframes
   */
  setKeyframes(keyframes) {
    this.keyframes = [];
    keyframes.forEach((keyframe) => {
      const instant = keyframe.instant;
      const translation = vec3.fromValues(
        keyframe.translation[0],
        keyframe.translation[1],
        keyframe.translation[2]
      );
      const rotation = vec3.fromValues(
        keyframe.rotation[2].angle,
        keyframe.rotation[1].angle,
        keyframe.rotation[0].angle
      );
      const scale = vec3.fromValues(
        keyframe.scale[0],
        keyframe.scale[1],
        keyframe.scale[2]
      );
      this.keyframes = [
        ...this.keyframes,
        { instant, translation, rotation, scale },
      ];
    });
    //sort based on instant
    this.keyframes.sort((kf1, kf2) => {
      const instant1 = kf1.instant;
      const instant2 = kf2.instant;
      if (instant1 === instant2) return 0;
      return instant1 > instant2 ? 1 : -1;
    });
  }

  /**
   * Gets real transformation matrix correspondent to the instant t
   * @method getDeltaMatrix
   * @param {object} currKeyframe - current keyframe
   * @param {object} nextKeyframe - next keyframe
   * @param {float} t - currentTime
   * @returns {mat4} transformation matrix 
   */
  getDeltaMatrix(currKeyframe, nextKeyframe, t) {
    const ratio =
      (t - currKeyframe.instant) /
      Math.abs(nextKeyframe.instant - currKeyframe.instant);

    const translation = vec3.create();
    vec3.lerp(
      translation,
      currKeyframe.translation,
      nextKeyframe.translation,
      ratio
    );

    const rotation = vec3.create();
    vec3.lerp(rotation, currKeyframe.rotation, nextKeyframe.rotation, ratio);

    const scale = vec3.create();
    vec3.lerp(scale, currKeyframe.scale, nextKeyframe.scale, ratio);

    let result = mat4.create();
    mat4.translate(result, result, translation);
    mat4.rotateZ(result, result, rotation[2]);
    mat4.rotateY(result, result, rotation[1]);
    mat4.rotateX(result, result, rotation[0]);
    mat4.scale(result, result, scale);

    return result;
  }

  /**
   * Gets current and next keyframes considering the instant t
   * @method getInterval
   * @param {float} t - currentTime
   * @returns {[currKeyframe, nextKeyframe]} current and next keyframes
   */
  getInterval(t) {
    const nKeyframes = this.keyframes.length;
    for (let i = 0; i < nKeyframes; i++) {
      const currKeyframe = this.keyframes[i];
      if (i + 1 === nKeyframes && t >= currKeyframe.instant) {
        const restartAnimation = this.loop && this.keyframes[0].instant === 0;
        return [currKeyframe, restartAnimation ? this.keyframes[0] : null];
      }

      const nextKeyframe = this.keyframes[i + 1];
      if (currKeyframe.instant <= t && t < nextKeyframe.instant)
        return [currKeyframe, nextKeyframe];
    }

    return [null, null];
  }

  /**
   * Update function, called periodically, which updates the current transformation matrix
   * @method update
   * @param {float} t currentTime
   */
  update(t) {
    const tSeconds = this.loop ? t % this.loopTime : t;

    const [curr, next] = this.getInterval(tSeconds);

    if (curr === null) this.currMatrix = null;

    if (next === null) return null;

    this.currMatrix = this.getDeltaMatrix(curr, next, tSeconds);
  }

  /**
   * Applies current transformation matrix
   * @method apply
   * @returns {mat4} current transformation matrix
   */
  apply() {
    return this.currMatrix;
  }
}
