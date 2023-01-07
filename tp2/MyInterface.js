import { CGFinterface, CGFapplication, dat } from "../lib/CGF.js";

/**
 * MyInterface - Creats a GUI interface
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
    this.highlightedFolder = this.gui.addFolder("Highlighted Components");

    return true;
  }

  /**
   * Updates the viewsFolder with the control that
   * allows the current camera management
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
   * @param {string} light - light ID
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
   * Adds the controls that allow enabling/disabling the
   * highlighted shader in the affected components
   * @param {string} highlightedComponent - highlighted component ID
   */
  addHighlightedComponent(highlightedComponent) {
    this.highlightedFolder
      .add(this.scene.graph.displayHighlighted, highlightedComponent)
      .name(highlightedComponent);
  }

  /**
   * Adds a control that allows enabling/disabling
   * the normals visualization
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
   * @param {KeyboardEvent} event
   */
  processKeyDown(event) {
    this.activeKeys[event.code] = true;
  }
  /**
   * Process key up event
   * @param {KeyboardEvent} event
   */
  processKeyUp(event) {
    this.activeKeys[event.code] = false;
  }
  /**
   * Handles a key press event
   * @param {string} keyCode - key identifier
   * @returns true if the key is pressed, false otherwise
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
