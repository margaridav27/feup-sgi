import { CGFscene } from "../lib/CGF.js";
import { CGFaxis, CGFcamera } from "../lib/CGF.js";

/**
 * XMLscene - representing the scene that is to be rendered
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
  }

  /**
   * Initializes the scene, setting some WebGL defaults, initializing the camera and the axis
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

    this.axis = new CGFaxis(this);
    this.setUpdatePeriod(20);

    this.enableLights = {};
    this.lightsAttenuation = { constant: 0, linear: 1, quadratic: 2 };
    this.lightsAttenuationValue = {};
    this.lightsIDs = {};
  }

  update(t) {
    this.graph.update(t);
  }

  /**
   * Initializes the scene cameras
   * @method initCameras
   */
  initCameras() {
    // this.camera = new CGFcamera(0.4, 0.1, 500, vec3.fromValues(15, 15, 15), vec3.fromValues(0, 0, 0));
    this.cameras = this.graph.views;
    this.camerasIDs = this.graph.viewsIDs;

    this.camera = this.graph.defaultView;
    this.interface.setActiveCamera(this.camera);

    this.currentCamera = this.graph.defaultViewIndex;

    this.interface.addViews();
  }

  /**
   * Updates currentCamera according to the selected in the interface
   * @method updateCamera
   */
  updateCamera() {
    this.camera = this.cameras[this.currentCamera];
    this.interface.setActiveCamera(this.camera);
  }

  /**
   * Updates the light attenuation according to the value selected in the interface
   * @method updateLights
   * @param {string} - light's ID
   * @param {float} - attenuation value
   */
  changeAttenuation(light, v) {
    console.log(light, v);
    const currentLight = this.lights[this.lightsIDs[light]];
    const constant = v == 0 ? 1 : 0;
    const linear = v == 1 ? 1 : 0;
    const quadratic = v == 2 ? 1 : 0;
    console.log(currentLight, constant, linear, quadratic);
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
   * Enables/Disables the light according to the interface checkbox
   * @method updateLights
   * @param {string} - light's ID
   */
  turnOnOffLight(light) {
    if (this.enableLights[light]) this.lights[this.lightsIDs[light]].enable();
    else this.lights[this.lightsIDs[light]].disable();
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

    this.interface.addEnableNormals();
    this.initCameras();
    this.initLights();

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
