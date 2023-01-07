import {
  GameState,
  SUCCESS,
	FAILURE,
	INVALID_PIECE,
  PLAY_AGAIN,
  PLAYER0_WON,
  PLAYER1_WON,
} from "./Game.js";
import MyInvalidPieceAnimation from '../animations/MyInvalidPieceAnimation.js';
import { BoardCell, CAPTURE, MOVE } from "./BoardCell.js";
import { GamePiece } from "./GamePiece.js";
import Undo from "./Undo.js";
import { CGFscene } from "../../lib/CGF.js";

const BOARD_Y = 0.01;

export const END_ANIMATION = 0;
export const DURING_ANIMATION = -1;
export const NO_ANIMATION = 1;

/**
 * Board
 * @constructor
	 * @param scene - reference to CGFscene object
	 * @param turn - first turn of the game
	 * @param size - size of the board
	 * @param position - position of the board
	 * @param palette - board's palette
	 * @param customKingMoves - True if the king's rules are custom, false otherwise
	 * @param supports - game supports
 */
export class Board {
	/**
	 * @constructor
	 * @param {CGFscene} scene - reference to CGFscene object
	 * @param {boolean} turn - first turn of the game
	 * @param {float} size - size of the board
	 * @param {{x: float, z: float}} position - position of the board
	 * @param {object} palette - board's palette
	 * @param {boolean} customKingMoves - True if the king's rules are custom, false otherwise
	 * @param {{player0: object, player1: object}} supports - game's supports
	 */
	constructor(scene, turn, size, position, palette, customKingMoves, supports) {
		this.scene = scene;

		this.size = size;
		this.position = position;

		this.cells = {};
		
		this.customKingMoves = customKingMoves;
		this.validMoves = {};
		this.previouslyPickedCell = undefined;
		this.movingPieceCell = undefined;
		this.invalidPiecesPicked = {};
		this.removeFromInvalidPiecesPicked = [];

		this.lastCell = undefined;
		this.cellsCreated = undefined;

		this.initSupports(supports);
		this.initCells(palette);
		this.setValidMoves(turn);
	}

	/**
	 * Resets the board cells and the game's supports
	 * @method reset
	 * @param {object} palette - board's palette
	 * @param {{player0: object, player1: object}} supports - game's supports
	 */
	reset(palette, supports) {
		this.initSupports(supports);
		this.initCells(palette);
	}

	/**
	 * Gets the id of the cell based on its row and column
	 * @static
	 * @method calculateCellID
	 * @param {integer} row - cell's row 
	 * @param {integer} col - cell's column
	 * @returns {integer} cell's id
	 */
	static calculateCellID(row, col) {
		return (1 + col) * 8 + (1 + row); // id must be greater than 0
	}

	/**
   * Initializes game's supports
	 * @method initSupports
	 * @param {{player0: object, player1: object}} supports - game's supports
	 */
	initSupports(supports) {
		this.supports = supports;
		this.supports.player0.position.x -= this.position.x;
		this.supports.player0.height -= BOARD_Y;
		this.supports.player0.position.z -= this.position.z;
		this.supports.player1.position.x -= this.position.x;
		this.supports.player1.height -= BOARD_Y;
		this.supports.player1.position.z -= this.position.z;
	}

	/**
   * Initializes board's cells
	 * @method initCells
	 * @param {object} palette - board's palette
	 */
	initCells(palette) {
		const size = this.size / 8;
		const colors = [palette.grey, palette.ice];
		let colorIndex = 0;
	
		const player0Cells = [];
		const player1Cells = [];
		const emptyCells = [];

		for (let col = 0; col < 8; col++) {
			const emptyRow = col == 3 || col == 4;
			const isPlayer1 = col > 4 ? false : true;

			for (let row = 0; row < 8; row++) {
				const id = Board.calculateCellID(row, col);
				const position = { row, col };
				colorIndex = 1 - colorIndex;

				// empty cell - middle rows and white cells do not have pieces
				if (colorIndex || emptyRow) {
					emptyCells.push(new BoardCell(this.scene, id, size, position, colors[colorIndex]));
					continue;
				}
				
				const piece = new GamePiece(this.scene, isPlayer1, isPlayer1 ? palette.player1 : palette.player0, size);
				const boardCell = new BoardCell(this.scene, id, size, position, colors[colorIndex], piece);
				if (isPlayer1) player1Cells.push(boardCell);
				else player0Cells.push(boardCell); 
			}

			colorIndex = 1 - colorIndex;
		}

		this.cells = {
			player0: player0Cells,
			player1: player1Cells,
			empty: emptyCells
		}

		this.lastCellCreated = player0Cells[player0Cells.length - 1];
		this.cellsCreated = false;
	}
	
	/**
	 * Determines if the board is already created
	 * @method isCreated
	 * @returns {boolean} true if it was created, false otherwise
	 */
	isCreated() {
		return this.cellsCreated;
	}

	/**
	 * Determines the valid moves for a piece of a specific cell
	 * @method getMoves
	 * @param {boolean} turn - current turn
	 * @param {BoardCell} cell - piece's cell for which the valid moves will be determined
	 * @returns {[{cell: BoardCell, capture: {row: integer, col: integer} | undefined}]} piece's valid moves
	 */
	getMoves(turn, cell) {
		const opponentCells = (turn) ? this.cells.player0 : this.cells.player1;
		const dirOffsets = {
			"UR": { row: +1, col: -1 },
			"UL": { row: -1, col: -1 },
			"DR": { row: +1, col: +1 },
			"DL": { row: -1, col: +1 },
		};

		if (!cell.getPiece().getIsKing()) {
			if (turn) {
				delete dirOffsets.UR;
				delete dirOffsets.UL;
			} else {
				delete dirOffsets.DR;
				delete dirOffsets.DL;
			}
		}

		const { row, col } = cell.getPosition();
		let toFind = [];
		for (const [dir, pos] of Object.entries(dirOffsets)) {
			const newRow = pos.row + row;
			const newCol = pos.col + col;
			if ((newRow >= 0 && newRow < 8) && (newCol >= 0 && newCol < 8)) {
				toFind.push({ row: newRow, col: newCol, dir: dir, empty: false });
			}
		}

		let availableMoves = [];
		// Verify if any of the opponentCells is in the toFind positions
		const canBeCaptured = [];
		for (const opponentCell of opponentCells) {
			const { row, col } = opponentCell.getPosition();
			const opIndex = toFind.findIndex(move => move.row === row && move.col === col);
			if (opIndex === -1) continue;
			canBeCaptured.push(...toFind.splice(opIndex, 1));
		}

		let hasCaptureMove = false;
		for (const emptyCell of this.cells.empty) {
			const { row, col } = emptyCell.getPosition();
			let empIndex = -1;
			if (!hasCaptureMove) {
				empIndex = toFind.findIndex(move => move.row === row && move.col === col);
				if (empIndex !== -1) {
					toFind.splice(empIndex, 1);
					availableMoves.push({
						cell: emptyCell,
						capture: undefined
					});
					continue;
				}
			}

			empIndex = canBeCaptured.findIndex(cell => {
				const offset = dirOffsets[cell.dir];
				return (cell.row + offset.row) === row && (cell.col + offset.col) === col;
			});
			if (empIndex === -1) continue;
			if (!hasCaptureMove) {
				hasCaptureMove = true;
				availableMoves = [];
			}
			
			const captured = canBeCaptured.splice(empIndex, 1)[0];
			availableMoves.push({
				cell: emptyCell,
				capture: { row: captured.row, col: captured.col }
			});
		}

		return availableMoves;
	}

	/**
	 * Determines the valid custom moves for a king piece
	 * @method getKingValidMoves
	 * @param {[BoardCell]} playerCells - array with the turn's player cells
	 * @param {BoardCell} cell - piece's cell for which the valid moves will be determined
	 * @returns {[{cell: BoardCell, capture: {row: integer, col: integer} | undefined}]} piece's valid moves
	 */
	getKingValidMoves(playerCells, cell) {
		const { row, col } = cell.getPosition();
		let toFind = [];
		for (let i = 1; i < 8; i++) {
			if (col + i < 8) {
				if (row + i < 8) toFind.push({ row: row + i, col: col + i, dir: "DR", empty: false });
				if (row - i >= 0) toFind.push({ row: row - i, col: col + i, dir: "DL", empty: false });
			}
			if (col - i >= 0) {
				if (row + i < 8) toFind.push({ row: row + i, col: col - i, dir: "UR", empty: false });
				if (row - i >= 0) toFind.push({ row: row - i, col: col - i, dir: "UL", empty: false });
			}
		}

		const usedCells = {};

		for (const cell of playerCells) {
			const cellPosition = cell.getPosition();
			const cellIndex = toFind.findIndex(position => {
				return position.row === cellPosition.row && position.col === cellPosition.col;
			});
			if (cellIndex === -1) continue;
			toFind = toFind.filter((v, i) => i < cellIndex || v.dir !== toFind[cellIndex].dir); // se encontra peça do mesmo player, tudo que está após é inválido
		}

		for (const emptyCell of this.cells.empty) {
			const emptyPosition = emptyCell.getPosition();
			const emptyIndex = toFind.findIndex(position => position.row === emptyPosition.row && position.col === emptyPosition.col);
			if (emptyIndex === -1) continue;
			usedCells[emptyCell.getID()] = emptyCell;
			toFind[emptyIndex].empty = true;
		}

		const capture = {};
		const empty = [];
		const invalidDirections = {
			"DR": false,
			"DL": false,
			"UR": false,
			"UL": false
		};
		for (let i = 0; i < toFind.length; i++) {
			const validPosition = toFind[i];
			if (invalidDirections[validPosition.dir]) continue;
			if (validPosition.empty) {
				empty.push(validPosition);
				continue;
			}
			const nextValid = toFind.filter((value, index) => value.dir === validPosition.dir && index > i); // procurar peça para a frente
			if (nextValid.length === 0) continue; // não tem válidas para a frente -> torna-se inválida
			const nextOpponent = nextValid.findIndex(cell => !cell.empty);
			if (nextOpponent !== -1) {
				if (nextOpponent === 0) {
					invalidDirections[validPosition.dir] = true;
					continue; // se a próxima válid não for empty -> torna-se inválida
				}
				nextValid.splice(nextOpponent, nextValid.length - nextOpponent); // tudo para a frente de outra opponent não deve ser considerado válido
			}
			toFind = toFind.filter(position => position.dir !== validPosition.dir);
			capture[Board.calculateCellID(validPosition.row, validPosition.col)] = { position: validPosition, valid: nextValid }; // é válida para se jogar
		}

		let result = [];
		const captureKeys = Object.keys(capture);
		// não há nenhuma para capturar, retorna as empty para onde pode jogar
		if (captureKeys.length === 0) {
			// é preciso verificar se não há nada entre a empty e a outra
			result = empty.map(position => ({
				cell: usedCells[Board.calculateCellID(position.row, position.col)],
				capture: undefined
			}));
		} else {
			result = captureKeys.map(key => {
				const toCapture = capture[key];
				return toCapture.valid.map(validMove => ({
					cell: usedCells[Board.calculateCellID(validMove.row, validMove.col)],
					capture: toCapture.position
				}));
			})
		}
		return result.flat();
	}

	/**
	 * Determines the valid moves for a piece of a specific cell
	 * @method getValidMoves
	 * @param {boolean} turn - current turn
	 * @param {[BoardCell]} playerCells - array with the turn's player cells
	 * @param {BoardCell} cell - piece's cell for which the valid moves will be determined
	 * @returns {[{cell: BoardCell, capture: {row: integer, col: integer} | undefined}]} piece's valid moves
	 */
	getValidMoves(turn, playerCells, cell) {
		if (cell.getPiece().getIsKing())
			return this.customKingMoves ? this.getKingValidMoves(playerCells, cell) : this.getMoves(turn, cell);
		return this.getMoves(turn, cell);
	}

	/**
	 * Determines the valid moves for all the pieces of the turn's player
	 * @method setValidMoves
	 * @param {boolean} turn - turn for which the valid moves should be determined 
	 */
	setValidMoves(turn) {
		const playerCells = turn ? this.cells.player1 : this.cells.player0;
		let hasCaptureMove = false;
		let result = {};
		for (const cell of playerCells) {
			const validMoves = this.getValidMoves(turn, playerCells, cell);
			if (validMoves.length === 0) continue;
			// if some piece is available to score, the others that are not, should not be considered valid moves
			if (validMoves[0].capture === undefined && hasCaptureMove) continue;
			else if (validMoves[0].capture !== undefined && !hasCaptureMove) {
					result = {};
					hasCaptureMove = true;
			}
			result[cell.getID()] = validMoves;
		}
		this.validMoves = result;
	}

	/**
   * Turns off the tracking light
	 * @method turnOffTrackingLight
	 */
	turnOffTrackingLight() {
		if (this.previouslyPickedCell === undefined) return;
		this.previouslyPickedCell.turnOffTrackingLight();
	}

	/**
	 * Removes a cell with a specific position from an array of cells
	 * @method removeCell
	 * @param {[BoardCell]} cells - array of cells
	 * @param {{row: integer, col: integer}} pos - cell's position
	 * @returns {BoardCell | -1} the removed cell if it exists, -1 otherwise
	 */
	removeCell(cells, pos) {
		const index = cells.findIndex(cell => {
			const { row, col } = cell.getPosition();
			return row === pos.row && col === pos.col;
		});
		if (index === -1) return -1;

		return cells.splice(index, 1)[0];
	}

	/**
	 * Removes a captured cell from the its array of cells of its owner
	 * @method captureCell
	 * @param {boolean} turn - current turn
	 * @param {{row: integer, col: integer}} capturedPos - captured cell's position
	 * @returns {{capturedCell: BoardCell, capturedPiece: GamePiece}} capturedCell and capturedPiece
	 */
	captureCell(turn, capturedPos) {
		let capturedCell = (turn) ?
			this.removeCell(this.cells.player0, capturedPos)
			:
			this.removeCell(this.cells.player1, capturedPos);
		if (capturedCell === -1) return undefined;

		this.cells.empty.push(capturedCell);
		return {capturedCell, capturedPiece: capturedCell.getPiece()};
	}

	/**
	 * Swaps a cell for another in an array of cells
	 * @method changeCells
	 * @param {[BoardCell]} cells - array of cells
	 * @param {BoardCell} from - cell to be removed
	 * @param {BoardCell} to - cell to be added
	 * @returns {[BoardCell]} new array of cells
	 */
	changeCells(cells, from, to) {
		cells = cells.filter(cell => cell.getID() !== from.getID());
		cells.push(to);
		return cells;
	}

	/**
	 * Moves a piece from one cell to another, removing the piece's current
	 *  cell from its owner cells' array and adding it to the empty cells' array.
	 *  Moreover adds its new cell to its owner cells' array.
	 * @method swapCells
	 * @param {boolean} turn - current turn
	 * @param {BoardCell} from - piece's current cell 
	 * @param {BoardCell} to - piece's new cell
	 */
	swapCells(turn, from, to) {
		if (turn) {
			this.cells.player1 = this.changeCells(this.cells.player1, from, to);
		} else {
			this.cells.player0 = this.changeCells(this.cells.player0, from, to);
		}

		this.cells.empty = this.changeCells(this.cells.empty, to, from);
	}

	/**
	 * Moves a piece from one cell to another and executes a capture if it exists
	 * @method move
	 * @param {BoardCell} from - piece's current cell 
	 * @param {BoardCell} to - piece's new cell
	 * @param {boolean} turn - current turn
	 * @param {{row: integer, col: integer}} captured - captured cell's position
	 * @returns {{capturedCell: BoardCell, capturedPiece: GamePiece} | undefined} capturedCell and capturedPiece
	 */
	move(from, to, turn, captured = undefined) {
		let result = undefined;
		if (captured !== undefined)
			result = this.captureCell(turn, captured);
		this.swapCells(turn, from, to);
		return result;
	}

	/**
	 * Checks if the picked cell has any valid move
	 * @method checkValid
	 * @param {BoardCell} pickedCell - cell that the player has picked 
	 * @returns {boolean} true if the picked cell has valid moves, false otherwise
	 */
	checkValid(pickedCell) {
		if (this.validMoves[pickedCell.getID()] !== undefined) return true;
		if (this.previouslyPickedCell !== undefined) {
			this.previouslyPickedCell.turnOffTrackingLight();
			this.previouslyPickedCell = undefined;
		}
		this.invalidPiecesPicked[pickedCell.getID()] = new MyInvalidPieceAnimation(
			pickedCell.getSize(),
			() => this.removeFromInvalidPiecesPicked.push(pickedCell.getID())
		);
		return false;
	}

	/**
	 * Handles a player pick
	 * @method pickHandler
	 * @param {[object, integer]} pickResult - result of a player pick
	 * @param {GameState} gameState - current game state 
	 * @param {boolean} turn - current turn 
	 * @param {function} callback - function to be called when the handle is over
	 * @returns {Undo | undefined} undo's object when the pick results on a valid move, undefined otherwise
	 */
	pickHandler(pickResult, gameState, turn, callback) {
		const pickedCell = pickResult[0];
		if (!pickedCell instanceof BoardCell) return FAILURE;
		const playerCells = turn ? this.cells.player1 : this.cells.player0;

		switch (gameState) {
			case GameState.PICK_PIECE:
				// verify if it is a valid pick, considering the current turn and the picked piece
				if (!playerCells.includes(pickedCell)) {
					callback(FAILURE);
					return;
				}
				if (!this.checkValid(pickedCell)) {
					callback(INVALID_PIECE);
					return;
				}

				this.previouslyPickedCell = pickedCell;
				this.previouslyPickedCell.turnOnTrackingLight(this.position);
				callback(SUCCESS);
				break;
			case GameState.PICKED_PIECE:
				// check if the picked cell corresponds to a valid move of the previously picked cell
				let validMove = this.validMoves[this.previouslyPickedCell.getID()]
					.filter(move => move.cell === pickedCell);

				if (validMove.length === 0) {	
					if (!this.checkValid(pickedCell)) {
						callback(INVALID_PIECE);
						return;
					}

					if (!playerCells.includes(pickedCell)) {
						callback(FAILURE);
						return;
					}

					// the player had already chosen one piece but then opted for another
					// return failure because the player still needs to choose de destination cell
					this.previouslyPickedCell = pickedCell;
					this.previouslyPickedCell.turnOnTrackingLight(this.position);
					callback(FAILURE);
					return;
				}
				validMove = validMove[0];

				const undo = new Undo(this.previouslyPickedCell, pickedCell, this.validMoves, turn, this.timer);

				const capture = this.move(this.previouslyPickedCell, pickedCell, turn, validMove.capture);
				if (capture !== undefined) {
					if (capture.capturedPiece.getIsKing()) undo.setWasKing();
					undo.setCaptured(capture);
				}
				const captureSupport = (turn) ? this.supports.player0 : this.supports.player1;
				
				const wasKing = this.previouslyPickedCell.getPiece().getIsKing();
				
				this.movingPieceCell = this.previouslyPickedCell;
				this.previouslyPickedCell.movePiece(
					pickedCell,
					capture,
					captureSupport,
					() => {
						this.movingPieceCell = undefined;
						const turnToKing = !wasKing && pickedCell.getPiece().getIsKing(); 
						if (turnToKing) undo.setToKing();
						if (validMove.capture !== undefined) {
							const validMoves = this.getValidMoves(turn, playerCells, pickedCell);
							if (validMoves.length > 0 && validMoves[0].capture !== undefined) {
								this.validMoves = {};
								this.validMoves[pickedCell.getID()] = validMoves;
								this.previouslyPickedCell = pickedCell;
								this.previouslyPickedCell.turnOnTrackingLight(this.position);
								callback(PLAY_AGAIN);
								return;
							}
						}
						// calculate valid moves for next turn
						this.setValidMoves(!turn);
						if (Object.values(this.validMoves).length === 0) {
							if (turn) return callback(PLAYER1_WON);
							return callback(PLAYER0_WON);
						}
						callback(SUCCESS);
				});

				return undo;
			default: callback(FAILURE);
		}
	}

	/**
	 * Changes the board according to a specific move
	 * @method executeMove
	 * @param {Undo} move - move to be executed 
	 */
	executeMove(move) {
		const turn = move.getTurn();
		let playerCells = turn ? this.cells.player1 : this.cells.player0;

		const to = this.cells.empty.filter(cell => cell.getID() === move.getTo().getID())[0];
		const from = playerCells.filter(cell => cell.getID() === move.getFrom().getID())[0];
		let capturedPos = undefined;
		if (move.getCaptured() !== undefined) {
			capturedPos = move.getCaptured().capturedCell.getPosition();
		}

		// verify if it does not need IDs instead of objects in filter
		const captured = this.move(from, to, turn, capturedPos);
		const captureSupport = (turn) ? this.supports.player0 : this.supports.player1;
		
		this.movingPieceCell = from;
		this.movingPieceCell.movePiece(
			to,
			captured,
			captureSupport,
			() => this.movingPieceCell = undefined
		);
	
		this.timer = move.getTime(); // move only when the timer reaches the value ? (should we include the undos?)
	}

	/**
	 * Executes an undo
	 * @method undo
	 * @param {Undo} undo - undo's object to execute
	 * @param {function} callback - function to be called when the undo is over
	 * @returns 
	 */
	undo(undo, callback) {
		if (this.movingPieceCell !== undefined) {
			callback(FAILURE);
			return;
		};

		const turn = undo.getTurn();
		const to = undo.getTo();
		const from = undo.getFrom();
		
		const captured = undo.getCaptured();
		const hasCaptured = captured !== undefined;

		let playerCells;
		let opponentCells;
		let empty = this.cells.empty;
		if (turn) {
			playerCells = this.cells.player1;
			opponentCells = this.cells.player0;
		} else {
			playerCells = this.cells.player0;
			opponentCells = this.cells.player1;
		}

		this.movingPieceCell = to;
		const capturedSupport = (turn) ? this.supports.player0 : this.supports.player1;
		to.movePiece(
			from,
			captured,
			capturedSupport,
			() => {
				this.movingPieceCell = undefined;
				playerCells = playerCells.filter(cell => cell.getID() !== to.getID());
				empty = empty.filter(cell => !(cell.getID() === from.getID() || (hasCaptured && cell.getID() === captured.capturedCell.getID())));
				playerCells.push(from);
				empty.push(to);
				if (hasCaptured) {
					opponentCells.push(captured.capturedCell);
					captured.capturedCell.setPiece(captured.capturedPiece);
				}
				this.cells = {
					player1: (turn) ? playerCells : opponentCells,
					player0: (turn) ? opponentCells : playerCells,
					empty: empty
				};
				this.validMoves = undo.getValidMoves();		
				this.timer = undo.getTime();
				callback(SUCCESS, turn);
			},
			{ toKing: undo.getToKing(), wasKing: undo.getWasKing() }
		);
		this.previouslyPickedCell = undefined;
	}

	/**
	 * Removes the pieces that already end their invalid animation from the
	 *  invalidPiecesPicked array
	 * @method cleanInvalidPieces
	 */
	cleanInvalidPieces() {
		this.removeFromInvalidPiecesPicked.forEach(cellID => delete this.invalidPiecesPicked[cellID]);
		this.removeFromInvalidPiecesPicked = [];
	}

	/**
	 * Displays a cell valid for picking
	 * @method displayValidEmptyCell
	 * @param {BoardCell} cell - cell to be displayed
	 * @param {object | undefined} capture - if capture is not undefined, the cell should be displayed
	 *  as a move that executes a capture, otherwise, it should be displayed as a normal move
	 */
	displayValidEmptyCell(cell, capture) {
		this.scene.registerForPick(cell.getID(), cell);
		cell.display(capture === undefined ? MOVE : CAPTURE);
		this.scene.clearPickRegistration();
	}

	/**
	 * Displays the empty cells
	 * @method displayEmptyCells
	 * @param {[BoardCell]} cells - empty cells' array 
	 * @param {boolean} isPickable - true if the empty cells are valid for picking, false otherwise 
	 */
	displayEmptyCells(cells, isPickable) {
		const validMoves = isPickable ? this.validMoves[this.previouslyPickedCell.getID()] : [];
		cells.forEach(cell => {
			const cellIndex = validMoves.findIndex((validMove) => cell === validMove.cell);
			if (cellIndex === -1) cell.display();
			else this.displayValidEmptyCell(cell, validMoves[cellIndex].capture);
		});
	}

	/**
	 * Displays the cells of a player
	 * @method displayPlayerCells
	 * @param {[BoardCell]} cells - array of player's cells
	 * @param {boolean} isPickable - true if it is the player's turn, false otherwise 
	 */
	displayPlayerCells(cells, isPickable) {
		cells.forEach(cell => {
			const cellID = cell.getID();
			if (isPickable) this.scene.registerForPick(cellID, cell);
			const isInvalid = this.invalidPiecesPicked[cell.getID()];
			if (isInvalid !== undefined) cell.display(undefined, isInvalid.apply());
			else cell.display();
			if (isPickable) this.scene.clearPickRegistration();
		});
	}

	/**
	 * Displays the board
	 * @method display
	 * @param {GameState} state - current game state 
	 */
	display(state) {
		this.scene.pushMatrix();

		let matrix = mat4.create();
		mat4.translate(matrix, matrix, [this.position.x, 0.01, this.position.z]);
		this.scene.multMatrix(matrix);

		const player0Playing = this.cellsCreated && !state.turn && (state.state === GameState.PICK_PIECE || state.state === GameState.PICKED_PIECE) && this.movingPieceCell === undefined;
		const player1Playing = this.cellsCreated && state.turn && (state.state === GameState.PICK_PIECE || state.state === GameState.PICKED_PIECE) && this.movingPieceCell === undefined;

		this.displayEmptyCells(this.cells.empty, state.state === GameState.PICKED_PIECE && this.movingPieceCell === undefined);
		this.displayPlayerCells(this.cells.player0, player0Playing);
		this.displayPlayerCells(this.cells.player1, player1Playing);

		this.scene.popMatrix();

		this.cleanInvalidPieces();
	}

	/**
	 * Update function, called periodically, which updates the board components
	 * @method update
	 * @param {number} t - currentTime
	 * @returns {number} the state of the cells' and pieces' animations
	 */
	update(t) {
		if (!this.cellsCreated) {
			this.cellsCreated = this.lastCellCreated.creationAnimIsOver();
		}
		if (this.previouslyPickedCell !== undefined && this.validMoves[this.previouslyPickedCell.getID()] !== undefined) {
			this.validMoves[this.previouslyPickedCell.getID()].forEach(validMove => validMove.cell.updateShader(t));
		}
		Object.keys(this.invalidPiecesPicked).forEach(key => this.invalidPiecesPicked[key].update(t));
		if (this.movingPieceCell === undefined) return NO_ANIMATION;
		return this.movingPieceCell.update(t);
	}
}
