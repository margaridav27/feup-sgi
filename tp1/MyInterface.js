import { CGFinterface, CGFapplication, dat } from "../lib/CGF.js";

/**
 * MyInterface class, creating a GUI interface.
 */
export class MyInterface extends CGFinterface {
  /**
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * Initializes the interface.
   * @param {CGFapplication} application
   */
  init(application) {
    super.init(application);
    // init GUI. For more information on the methods, check:
    //  http://workshop.chromeexperiments.com/examples/gui

    this.gui = new dat.GUI();

    this.initKeys();

    this.lightsFolder = this.gui.addFolder("Lights");
    this.viewsFolder = this.gui.addFolder("Views");

    return true;
  }

  /**
   * Updates the viewFolder with the control that allows the
   * current camera management
   */
  addViews() {
    this.viewsFolder
      .add(this.scene, "currentCamera", this.scene.camerasIDs)
      .name("Current view")
      .onChange(this.scene.updateCamera.bind(this.scene));
  }

  /**
   * Adds a light folder with the controls that allow
   * enabling/disabling the light and manage its attenuation
   */
  addLight(light) {
    const lightFolder = this.lightsFolder.addFolder(light);
    lightFolder
      .add(this.scene.enableLights, light)
      .name("Enable")
      .onChange((_) => this.scene.turnOnOffLight(light));
    lightFolder
      .add(
        this.scene.lightsAttenuationValue,
        light,
        this.scene.lightsAttenuation
      )
      .name("Attenuation")
      .onChange((v) => this.scene.changeAttenuation(light, v));
  }

  /**
   * Adds a control that allows enabling/disabling the normals
   * visualization
   */
  addEnableNormals() {
    this.gui.add(this.scene.graph, "displayNormals").name("Display Normals");
  }

  /**
   * Initializes the key events handle
   */
  initKeys() {
    this.scene.gui = this;
    this.processKeyboard = function () {};
    this.activeKeys = {};
  }
  /**
   * Process key down event
   * @param {event to handle} event 
   */
  processKeyDown(event) {
    this.activeKeys[event.code] = true;
  }
  /**
   * Process key up event
   * @param {event to handle} event 
   */
  processKeyUp(event) {
    this.activeKeys[event.code] = false;
  }
  /**
   * Handles a key press event
   * @param {key identifier} keyCode 
   * @returns True if the key is pressed, false otherwise
   */
  isKeyPressed(keyCode) {
    if (
      this.activeKeys[keyCode] &&
      (keyCode === "KeyM" || keyCode === "KeyT")
    ) {
      this.activeKeys[keyCode] = false;
      return true;
    }

    return this.activeKeys[keyCode] || false;
  }
}
