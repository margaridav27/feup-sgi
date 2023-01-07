import { CGFscene } from "../lib/CGF.js";
import { CGFaxis, CGFcamera } from "../lib/CGF.js";
import { MyCameraAnimation } from "./animations/MyCameraAnimation.js";

/**
 * XMLscene - representing the scene that is to be rendered
 * @constructor
 * @param myinterface - CGFinterface object
 */
export class XMLscene extends CGFscene {
  /**
   * @constructor
   * @param {CGFinterface} - my interface
   */
  constructor(myinterface) {
    super();

    this.interface = myinterface;

    this.animatedCamera = undefined;
    this.cameraAnimations = true;
    this.cameraAnimationsDuration = 1.5;
  }

  /**
   * Initializes the scene, setting some WebGL defaults, initializing the camera and the axis
   * @method init
   * @param {CGFApplication} - application
   */
  init(application) {
    super.init(application);

    this.sceneInited = false;

    this.camera = new CGFcamera(
      0.4,
      0.1,
      500,
      vec3.fromValues(15, 15, 15),
      vec3.fromValues(0, 0, 0)
    );
    this.cameras = [];
    this.camerasIDs = {};
    this.currentCamera = 0;

    this.enableTextures(true);

    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.axis = new CGFaxis(this);
    this.setUpdatePeriod(1);

    this.enableLights = {};
    this.lightsAttenuation = { constant: 0, linear: 1, quadratic: 2 };
    this.lightsAttenuationValue = {};
    this.lightsIDs = {};
  }

  /**
   * Update function, called periodically
   * @method update
   * @param {float} t - currentTime
   */
  update(t) {
    this.graph.update(t);

    if (this.animatedCamera !== undefined) this.animatedCamera.update(t / 1000);
  }

  /**
   * Initializes the scene cameras
   * @method initCameras
   */
  initCameras() {
    this.cameras = this.graph.views;
    this.camerasIDs = this.graph.viewsIDs;

    if (this.graph.defaultView.left === undefined) // perspective camera
      this.camera = new CGFcamera(
        this.graph.defaultView.fov,
        this.graph.defaultView.near,
        this.graph.defaultView.far,
        this.graph.defaultView.position,
        this.graph.defaultView.target
      );
    else // ortho camera 
      this.camera = new CGFcameraOrtho(
        this.graph.defaultView.left,
        this.graph.defaultView.right,
        this.graph.defaultView.bottom,
        this.graph.defaultView.top,
        this.graph.defaultView.near,
        this.graph.defaultView.far,
        this.graph.defaultView.position,
        this.graph.defaultView.target,
        this.graph.defaultView.up
      );

    this.interface.setActiveCamera(this.camera);

    this.currentCamera = this.graph.defaultViewIndex;

    this.interface.addViews();
  }

  /**
   * Updates the animated camera
   * @method updateAnimatedCamera
   * @param {string} from - fromCamera 
   * @param {string} to - toCamera
   */
  updateAnimatedCamera(from, to) {
    this.animatedCamera = new MyCameraAnimation(
      this,
      from,
      to
    );
  }

  /**
   * Updates currentCamera according to the selected in the interface
   * @method updateCamera
   */
  updateCamera() {
    this.currentCamera = parseInt(this.currentCamera);

    // not an ortho camera
    if (
      this.camera.left === undefined &&
      this.cameras[this.currentCamera].left === undefined
    ) {
      this.animatedCamera = new MyCameraAnimation(
        this,
        this.camera,
        this.currentCamera
      );
    }

    this.camera = this.cameras[this.currentCamera];
  }

  /**
   * Updates the camera animations duration
   * @method updateCameraAnimationsDuration
   * @param {*} duration - new duration
   */
  updateCameraAnimationsDuration(duration) {
    this.cameraAnimationsDuration = duration;
  }

  /**
   * Updates the light attenuation according to the value selected in the interface
   * @method updateLights
   * @param {string} - light's ID
   * @param {float} - attenuation value
   */
  changeAttenuation(light, v) {
    const currentLight = this.lights[this.lightsIDs[light]];
    const constant = v == 0 ? 1 : 0;
    const linear = v == 1 ? 1 : 0;
    const quadratic = v == 2 ? 1 : 0;

    currentLight.setConstantAttenuation(constant);
    currentLight.setLinearAttenuation(linear);
    currentLight.setQuadraticAttenuation(quadratic);
  }

  /**
   * Initializes the scene lights with the values read from the XML file
   * @method initLights
   */
  initLights() {
    var i = 0;
    // Lights index.

    // Reads the lights from the scene graph.
    for (var key in this.graph.lights) {
      if (i >= 8) break; // Only eight lights allowed by WebGL.

      if (this.graph.lights.hasOwnProperty(key)) {
        var light = this.graph.lights[key];
        const lightID = light[light.length - 1];

        this.lights[i].setPosition(
          light[2][0],
          light[2][1],
          light[2][2],
          light[2][3]
        );
        this.lights[i].setAmbient(
          light[3][0],
          light[3][1],
          light[3][2],
          light[3][3]
        );
        this.lights[i].setDiffuse(
          light[4][0],
          light[4][1],
          light[4][2],
          light[4][3]
        );
        this.lights[i].setSpecular(
          light[5][0],
          light[5][1],
          light[5][2],
          light[5][3]
        );

        const [constant, linear, quadratic] = light[light.length - 2];
        let attenuationValue = Math.max(
          constant === 1 ? 0 : 0,
          linear === 1 ? 0 : 1,
          quadratic === 1 ? 0 : 2
        );
        this.lightsAttenuationValue[lightID] = attenuationValue;

        this.lights[i].setConstantAttenuation(constant);
        this.lights[i].setLinearAttenuation(linear);
        this.lights[i].setQuadraticAttenuation(quadratic);

        if (light[1] == "spot") {
          this.lights[i].setSpotCutOff(light[6]);
          this.lights[i].setSpotExponent(light[7]);
          this.lights[i].setSpotDirection(
            light[8][0] - light[2][0],
            light[8][1] - light[2][1],
            light[8][2] - light[2][2]
          );
        }

        this.lights[i].setVisible(false);

        this.enableLights[lightID] = light[0];
        this.lightsIDs[lightID] = i;
        this.interface.addLight(lightID);

        if (light[0]) this.lights[i].enable();
        else this.lights[i].disable();

        this.lights[i].update();

        i++;
      }
    }
  }

  /**
   * Enables/Disables a light, given its ID (method called upon interface event)
   * @method turnOnOffLight
   * @param {string} - light's ID
   */
  turnOnOffLight(light) {
    if (this.lightsIDs[light] === undefined) return;

    const lightIndex = this.lightsIDs[light];

    // is to be turned on
    if (this.enableLights[light]) {
      if (this.lights[lightIndex].enabled) return; // is already on
      this.lights[lightIndex].enable();
    }
    // is to be turned off
    else {
      if (!this.lights[lightIndex].enabled) return; // is already off
      this.lights[lightIndex].disable();
    }
  }

  /**
   * Enables a light, given its ID
   * @method turnOnLight
   * @param {string} - light's ID
   */
  turnOnLight(light) {
    this.enableLights[light] = true;
    this.turnOnOffLight(light);
  }

  /**
   * Disables a light, given its ID
   * @method turnOffLight
   * @param {string} - light's ID
   */
  turnOffLight(light) {
    this.enableLights[light] = false;
    this.turnOnOffLight(light);
  }

  /**
   * Sets a default appearance
   * @method setDefaultAppearance
   */
  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }

  /**
   * Handler called when the graph is finally loaded
   * As loading is asynchronous, this may be called already after the application has started the run loop
   * @method onGraphLoaded
   */
  onGraphLoaded() {
    this.axis = new CGFaxis(this, this.graph.referenceLength);

    this.gl.clearColor(
      this.graph.background[0],
      this.graph.background[1],
      this.graph.background[2],
      this.graph.background[3]
    );

    this.setGlobalAmbientLight(
      this.graph.ambient[0],
      this.graph.ambient[1],
      this.graph.ambient[2],
      this.graph.ambient[3]
    );

    this.initCameras();
    this.initLights();

    this.interface.addEnableNormals();
    this.interface.addEnableCameraAnimations();
    this.interface.addCameraAnimationsDuration();

    this.sceneInited = true;
  }

  /**
   * Displays the scene
   * @method display
   */
  display() {
    // ---- BEGIN Background, camera and axis setup

    // Clear image and depth buffer everytime we update the scene
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Initialize Model-View matrix as identity (no transformation
    this.updateProjectionMatrix();
    this.loadIdentity();

    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    this.pushMatrix();
    this.axis.display();

    for (const [_, lightIndex] of Object.entries(this.lightsIDs)) {
      this.lights[lightIndex].update();
    }

    if (this.sceneInited) {
      // Draw axis
      this.setDefaultAppearance();

      // Displays the scene (MySceneGraph function).
      this.graph.displayScene();
    }

    this.popMatrix();
    // ---- END Background, camera and axis setup
  }
}
