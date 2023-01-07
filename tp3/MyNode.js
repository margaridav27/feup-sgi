/**
 * MyNode
 * @constructor
 * @param id - number identifier of the node
 * @param nodeID - string identifier of the node
 * @param transformation - transformation matrix of the node
 */
export class MyNode {
  /**
   * @constructor
   * @param {number} id - node number identifier
   * @param {string} nodeID - node string identifier
   * @param {mat4} transformation - node transformation
   */
  constructor(id, nodeID, transformation) {
    this.id = id;
    this.nodeID = nodeID;

    this.isTransformationRef = typeof transformation == "string" ? true : false;
    this.transformationMatrix = this.isTransformationRef
      ? null
      : transformation;
    this.transformationRef = this.isTransformationRef ? transformation : null;

    this.materials = [];
    this.currentMaterial = 0;

    this.textures = [];
    this.currentTexture = 0;

    this.animation = null;

    this.highlightValues = { color: null, scaleFactor: null };

    this.primitiveChildren = [];
    this.componentChildren = [];

    this.controlledAnim = null;
  }

  /**
   * Gets node sequencial number
   * @method getID
   * @returns {number} the node's sequencial number
   */
  getID() {
    /**
     * Is added 1000 to the id value to facilitate the
     *  differentiation between the game's and node's picks
     */
    return 1000 + this.id;
  }

  /**
   * Gets node ID
   * @method getNodeID
   * @returns {string} the node's ID
   */
  getNodeID() {
    return this.nodeID;
  }

  /**
   * Check if the node's transformation is a transformation reference
   * @method isTransformationRef
   * @returns {boolean} - true if the node's transformation is a
   *                      transformation reference, false otherwise
   */
  isTransfRef() {
    return this.isTransformationRef;
  }

  /**
   * Gets node's transformation
   * @method getTransformation
   * @returns {string | mat4} - the reference to the transformation or the transformation
   *                            matrix that should be applied to the node
   */
  getTransformation() {
    return {
      isTransformationRef: this.isTransformationRef,
      transformation: this.isTransformationRef
        ? this.transformationRef
        : this.transformationMatrix,
    };
  }

  /**
   * Sets the node's transformation matrix
   * @mthod setTransformationMatrix
   * @param {mat4} transformationMatrix
   */
  setTransformationMatrix(transformationMatrix) {
    this.isTransformationRef = false;
    this.transformationMatrix = transformationMatrix;
  }

  /**
   * Sets the reference to the node's transformation
   * @method setTransformationRef
   * @param {string} transformationRef
   */
  setTransformationRef(transformationRef) {
    this.isTransformationRef = true;
    this.transformationRef = transformationRef;
  }

  /**
   * Gets the node's primitive children array
   * @method getPrimitiveChildren
   * @returns {primitiveChildren} - primitive children array
   */
  getPrimitiveChildren() {
    return this.primitiveChildren;
  }

  /**
   * Sets the node's children primitives array
   * @method setPrimitiveChildren
   * @param {array} primitiveChildren - children primitives array
   */
  setPrimitiveChildren(primitiveChildren) {
    this.primitiveChildren = primitiveChildren;
  }

  /**
   * Adds a new primitive to the node's children primitives array
   * @method addPrimitive
   * @param {string} newChild - child primitive
   */
  addPrimitive(newChild) {
    this.primitiveChildren.push(newChild);
  }

  /**
   * Gets the node's children components array
   * @method getComponentChildren
   * @returns {array} - children components list
   */
  getComponentChildren() {
    return this.componentChildren;
  }

  /**
   * Sets the node's children components array
   * @method setComponentChildren
   * @param {array} componentChildren - children components list
   */
  setComponentChildren(componentChildren) {
    this.componentChildren = componentChildren;
  }

  /**
   * Adds a new component to the children components array
   * @method addComponent
   * @param {string} newChild - child component
   */
  addComponent(newChild) {
    this.componentChildren.push(newChild);
  }

  /**
   * Gets node's materials array
   * @method getMaterials
   * @returns {array} - materials array
   */
  getMaterials() {
    return this.materials;
  }

  /**
   * Sets node's materials array
   * @method setMaterials
   * @param {array} materials - materials array
   */
  setMaterials(materials) {
    this.materials = materials;
  }

  /**
   * Gets node's currently applied material
   * @method getCurrentMaterial
   * @returns {string} - current material
   */
  getMaterial() {
    return this.materials[this.currentMaterial];
  }

  /**
   * Adds a new material to the node's materials array
   * @method addMaterial
   * @param {string} material
   */
  addMaterial(material) {
    this.materials.push(material);
  }

  /**
   * Updates the current material to the following material
   * in the list (to the first in the last one)
   * @method changeMaterial
   */
  changeMaterial() {
    this.currentMaterial = (this.currentMaterial + 1) % this.materials.length;
  }

  /**
   * Gets node's textures array
   * @method getTextures
   * @returns {array} - textures array
   */
  getTextures() {
    return this.textures;
  }

  /**
   * Sets node's textures array
   * @method setTextures
   * @param {array} textures - textures array
   */
  setTextures(textures) {
    this.textures = textures;
  }

  /**
   * Gets node's currently applied texture
   * @method getCurrentTexture
   * @returns {string} - current texture
   */
  getTexture() {
    return this.textures[this.currentTexture];
  }

  /**
   * Adds a new texture to the textures array
   * @method addTexture
   * @param {string} texture
   */
  addTexture(texture) {
    this.textures.push(texture);
  }

  /**
   * Updates the current texture to the following texture
   * in the list (to the first in the last one)
   * @method changeTexture
   */
  changeTexture() {
    this.currentTexture = (this.currentTexture + 1) % this.textures.length;
  }

  /**
   * Sets the node's animation
   * @param {animationID} animation
   */
  setAnimation(animation) {
    this.animation = animation;
  }

  /**
   * Gets the node's animation
   * @method getAnimation
   * @returns {string} - animation
   */
  getAnimation() {
    return this.animation;
  }

  /**
   * Sets the node's highlighted object
   * @method setHighlight
   * @param {object} highlightValues - highlighted object
   */
  setHighlightValues(highlightValues) {
    this.highlightValues = highlightValues;
  }

  /**
   * Gets the node's highlighted object's values array
   * @method getHighlightValues
   * @returns {array} - highlighted object's values array
   */
  getHightlightValues() {
    return this.highlightValues;
  }

  /**
   * Sets the animation controlled by the node
   * @method setControlledAnim
   * @param {string} animation - the id of the animation
   */
  setControlledAnim(animation) {
    this.controlledAnim = animation;
  }

  /**
   * Gets the animation controlled by the node
   * @method getControlledAnim
   * @returns {string} - id of the controlled animation
   */
  getControlledAnim() {
    return this.controlledAnim;
  }
}
