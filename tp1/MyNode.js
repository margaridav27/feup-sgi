export class MyNode {
  /**
   * @constructor
   */
  constructor(nodeID, transformation) {
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

    this.primitiveChildren = [];
    this.componentChildren = [];
  }

  /**
   * @returns {nodeID} The ID of the node
   */
  getNodeID() {
    return this.nodeID;
  }


  /**
   * @returns {isTransformationRef} True if the node has a reference to a transformation
   *                                already defined false otherwise
   */
  isTransfRef() {
    return this.isTransformationRef;
  }
  /**
   * @returns {transformation} The reference to the transformation or the transformation matrix
   *                            that should be applied to the node
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
   * Set the transformation matrix that will be applied to the node
   * @param {transformation matrix} transformationMatrix
   */
  setTransformationMatrix(transformationMatrix) {
    this.isTransformationRef = false;
    this.transformationMatrix = transformationMatrix;
  }
  /**
   * Set the reference to the transformation matrix that will be applied to the node
   * @param {transformation reference} transformationMatrix
   */
  setTransformationRef(transformationRef) {
    this.isTransformationRef = true;
    this.transformationRef = transformationRef;
  }


  /**
   * @returns {primitiveChildren} Node's children primitives list
   */
  getPrimitiveChildren() {
    return this.primitiveChildren;
  }
  /**
   * Sets the children primitives list
   * @param {new children primitives list} primitiveChildren
   */
  setPrimitiveChildren(primitiveChildren) {
    this.primitiveChildren = primitiveChildren;
  }
  /**
   * Adds a new primitive to the children primitives list
   * @param {new child primitive} newChild
   */
  addPrimitive(newChild) {
    this.primitiveChildren.push(newChild);
  }


  /**
   * @returns {componentChildren} Node's children components list
   */
  getComponentChildren() {
    return this.componentChildren;
  }
  /**
   * Sets the children components list
   * @param {new children components list} componentChildren
   */
  setComponentChildren(componentChildren) {
    this.componentChildren = componentChildren;
  }
  /**
   * Adds a new component to the children components list
   * @param {new child component} newChild
   */
  addComponent(newChild) {
    this.componentChildren.push(newChild);
  }


  /**
   * @returns {materials} Node's materials list
   */
  getMaterials() {
    return this.materials;
  }
  /**
   * @returns {current material} Node's current material
   */
  getMaterial() {
    return this.materials[this.currentMaterial];
  }
  /**
   * Sets the materials list
   * @param {new materials list} materials
   */
  setMaterials(materials) {
    this.materials = materials;
  }
  /**
   * Adds a new material to the materials list
   * @param {new material} material
   */
  addMaterial(material) {
    this.materials.push(material);
  }
  /**
   * Updates the current material to the following material
   *  in the list (to the first in the last one)
   */
  changeMaterial() {
    this.currentMaterial = (this.currentMaterial + 1) % this.materials.length;
  }


  /**
   * @returns {textures} Node's textures list
   */
  getTextures() {
    return this.textures;
  }
  /**
   * @returns {current texture} Node's current texture
   */
  getTexture() {
    return this.textures[this.currentTexture];
  }
  /**
   * Sets the textures list
   * @param {new textures list} textures
   */
  setTextures(textures) {
    this.textures = textures;
  }
  /**
   * Adds a new texture to the textures list
   * @param {new texture} texture
   */
  addTexture(texture) {
    this.textures.push(texture);
  }
  /**
   * Updates the current texture to the following texture
   *  in the list (to the first in the last one)
   */
  changeTexture() {
    this.currentTexture = (this.currentTexture + 1) % this.textures.length;
  }
}
