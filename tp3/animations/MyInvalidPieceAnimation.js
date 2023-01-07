const ANIMATION_TIME = 0.15;
const JUMP_SIZE = 0.25;

/**
 * MyInvalidPieceAnimation
 * @constructor
 * @param cellSize - size of the cell side
 * @param callback - function to be called when the animation is over
 */
export default class MyInvalidPieceAnimation {
	/**
	 * @constructor
	 * @param {float} cellSize - size of the cell side
	 * @param {function} callback - function to be called when the animation is over
	 */
	constructor(cellSize, callback) {
		this.animStart = -1;
		this.cellSize = cellSize;
		this.currMatrix = mat4.create();
		this.callback = callback;
  }

	/**
   * Update function, called periodically, which updates the transformations matrix
   * @method update
   * @param {number} t currentTime 
   */
	update(t) {
		const tSeconds = t / 1000;
		if (this.animStart === -1) this.animStart = tSeconds;
		
		let delta = (tSeconds - this.animStart) / ANIMATION_TIME;
		if (delta >= 1) {
			delta = 1;
			this.animStart = undefined;
		}
		
		if (delta > 0.5) delta = 1 - delta;

		delta /= 0.5;

		mat4.translate(this.currMatrix, mat4.create(), [0, 0, -delta * this.cellSize * JUMP_SIZE]);
  }

  /**
   * Gets the current transformations matrix, if the animation is over
	 *  calls the callback function
   * @method apply
   * @returns {mat4} current transformations matrix
   */
	apply() {
		if (this.animStart === undefined) this.callback();
    return this.currMatrix; 
  }
}
