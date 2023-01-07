/**
 * Settings
 */
export class Settings {
  /**
   * Loads small mode settings
   * @method __loadSettingsSmall
   * @returns {object} small settings
   * @private
   * @static
   */
  static __loadSettingsSmall() {
    const BOARD_POSITION = { x: 7.25, z: 5.75 };
    const BOARD_SIZE = 1.5;

    const TIMER_POSITION = {
      x: BOARD_POSITION.x + BOARD_SIZE + 0.25,
      z: BOARD_POSITION.z + BOARD_SIZE / 2,
    };
    const TIMER_DIMENSIONS = {
      length: BOARD_SIZE / 2,
      width: BOARD_SIZE / 20, // timer length / 10
      height: 0.25,
    };

    const SUPPORT_POSITION = {
      player0: { x: 9, z: 7.25 },
      player1: { x: 9, z: 5.75 },
    };
    const SUPPORT_DIMENSIONS = {
      baseRadius: 0.1,
      baseHeight: 0.01,
      radius: 0.005,
      height: 0.5,
    };
    const SUPPORT_SCALE_FACTOR = 0.2;

    return {
      BOARD_POSITION,
      BOARD_SIZE,
      TIMER_POSITION,
      TIMER_DIMENSIONS,
      SUPPORT_POSITION,
      SUPPORT_DIMENSIONS,
      SUPPORT_SCALE_FACTOR,
    };
  }

  /**
   * Loads large mode settings
   * @method __loadSettingsLarge
   * @returns {object} large settings
   * @private
   * @static
   */
  static __loadSettingsLarge() {
    const BOARD_POSITION = { x: 12, z: 2 };
    const BOARD_SIZE = 6;

    const TIMER_POSITION = {
      x: BOARD_POSITION.x + BOARD_SIZE + 0.75,
      z: BOARD_POSITION.z + BOARD_SIZE / 2,
    };
    const TIMER_DIMENSIONS = {
      length: BOARD_SIZE / 2,
      width: BOARD_SIZE / 20, // timer length / 10
      height: 1,
    };

    const SUPPORT_POSITION = {
      player0: { x: 19, z: 9 },
      player1: { x: 19, z: 1 },
    };
    const SUPPORT_DIMENSIONS = {
      baseRadius: 0.5,
      baseHeight: 0.05,
      radius: 0.025,
      height: 1.5,
    };
    const SUPPORT_SCALE_FACTOR = 0.75;

    return {
      BOARD_POSITION,
      BOARD_SIZE,
      TIMER_POSITION,
      TIMER_DIMENSIONS,
      SUPPORT_POSITION,
      SUPPORT_DIMENSIONS,
      SUPPORT_SCALE_FACTOR,
    };
  }

  /**
   * Loads settings based on game mode
   * @method loadSettings
   * @param {string} mode - game mode
   * @returns {object} settings
   * @static
   */
  static loadSettings(mode) {
    if (mode === "small") return this.__loadSettingsSmall();
    else if (mode === "large") return this.__loadSettingsLarge();
  }

  /**
   * Loads game palette (colors which will be used in the game)
   * @method loadPalette
   * @returns {object} palette
   * @static
   */
  static loadPalette() {
    return {
      ice: { r: 1.0, g: 1.0, b: 1.0 },
      grey: { r: 0.204, g: 0.227, b: 0.251 },
      player0: { r: 0.012, g: 0.4, b: 0.4 },
      player1: { r: 0.506, g: 0.353, b: 0.753 },
    };
  }
}
