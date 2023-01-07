import { Settings } from "./Settings.js";
import { Timer } from "./Timer.js";
import { Board, NO_ANIMATION } from "./Board.js";
import { PieceSupport } from "./PieceSupport.js";
import { CGFscene } from "../../lib/CGF.js";

export const SUCCESS = 1;
export const FAILURE = -1;
export const INVALID_PIECE = -2;
export const PLAY_AGAIN = 0;
export const PLAYER0_WON = 10;
export const PLAYER1_WON = 11;

/**
 * GameState
 * @constructor
 * @param state - state's string
 */
export class GameState {
  static CREATE_GAME = new GameState("create");
  static PICK_PIECE = new GameState("pick");
  static PICKED_PIECE = new GameState("picked");
  static MOVING_PIECE = new GameState("moving");
  static GAME_OVER = new GameState("over");
  static SHOW_FILM = new GameState("showFilm");
  static UNDO = new GameState("undo");

  /**
   * @method constructor
   * @param {string} state - state's string 
   */
  constructor(state) {
    this.state = state;
  }

  /**
   * Gets the state's string
   * @method toString
   * @returns {string} state's string
   */
  toString() {
    return this.state;
  }
}

/**
 * Game
 * @constructor
 * @param scene - reference to CGFscene object
 * @param turn - first turn of the game
 * @param options - game configurations customized by a menu
 * @param gameOverCallback - function to be called when the game is over
 * @param filmCallback - function to be called when the film is going to be shown
 */
export class Game {
  /**
   * @method constructor
   * @param {CGFscene} scene - reference to CGFscene object
   * @param {boolean} turn - first turn of the game
   * @param {object} options - game configurations customized by a menu
   * @param {function} gameOverCallback - function to be called when the game is over
   * @param {function} filmCallback - function to be called when the film is going to be shown
   */
  constructor(scene, turn, options, gameOverCallback, filmCallback) {
    this.scene = scene;
    this.mode = options.boardSize;

    this.settings = Settings.loadSettings(this.mode);
    this.palette = Settings.loadPalette();

    this.filmCallback = filmCallback;
    this.gameOverCallback = gameOverCallback;
      
    this.turn = turn;
    this.score = [0, 0];
    this.state = GameState.PICK_PIECE;

    this.undos = [];
    this.currentUndo = undefined;

    this.timer = new Timer(
      this.scene,
      options.timeLimit,
      this.settings.TIMER_DIMENSIONS,
      this.settings.TIMER_POSITION,
      this.palette
    );

    this.initSupports();
    this.initBoard(options.kingRule);
  }

  /**
   * Initializes game's supports
   * @method initSupports
   */
  initSupports() {
    const player0Supp = new PieceSupport(
      this.scene,
      this.settings.SUPPORT_DIMENSIONS,
      this.settings.SUPPORT_POSITION.player0,
      this.palette,
      this.settings.SUPPORT_SCALE_FACTOR,
    );
    const player1Supp = new PieceSupport(
      this.scene,
      this.settings.SUPPORT_DIMENSIONS,
      this.settings.SUPPORT_POSITION.player1,
      this.palette,
      this.settings.SUPPORT_SCALE_FACTOR,
    );

    this.supports = {
      player0: {
        position: player0Supp.getPosition(),
        height: player0Supp.getHeight(),
        pushPiece: player0Supp.pushPiece.bind(player0Supp),
        popPiece: player0Supp.popPiece.bind(player0Supp),
        getPiecePosition: player0Supp.getPiecePosition.bind(player0Supp),
        scaleFactor: player0Supp.getScaleFactor(),
        display: player0Supp.display.bind(player0Supp),
      },
      player1: {
        position: player1Supp.getPosition(),
        height: player1Supp.getHeight(),
        pushPiece: player1Supp.pushPiece.bind(player1Supp),
        popPiece: player1Supp.popPiece.bind(player1Supp),
        getPiecePosition: player1Supp.getPiecePosition.bind(player1Supp),
        scaleFactor: player1Supp.getScaleFactor(),
        display: player1Supp.display.bind(player1Supp),
      }
    };
  }

  /**
   * Initializes game's board
   * @method initBoard
   * @param {string} kingRule - rule of the kings' moves
   */
  initBoard(kingRule) {
    this.board = new Board(
      this.scene,
      this.turn,
      this.settings.BOARD_SIZE,
      this.settings.BOARD_POSITION,
      this.palette,
      kingRule === 'custom',
      this.supports,
    );
  }

  /**
   * Swaps the turn, updating it, updating the timer and
   *  creating a camera animation
   * @method swapTurn
   */
  swapTurn() {
    this.turn = !this.turn;
    this.timer.setTurn(this.turn);

    this.scene.updateAnimatedCamera(
      `checkers-${this.mode}-${!this.turn ? "p1" : "p0"}-1`,
      `checkers-${this.mode}-${this.turn ? "p1" : "p0"}-1`
    );
  }

  /**
   * Function called when a game over occurs
   * @method endGame
   * @param {string} winner - player that won the game
   */
  endGame(winner = undefined) {
    this.board.turnOffTrackingLight();
    this.state = GameState.GAME_OVER;
    console.log("Game Over!");

    if (winner !== undefined) {
      console.log(`Updating ${winner}'s local storage...`);

      let score = window.localStorage.getItem(winner);
      if (score === null) score = "1";
      else score = (parseInt(score) + 1).toString();
      window.localStorage.setItem(winner, score);
    }
    
    this.scene.updateAnimatedCamera(
      `checkers-${this.mode}-${this.turn ? "p1" : "p0"}-1`,
      "menu"
    );

    this.gameOverCallback();
  }

  /**
   * Resets the game and shows the film of the last
   *  completed game
   * @method showGameFilm
   */
  showGameFilm() {
    if (this.undos.length === 0 || this.state !== GameState.GAME_OVER) return;

    this.filmCallback();
    this.initSupports();

    this.timer.stop();
    this.timer.reset(0);

    this.board.reset(
      this.palette,
      this.supports,
    );

    this.currentUndo = -1;
    this.state = GameState.SHOW_FILM;

    this.scene.updateAnimatedCamera(
      this.scene.camera,
      `checkers-${this.mode}-movie`
    );
  }

  /**
   * Handles the player mouse game picks
   * @method pickHandler
   * @param {array} pickResult - array with the player mouse picks
   */
  pickHandler(pickResult) {
    const undo = this.board.pickHandler(
      pickResult,
      this.state,
      this.turn,
      (result) => {
        switch (result) {
          case INVALID_PIECE:
            this.state = GameState.PICK_PIECE;
            return;
          case PLAYER0_WON:
          case PLAYER1_WON:
            this.timer.stop();
            this.endGame(`player${result - 10}`);
            return;
          case SUCCESS:
            switch (this.state) {
              case GameState.CREATE_GAME:
                this.state = GameState.PICK_PIECE;
                return;
              case GameState.PICK_PIECE:
                this.state = GameState.PICKED_PIECE;
                return;
              case GameState.PICKED_PIECE:
                this.state = GameState.PICK_PIECE;
                this.swapTurn();
                return;
              default:
                return;
            }
          default:
            return;
        }
      }
    );

    if (undo !== undefined) {
      const undoPlayer0Time = Object.assign({}, this.timer.getTimeCount().player0);
      const undoPlayer1Time = Object.assign({}, this.timer.getTimeCount().player1);
      undo["currTime"] = {
        players: this.timer.getPlayers(),
        timeCount: {
          player0: undoPlayer0Time,
          player1: undoPlayer1Time,
        },
      };

      this.undos.push(undo);
    }
  }

  /**
   * Undos the last move
   * @method undo
   */
  undo() {
    if (this.undos.length === 0) return;

    this.state = GameState.UNDO;
    const previousState = this.state;
    const previousTurn = this.turn;
    const currentUndo = this.undos.pop();

    this.board.undo(
      currentUndo,
      (result, turn=undefined) => {
        if (result === SUCCESS) {
          this.turn = turn;
          this.timer.undo(currentUndo.currTime);
          this.state = GameState.PICK_PIECE;

          if (previousTurn !== this.turn)
            this.scene.updateAnimatedCamera(
              `checkers-${this.mode}-${!this.turn ? "p1" : "p0"}-1`,
              `checkers-${this.mode}-${this.turn ? "p1" : "p0"}-1`
            );
        } else {
          this.state = previousState;
          this.undos.push(currentUndo);
        }
      }
    );
  }

  /**
   * Displays the game components
   * @method display
   */
  display() {
    this.timer.display();
    this.board.display({ turn: this.turn, state: this.state });
    this.supports.player0.display();
    this.supports.player1.display();
  }

  /**
   * Update function, called periodically, which updates the game components
   * @method update
   * @param {number} t - currentTime
   */
  update(t) {
    const result = this.board.update(t);
    if (!this.board.isCreated()) return;

    if (this.state !== GameState.SHOW_FILM && !this.timer.isActive()) {
      this.timer.start();
      this.timer.reset();
    }

    if (this.state === GameState.SHOW_FILM) {
      if (result === NO_ANIMATION) {
        if (++this.currentUndo < this.undos.length)
          this.board.executeMove(this.undos[this.currentUndo]);
        else this.endGame();
      }
    }

    let isGameOver = false;
    if (this.state !== GameState.MOVING_PIECE)
      isGameOver = this.timer.update(t);
    if (isGameOver) this.endGame();
    }
}
