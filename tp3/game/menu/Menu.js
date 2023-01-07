import { CGFappearance } from "../../../lib/CGF.js";
import { MyCameraAnimation } from "../../animations/MyCameraAnimation.js";
import { MyRectangle } from "../../primitives/MyRectangle.js";
import { MySpriteText } from "../../sprites/MySpriteText.js";
import { Button } from "./Button.js";

/**
 * Menu
 * @constructor
 * @param scene - reference to CGFscene object
 * @param gameStartCallback - callback to be called when the game starts
 */
export class Menu {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {function} gameStartCallback - callback to be called when the game starts
   */
  constructor(scene, gameStartCallback) {
    this.scene = scene;
    this.gameStartCallback = gameStartCallback;
    this.selected = {
      boardSize: "large",
      kingRule: "default",
      timeLimit: "10",
    };

    this.initMaterials();
    this.initPrimitives();
    this.initEntries();
  }

  /**
   * Initializes menu's materials
   * @method initMaterials
   */
  initMaterials() {
    const defaultColor = { r: 0.204, g: 0.227, b: 0.251 };
    this.defaultMaterial = new CGFappearance(this.scene);
    this.defaultMaterial.setAmbient(
      defaultColor.r,
      defaultColor.g,
      defaultColor.b,
      1.0
    );
    this.defaultMaterial.setDiffuse(
      defaultColor.r,
      defaultColor.g,
      defaultColor.b,
      1.0
    );
    this.defaultMaterial.setSpecular(
      defaultColor.r,
      defaultColor.g,
      defaultColor.b,
      1.0
    );
    this.defaultMaterial.setEmission(0.0, 0.0, 0.0, 1);
    this.defaultMaterial.setShininess(10);

    const selectedColor = { r: 0.129, g: 0.145, b: 0.161 };
    this.selectedMaterial = new CGFappearance(this.scene);
    this.selectedMaterial.setAmbient(
      selectedColor.r,
      selectedColor.g,
      selectedColor.b,
      1
    );
    this.selectedMaterial.setDiffuse(
      selectedColor.r,
      selectedColor.g,
      selectedColor.b,
      1
    );
    this.selectedMaterial.setSpecular(
      selectedColor.r,
      selectedColor.g,
      selectedColor.b,
      1
    );
    this.selectedMaterial.setEmission(0.0, 0.0, 0.0, 1);
    this.selectedMaterial.setShininess(10);
  }

  /**
   * Initializes menu's primitives
   * @method initPrimitives
   */
  initPrimitives() {
    this.rectangle = new MyRectangle(this.scene, "menuRectangle", 0, 1, 0, 1);
  }

  /**
   * Initializes menu's entries, as in its buttons' groups and respective title
   * @method initEntries
   */
  initEntries() {
    this.gameTitle = new MySpriteText(this.scene, "FIT CHECKERS", "bold");
    this.startButton = new Button(
      this.scene,
      10001,
      "Start",
      this.defaultMaterial,
      this.selectedMaterial
    );

    this.boardSizeTitle = new MySpriteText(this.scene, "Board Size", "bold");
    this.boardSizeButtons = {
      small: new Button(
        this.scene,
        10002,
        "Small",
        this.defaultMaterial,
        this.selectedMaterial
      ),
      large: new Button(
        this.scene,
        10003,
        "Large",
        this.defaultMaterial,
        this.selectedMaterial
      ),
    };

    this.kingRuleTitle = new MySpriteText(this.scene, "King Rules", "bold");
    this.kingRuleButtons = {
      default: new Button(
        this.scene,
        10004,
        "Default",
        this.defaultMaterial,
        this.selectedMaterial
      ),
      custom: new Button(
        this.scene,
        10005,
        "Custom",
        this.defaultMaterial,
        this.selectedMaterial
      ),
    };

    this.timeLimitTitle = new MySpriteText(this.scene, "Time Limit", "bold");
    this.timeLimitButtons = {
      5: new Button(
        this.scene,
        10006,
        "5",
        this.defaultMaterial,
        this.selectedMaterial
      ),
      10: new Button(
        this.scene,
        10007,
        "10",
        this.defaultMaterial,
        this.selectedMaterial
      ),
      15: new Button(
        this.scene,
        10008,
        "15",
        this.defaultMaterial,
        this.selectedMaterial
      ),
      20: new Button(
        this.scene,
        10009,
        "20",
        this.defaultMaterial,
        this.selectedMaterial
      ),
    };

    this.boardSizeButtons[this.selected.boardSize].select();
    this.kingRuleButtons[this.selected.kingRule].select();
    this.timeLimitButtons[this.selected.timeLimit].select();
  }

  /**
   * Gets the text (value) of the selected button given a buttons' group key
   * @method getSelected
   * @param {string} key - button's group key
   * @returns {string | undefined} the text of the selected button (lowercased), undefined if the key is invalid
   */
  getSelected(key) {
    const value = this.selected[key];
    switch (key) {
      case "boardSize":
        return this.boardSizeButtons[value];
      case "kingRule":
        return this.kingRuleButtons[value];
      case "timeLimit":
        return this.timeLimitButtons[value];
      default:
        return undefined;
    }
  }

  /**
   * Handles a picking event
   * @method pickHandler
   * @param {array} pickResult - array with the picked objects
   */
  pickHandler(pickResult) {
    let selected = pickResult.filter((picked) => picked instanceof Button);
    if (selected.length === 0) return;
    selected = selected[0];

    const buttonKey = selected.getSpriteText().getText().toLowerCase();

    const buttonType =
      this.boardSizeButtons[buttonKey] !== undefined
        ? "boardSize"
        : this.kingRuleButtons[buttonKey] !== undefined
        ? "kingRule"
        : this.timeLimitButtons[buttonKey] !== undefined
        ? "timeLimit"
        : "start";

    if (buttonType === "start") return this.startGame();

    const prevSelected = this.getSelected(buttonType);
    if (prevSelected.getId() === selected.getId()) return;
    prevSelected.clearSelection();
    selected.select();
    this.selected[buttonType] = buttonKey;
  }

  /**
   * Starts the game by setting the appropriate camera animation and calling the callback
   * @method startGame
   */
  startGame() {
    this.scene.animatedCamera = new MyCameraAnimation(
      this.scene,
      "menu",
      `checkers-${this.selected.boardSize}-p0-1`
    );

    this.gameStartCallback(this.selected);
  }

  /**
   * Displays a menu entry, which is composed by a title and an array of buttons
   * @method displayEntry
   * @param {MySpriteText} title - title to display
   * @param {array} buttons - buttons to display
   */
  displayEntry(title, buttons) {
    let maxLength = buttons[0].getSpriteText().getTextLength();
    for (const button of buttons) {
      const length = button.getSpriteText().getTextLength();
      if (length > maxLength) maxLength = length;
    }

    let totalLength = buttons.length * (maxLength + 0.5) - 0.5;

    let matrix = mat4.create();

    this.scene.pushMatrix();
    mat4.scale(matrix, matrix, [0.3, 0.3, 1]);
    this.scene.multMatrix(matrix);

    // buttons
    let translationFactor = -totalLength / 2;
    for (const button of buttons) {
      translationFactor += maxLength / 2;

      this.scene.pushMatrix();
      mat4.translate(matrix, mat4.create(), [translationFactor, 0, 0]);
      this.scene.multMatrix(matrix);
      this.scene.registerForPick(button.getId(), button);
      button.display(maxLength);
      this.scene.clearPickRegistration();
      this.scene.popMatrix();

      translationFactor += maxLength / 2 + 0.5;
    }

    this.scene.popMatrix();

    // title
    this.scene.pushMatrix();
    mat4.translate(matrix, mat4.create(), [0, 0.35, 0.01]);
    mat4.scale(matrix, matrix, [0.4, 0.4, 1]);
    this.scene.multMatrix(matrix);
    title.display();
    this.scene.popMatrix();
  }

  /**
   * Displays the menu
   * @method display
   */
  display() {
    let matrix = mat4.create();

    this.scene.pushMatrix();

    mat4.translate(matrix, matrix, [15, 0, 0]);
    this.scene.multMatrix(matrix);

    this.scene.pushMatrix();
    mat4.translate(matrix, mat4.create(), [0, 0.25, 0]);
    this.scene.multMatrix(matrix);
    this.displayEntry(
      this.timeLimitTitle,
      Object.values(this.timeLimitButtons)
    );
    this.scene.popMatrix();

    this.scene.pushMatrix();
    mat4.translate(matrix, mat4.create(), [0, 1.5, 0]);
    this.scene.multMatrix(matrix);
    this.displayEntry(
      this.boardSizeTitle,
      Object.values(this.boardSizeButtons)
    );
    this.scene.popMatrix();

    this.scene.pushMatrix();
    mat4.translate(matrix, mat4.create(), [0, 2.75, 0]);
    this.scene.multMatrix(matrix);
    this.displayEntry(this.kingRuleTitle, Object.values(this.kingRuleButtons));
    this.scene.popMatrix();

    this.scene.pushMatrix();
    mat4.translate(matrix, mat4.create(), [0, 4, 0]);
    this.scene.multMatrix(matrix);
    this.displayEntry(this.gameTitle, [this.startButton]);
    this.scene.multMatrix(matrix);
    this.scene.popMatrix();

    this.scene.popMatrix();
  }
}
