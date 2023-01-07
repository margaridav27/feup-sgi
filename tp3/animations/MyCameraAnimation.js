import { CGFcamera } from "../../../lib/CGF.js";

/**
 * MyCameraAnimation
 * @constructor
 * @param scene - reference to CGFscene object
 * @param fromCamera - ID or index of the camera to animate from
 * @param toCamera - ID or index of the camera to animate to
 */
export class MyCameraAnimation {
  /**
   * @constructor
   * @param {CGFscene} scene
   * @param {string | integer | CGFcamera} fromCamera
   * @param {string | integer | CGFcamera} toCamera
   */
  constructor(scene, fromCamera, toCamera) {
    this.scene = scene;

    // camera animations are turned off
    if (!this.scene.cameraAnimations) {
      this.active = false;
      return;
    }

    this.initCameras(fromCamera, toCamera);

    this.duration = this.scene.cameraAnimationsDuration;
    this.startTime = undefined;
    this.active = true;
  }

  /**
   * Gets a CGFcamera object from either its ID or index
   * @method getCamera
   * @param {string | integer | CGFcamera} camera
   * @returns {CGFcamera} - camera object
   */
  getCamera(camera) {
    if (camera instanceof CGFcamera) return camera;

    const cameraIndex =
      typeof camera === "string" ? this.scene.camerasIDs[camera] : camera;

    return this.scene.cameras[cameraIndex];
  }

  /**
   * Initializes the cameras
   * @method initCameras
   * @param {string | integer | CGFcamera} fromCamera
   * @param {string | integer | CGFcamera} toCamera
   */
  initCameras(fromCamera, toCamera) {
    let from = this.getCamera(fromCamera);
    this.fromCamera = {
      near: from.near,
      far: from.far,
      fov: from.fov,
      up: new Float32Array(from._up),
      position: new Float32Array(from.position),
      target: new Float32Array(from.target),
    };

    let to = this.getCamera(toCamera);
    this.toCamera = {
      near: to.near,
      far: to.far,
      fov: to.fov,
      up: new Float32Array(to._up),
      position: new Float32Array(to.position),
      target: new Float32Array(to.target),
    };
  }

  /**
   * Update function, called periodically, which calculates the values of the camera at a given moment
   * @method update
   * @param {float} t - current time in milliseconds
   */
  update(t) {
    if (!this.active) {
      this.scene.animatedCamera = undefined;
      return;
    }

    if (this.startTime === undefined) this.startTime = t;
    const elapsedTime = t - this.startTime;

    let near = this.toCamera.near;
    let far = this.toCamera.far;
    let fov = this.toCamera.fov;
    let up = this.toCamera.up;
    let position = this.toCamera.position;
    let target = this.toCamera.target;

    if (elapsedTime <= this.duration) {
      const percentageTime = 1 - (this.duration - elapsedTime) / this.duration;

      near = this.toCamera.near + percentageTime * (this.fromCamera.near - this.toCamera.near);
      far = this.toCamera.far + percentageTime * (this.fromCamera.far - this.toCamera.far);
      fov = this.toCamera.fov + percentageTime * (this.fromCamera.fov - this.toCamera.fov);

      position = vec3.create();
      vec3.lerp(
        position,
        this.fromCamera.position,
        this.toCamera.position,
        percentageTime
      );

      target = vec3.create();
      vec3.lerp(
        target,
        this.fromCamera.target,
        this.toCamera.target,
        percentageTime
      );

      up = vec3.create();
      vec3.lerp(
        up, 
        this.fromCamera.up, 
        this.toCamera.up, 
        percentageTime
      );
    } else {
      this.startTime = undefined;
      this.active = false;
    }

    this.activateCamera(near, far, fov, up, position, target);
  }

  /**
   * Activates the current camera to the scene
   * @method activateCamera
   */
  activateCamera(near, far, fov, up, position, target) {
    this.scene.camera.near = near;
    this.scene.camera.far = far;
    this.scene.camera.fov = fov;
    this.scene.camera._up = new Float32Array(up);
    this.scene.camera.position = new Float32Array(position);
    this.scene.camera.target = new Float32Array(target);
  }
}
