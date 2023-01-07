import { CGFappearance, CGFtexture } from "../../lib/CGF.js";
import { MyRectangle } from "../primitives/MyRectangle.js";
import { MyUnitCube } from "../components/MyUnitCube.js";
import { MyCylindricalPatch } from "../components/MyCylindricalPatch.js";

const ONE_MINUTE = 60000;

/**
 * Timer
 * @constructor
 * @param scene - reference to CGFscene object
 * @param timeLimit - time limit in minutes
 * @param dimensions - dimensions of the timer (length, width and height)
 * @param position - position of the timer (x and z coordinates)
 * @param palette - palette of the timer
 */
export class Timer {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {integer} timeLimit - time limit in minutes
   * @param {object} dimensions - dimensions of the timer (length, width and height)
   * @param {object} position - position of the timer (x and z coordinates)
   * @param {object} palette - palette of the timer
   */
  constructor(scene, timeLimit, dimensions, position, palette) {
    this.scene = scene;

    this.active = false;
    this.timeLimit = timeLimit * ONE_MINUTE;
    this.pendingUnhandledUndo = false;

    this.dimensions = dimensions;
    this.position = position;

    this.initMaterials(palette);
    this.initTextures();
    this.initPrimitives();

    this.setTurn(this.turn);
    this.reset();
  }

  /**
   * Initializes timer's materials
   * @method initMaterials
   * @param {object} palette - palette of colors
   */
  initMaterials(palette) {
    this.whiteMaterial = new CGFappearance(this.scene);
    this.whiteMaterial.setAmbient(1, 1, 1, 1);
    this.whiteMaterial.setDiffuse(1, 1, 1, 1);
    this.whiteMaterial.setSpecular(1, 1, 1, 1);
    this.whiteMaterial.setEmission(0, 0, 0, 1);
    this.whiteMaterial.setShininess(10);

    this.greyMaterial = new CGFappearance(this.scene);
    this.greyMaterial.setAmbient(
      palette.grey.r,
      palette.grey.g,
      palette.grey.b,
      1
    );
    this.greyMaterial.setDiffuse(
      palette.grey.r,
      palette.grey.g,
      palette.grey.b,
      1
    );
    this.greyMaterial.setSpecular(
      palette.grey.r,
      palette.grey.g,
      palette.grey.b,
      1
    );
    this.greyMaterial.setEmission(0, 0, 0, 1);
    this.greyMaterial.setShininess(10);

    let player0TurnMaterial = new CGFappearance(this.scene);
    player0TurnMaterial.setAmbient(
      palette.player0.r,
      palette.player0.g,
      palette.player0.b,
      1
    );
    player0TurnMaterial.setDiffuse(
      palette.player0.r,
      palette.player0.g,
      palette.player0.b,
      1
    );
    player0TurnMaterial.setSpecular(
      palette.player0.r,
      palette.player0.g,
      palette.player0.b,
      1
    );
    player0TurnMaterial.setEmission(0, 0, 0, 1);
    player0TurnMaterial.setShininess(10);

    let player1TurnMaterial = new CGFappearance(this.scene);
    player1TurnMaterial.setAmbient(
      palette.player1.r,
      palette.player1.g,
      palette.player1.b,
      1
    );
    player1TurnMaterial.setDiffuse(
      palette.player1.r,
      palette.player1.g,
      palette.player1.b,
      1
    );
    player1TurnMaterial.setSpecular(
      palette.player1.r,
      palette.player1.g,
      palette.player1.b,
      1
    );
    player1TurnMaterial.setEmission(0, 0, 0, 1);
    player1TurnMaterial.setShininess(10);

    this.playersMaterials = {
      player0: player0TurnMaterial,
      player1: player1TurnMaterial,
    };
  }

  /**
   * Initializes timer's textures
   * @method initTextures
   */
  initTextures() {
    this.numbersTextures = [];
    for (let i = 0; i < 10; i++) {
      const filePath = `scenes/images/numbers/${i}.webp`;
      this.numbersTextures.push(new CGFtexture(this.scene, filePath));
    }

    this.twoDotsTexture = new CGFtexture(
      this.scene,
      "scenes/images/numbers/2dots.webp"
    );
  }

  /**
   * Initializes timer's primitives
   * @method initPrimitives
   */
  initPrimitives() {
    this.rectangle = new MyRectangle(this.scene, "timerRectangle", 0, 1, 0, 1);
    this.cube = new MyUnitCube(this.scene);
    this.cylinder = new MyCylindricalPatch(this.scene);
  }

  /**
   * Gets the players object
   * @method getPlayers
   * @returns {{turn: string, other: string}} - players object
   */
  getPlayers() {
    return this.players;
  }

  /**
   * Gets timeCount object
   * @method getTimeCount
   * @returns {{player0: object, player1: object}} - timeCount object
   */
  getTimeCount() {
    return this.timeCount;
  }

  /**
   * Gets the time to be displayed of a given player
   * @method getTimeToDisplay
   * @param {string} player - player (either "player0" or "player1")
   * @returns {object} - minutes and seconds to be displayed (ten and unit of each)
   */
  getTimeToDisplay(player) {
    const time = this.timeCount[player];
    const minutes = Math.floor((time.remaining - time.elapsed) / ONE_MINUTE);
    const seconds = Math.floor(
      ((time.remaining - time.elapsed) % ONE_MINUTE) / 1000
    );
    return {
      minutes: [Math.floor(minutes / 10), minutes % 10],
      seconds: [Math.floor(seconds / 10), seconds % 10],
    };
  }

  /**
   * Gets the wins to be displayed of a given player
   * @method getWinsToDisplay
   * @param {string} player - player (either "player0" or "player1")
   * @returns {array} - wins to be displayed (hundreds, tens and units)
   */
  getWinsToDisplay(player) {
    let score = window.localStorage.getItem(player);
    if (score === null) return [0, 0, 0];

    score = parseInt(score);
    if (score === 0) return [0, 0, 0];

    const units = score % 10;
    const tens = Math.floor(score / 10) % 10;
    const hundreds = Math.floor(score / 100) % 10;
    return [hundreds, tens, units];
  }

  /**
   * Displays timer's cube (its structure, essentially)
   * @method displayCube
   */
  displayCube() {
    let matrix = mat4.create();

    this.scene.pushMatrix();
    this.greyMaterial.apply();
    mat4.scale(matrix, matrix, [
      this.dimensions.width,
      this.dimensions.height,
      this.dimensions.length,
    ]);
    this.scene.multMatrix(matrix);
    this.cube.display();
    this.scene.popMatrix();
  }

  /**
   * Displays the time of each player
   * @method displayTime
   * @param {object} measures - measures required for the transformations
   */
  displayCount({ numWidth, largerGap, smallerGap, timeNumHeight, heightGap }) {
    const players = [
      this.getTimeToDisplay("player1"),
      this.getTimeToDisplay("player0"),
    ];

    let matrix = mat4.create();

    this.scene.pushMatrix();
    mat4.translate(matrix, matrix, [
      -this.dimensions.width / 2,
      heightGap,
      -this.dimensions.length / 2,
    ]);
    mat4.rotateY(matrix, matrix, 4.712);
    this.scene.multMatrix(matrix);

    let translationFactor = largerGap;
    let displayDots = true;

    for (const player in players) {
      for (const time of Object.values(players[player])) {
        for (const number of time) {
          this.scene.pushMatrix();
          this.whiteMaterial.setTexture(this.numbersTextures[number]);
          this.whiteMaterial.apply();
          mat4.translate(matrix, mat4.create(), [translationFactor, 0, 0]);
          mat4.scale(matrix, matrix, [numWidth, timeNumHeight, 1]);
          this.scene.multMatrix(matrix);
          this.rectangle.display();
          this.scene.popMatrix();

          translationFactor += numWidth + smallerGap;
        }

        if (displayDots) {
          this.scene.pushMatrix();
          this.whiteMaterial.setTexture(this.twoDotsTexture); // two dots
          this.whiteMaterial.apply();
          mat4.translate(matrix, mat4.create(), [translationFactor, 0, 0]);
          mat4.scale(matrix, matrix, [numWidth, timeNumHeight, 1]);
          this.scene.multMatrix(matrix);
          this.rectangle.display();
          this.scene.popMatrix();

          translationFactor += numWidth + smallerGap;

          displayDots = false;
        }
      }

      mat4.translate(matrix, mat4.create(), [largerGap, 0, 0]);
      this.scene.multMatrix(matrix);

      displayDots = true;
    }

    this.scene.popMatrix();
  }

  /**
   * Displays the wins of each player
   * @method displayWins
   * @param {object} measures - measures required for the transformations
   */
  displayWins({ numWidth, largerGap, smallerGap, timeNumHeight, heightGap }) {
    const middleGap = 4 * numWidth + 4 * smallerGap + largerGap;
    const winNumHeight = timeNumHeight / 2;

    const players = [
      this.getWinsToDisplay("player1"),
      this.getWinsToDisplay("player0"),
    ];

    let matrix = mat4.create();

    this.scene.pushMatrix();
    mat4.translate(matrix, matrix, [
      -this.dimensions.width / 2,
      timeNumHeight + 2 * heightGap,
      -this.dimensions.length / 2,
    ]);
    mat4.rotateY(matrix, matrix, 4.712);
    this.scene.multMatrix(matrix);

    let translationFactor = largerGap;

    for (const player of players) {
      for (const number of player) {
        this.scene.pushMatrix();
        this.whiteMaterial.setTexture(this.numbersTextures[number]);
        this.whiteMaterial.apply();
        mat4.translate(matrix, mat4.create(), [translationFactor, 0, 0]);
        mat4.scale(matrix, matrix, [numWidth, winNumHeight, 1]);
        this.scene.multMatrix(matrix);
        this.rectangle.display();
        this.scene.popMatrix();

        translationFactor += numWidth + smallerGap;
      }

      mat4.translate(matrix, mat4.create(), [middleGap, 0, 0]);
      this.scene.multMatrix(matrix);
    }

    this.scene.popMatrix();
  }

  /**
   * Displays the turn of the player
   * @method displayTurn
   * @param {boolean} turn - true if player 1's turn, false otherwise
   */
  displayTurn() {
    let matrix = mat4.create();

    this.scene.pushMatrix();
    this.playersMaterials[this.players.turn].apply();
    mat4.translate(matrix, matrix, [0, this.dimensions.height, 0]);
    mat4.scale(matrix, matrix, [
      this.dimensions.width / 5,
      this.dimensions.height / 15,
      this.dimensions.width / 5,
    ]);
    this.scene.multMatrix(matrix);
    this.cylinder.display();
    this.scene.popMatrix();
  }

  /**
   * Displays the timer
   * @method display
   * @param {boolean} turn - true if player 1's turn, false otherwise
   */
  display() {
    // values necessary to display the time count and wins
    const numWidth = this.dimensions.length / 11.9;
    const largerGap = numWidth / 2; // side (and middle) gap
    const smallerGap = numWidth / 20; // gap between numbers

    const timeNumHeight = this.dimensions.height / 2;
    const winNumHeight = timeNumHeight / 2;
    const heightGap = (this.dimensions.height - timeNumHeight - winNumHeight) / 3;

    let matrix = mat4.create();

    this.scene.pushMatrix();
    mat4.translate(matrix, matrix, [this.position.x, 0, this.position.z]);
    this.scene.multMatrix(matrix);

    this.displayCube();
    this.displayCount({
      numWidth,
      largerGap,
      smallerGap,
      timeNumHeight,
      heightGap,
    });
    this.displayWins({
      numWidth,
      largerGap,
      smallerGap,
      timeNumHeight,
      heightGap,
    });
    this.displayTurn();

    this.scene.popMatrix();
  }

  /**
   * Sets the turn and other players
   * @metohd setTurn
   * @param {boolean} turn - true if player1, false if player0
   */
  setTurn(turn) {
    this.players = {
      turn: turn ? "player1" : "player0",
      other: turn ? "player0" : "player1",
    };
  }

  /**
   * Gets if the timer is active or not
   * @method isActive
   * @returns {boolean} - true, if the timer is counting, false otherwise
   */
  isActive() { 
    return this.active; 
  }

  /**
   * Starts the timer
   * @method start
   */
  start() {
    this.active = true;
  }

  /**
   * Stops the timer
   * @method stop
   */
  stop() {
    this.active = false;
  }

  /**
   * Handles an undo
   * @method undo
   * @param {object} undo - timer configurations of the undo 
   */
  undo(undo) {
    this.players = undo.players;
    this.timeCount = undo.timeCount;
    this.pendingUnhandledUndo = true;
  }

  /**
   * Resets the time count object
   * @method reset
   * @param {integer} timeLimit
   */
  reset(timeLimit = this.timeLimit) {
    const now = Date.now();
    this.timeCount = {
      player0: {
        remaining: timeLimit,
        elapsed: 0,
        elapsedBackup: 0,
        last: now,
      },
      player1: {
        remaining: timeLimit,
        elapsed: 0,
        elapsedBackup: 0,
        last: now,
      },
    };
  }

  /**
   * Update function, called periodically, which updates the timer's time count
   * @method update
   * @param {number} t - currentTime
   * @param {boolean} turn - true if player 1's turn, false otherwise
   */
  update(t) {
    if (!this.active) return; 

    let currTime = new Date(t);
    currTime = currTime.getTime(); // timestamp

    this.timeCount[this.players.other].last = currTime;
    this.timeCount[this.players.other].remaining -= this.timeCount[this.players.other].elapsed;
    this.timeCount[this.players.other].elapsed = 0;

    // an undo occured, some values need to be adjusted
    if (this.pendingUnhandledUndo) { 
      this.timeCount[this.players.turn].last = currTime;
      // this value becoming greater than 0 means that at least one undo has occured  
      this.timeCount[this.players.turn].elapsedBackup = this.timeCount[this.players.turn].elapsed;
      this.pendingUnhandledUndo = false;
    }

    let elapsed = currTime - this.timeCount[this.players.turn].last;
    if (this.timeCount[this.players.turn].elapsedBackup > 0) 
      elapsed += this.timeCount[this.players.turn].elapsedBackup;
    
    this.timeCount[this.players.turn].elapsed = elapsed;

    if (
      this.timeCount[this.players.turn].elapsed >
      this.timeCount[this.players.turn].remaining
    ) {
      this.active = false;
      this.reset(0);
      return true; // game over
    }

    return false; // game still occurring
  }
}
