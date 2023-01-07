/**
 * Undo
 * @constructor
 * @param from - moved piece initial cell
 * @param to - move piece final cell
 * @param validMoves - set of validMoves available in the turn
 * @param turn - turn in which the move was done
 * @param time - time of the move
 * @param captured - move captured piece and its cell
 */
export default class Undo {
	/**
   * @method constructor
	 * @param {BoardCell} from - moved piece initial cell
	 * @param {BoardCell} to - move piece final cell
	 * @param {set} validMoves - set of validMoves available in the turn
	 * @param {boolean} turn - turn in which the move was done
	 * @param {Timer} time - time of the move
	 * @param {{BoardCell, GamePiece} | undefined} captured - move captured piece and its cell
   */
	constructor(from, to, validMoves, turn, time, captured=undefined) {
			this.from = from;
			this.to = to;
			this.currValidMoves = validMoves;
			this.currTurn = turn;
			this.currTime = time;
			this.captured = captured;
			this.toKing = false;
			this.wasKing = false;
	}

  /**
   * Gets the moved piece initial cell
   * @method getFrom
   * @returns {BoardCell} initial cell
   */
	getFrom() {
			return this.from;
	}

  /**
   * Gets the moved piece final cell
	 * @method getTo
	 * @returns {BoardCell} final cell
	 */
	getTo() {
		return this.to;
	}

	/**
	 * Gets the set of valid moves available in the turn
	 * @method getValidMoves
	 * @returns {set} validMoves
	 */
	getValidMoves() {
		return this.currValidMoves;
	}

	/**
	 * Gets the turn in which the move was done
	 * @method getTurn
	 * @returns {boolean} turn
	 */
	getTurn() {
		return this.currTurn;
	}

  /**
	 * Gets the time of the move
	 * @method getTime
	 * @returns {Timer} time
	 */
	getTime() {
		return this.currTime;
	}

	/**
	 * Gets the move captured piece and its cell,
	 *  undefined if it isn't a capture move 
	 * @method getCaptured
	 * @returns {{BoardCell, GamePiece} | undefined} move captured piece and its cell
	 */
	getCaptured() {
		return this.captured;
	}

	/**
	 * Sets the capture, turning it into a capture move
	 * @method setCaptured
	 * @param {{BoardCell, GamePiece} | undefined} captured - move captured cell and its cell
	 */
	setCaptured(captured) {
			this.captured = captured;
	}

	/**
	 * Gets the information about a possible transformation
	 *  into a king in this move
	 * @method getToKing
	 * @returns {boolean} true if the movedPiece transformed
	 * 										 into king, false otherwise
	 */
	getToKing() {
			return this.toKing;
	}

	/**
	 * Declares that the moved piece transformed
	 *  into a king in this move
	 * @method setToKing
	 */
	setToKing() {
			this.toKing = true;
	}

	/**
	 * Gets the information about the captured piece
	 *  type
	 * @method getWasKing
	 */
	getWasKing() {
			return this.wasKing;
	}

	/**
	 * Declares that the captured piece was
	 *  a king
	 * @method setWasKing
	 */
	setWasKing() {
			this.wasKing = true;
	}
}
