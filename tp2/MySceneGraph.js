import {
  CGFcamera,
  CGFcameraOrtho,
  CGFXMLreader,
  CGFappearance,
  CGFtexture,
  CGFshader,
} from "../lib/CGF.js";
import { MyRectangle } from "./primitives/MyRectangle.js";
import { MyCylinder } from "./primitives/MyCylinder.js";
import { MyTriangle } from "./primitives/MyTriangle.js";
import { MySphere } from "./primitives/MySphere.js";
import { MyTorus } from "./primitives/MyTorus.js";
import { MyPatch } from "./primitives/MyPatch.js";
import { MyNode } from "./MyNode.js";
import { MyKeyframeAnimation } from "./animations/MyKeyframeAnimation.js";

// Order of the groups in the XML document.
const SCENE_INDEX = 0;
const VIEWS_INDEX = 1;
const AMBIENT_INDEX = 2;
const LIGHTS_INDEX = 3;
const TEXTURES_INDEX = 4;
const MATERIALS_INDEX = 5;
const TRANSFORMATIONS_INDEX = 6;
const PRIMITIVES_INDEX = 7;
const ANIMATIONS_INDEX = 8;
const COMPONENTS_INDEX = 9;

/**
 * MySceneGraph - class representing the scene graph
 * @constructor
 * @param filename - name of the XML file
 * @param scene - scene where the graph will be applied
 */
export class MySceneGraph {
  /**
   * @constructor
   * @param {string} filename
   * @param {CGFscene} scene
   */
  constructor(filename, scene) {
    this.loadedOk = null;

    // Establish bidirectional references between scene and graph
    this.scene = scene;
    scene.graph = this;

    // True if the normals should be displayed, false otherwise
    this.displayNormals = false;

    // ID of the root element
    this.idRoot = null;

    // File reading
    this.reader = new CGFXMLreader();

    /*
     * Read the contents of the xml file, and refer to this class for loading and error handlers.
     * After the file is read, the reader calls onXMLReady on this object.
     * If any error occurs, the reader calls onXMLError on this object, with an error message.
     */
    this.reader.open("scenes/" + filename, this);

    this.shader = new CGFshader(
      this.scene.gl,
      "shaders/shader.vert",
      "shaders/shader.frag"
    );

    this.displayHighlighted = {};

    this.currTime = 0;
    this.lastTValue = 0;
  }

  /**
   * Callback to be executed after successful reading
   * @method onXMLReady
   */
  onXMLReady() {
    this.log("XML Loading finished.");
    const rootElement = this.reader.xmlDoc.documentElement;

    // Here should go the calls for different functions to parse the various blocks
    const error = this.parseXMLFile(rootElement);

    if (error !== null) {
      this.onXMLError(error);
      return;
    }

    if (!this.checkNodeTree(this.components[this.idRoot], [])) {
      return;
    }

    this.loadedOk = true;

    // As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
    this.scene.onGraphLoaded();
  }

  /**
   * Parses the XML file, processing each block
   * @method parseXMLFile
   * @param {XML root element} rootElement
   */
  parseXMLFile(rootElement) {
    if (rootElement.nodeName !== "sxs") return "root tag <sxs> missing";

    const nodes = rootElement.children;

    // Reads the names of the nodes to an auxiliary buffer.
    const nodeNames = [];

    for (let i = 0; i < nodes.length; i++) {
      nodeNames.push(nodes[i].nodeName);
    }

    let error;

    // Processes each node, verifying errors.

    // <scene>
    let index;
    if ((index = nodeNames.indexOf("scene")) === -1)
      return "tag <scene> missing";
    else {
      if (index !== SCENE_INDEX)
        this.onXMLMinorError("tag <scene> out of order " + index);

      //Parse scene block
      if ((error = this.parseScene(nodes[index])) !== null) return error;
    }

    // <views>
    if ((index = nodeNames.indexOf("views")) === -1)
      return "tag <views> missing";
    else {
      if (index !== VIEWS_INDEX)
        this.onXMLMinorError("tag <views> out of order");

      //Parse views block
      if ((error = this.parseView(nodes[index])) !== null) return error;
    }

    // <ambient>
    if ((index = nodeNames.indexOf("ambient")) === -1)
      return "tag <ambient> missing";
    else {
      if (index !== AMBIENT_INDEX)
        this.onXMLMinorError("tag <ambient> out of order");

      //Parse ambient block
      if ((error = this.parseAmbient(nodes[index])) !== null) return error;
    }

    // <lights>
    if ((index = nodeNames.indexOf("lights")) === -1)
      return "tag <lights> missing";
    else {
      if (index !== LIGHTS_INDEX)
        this.onXMLMinorError("tag <lights> out of order");

      //Parse lights block
      if ((error = this.parseLights(nodes[index])) !== null) return error;
    }
    // <textures>
    if ((index = nodeNames.indexOf("textures")) === -1)
      return "tag <textures> missing";
    else {
      if (index !== TEXTURES_INDEX)
        this.onXMLMinorError("tag <textures> out of order");

      //Parse textures block
      if ((error = this.parseTextures(nodes[index])) !== null) return error;
    }

    // <materials>
    if ((index = nodeNames.indexOf("materials")) === -1)
      return "tag <materials> missing";
    else {
      if (index !== MATERIALS_INDEX)
        this.onXMLMinorError("tag <materials> out of order");

      //Parse materials block
      if ((error = this.parseMaterials(nodes[index])) !== null) return error;
    }

    // <transformations>
    if ((index = nodeNames.indexOf("transformations")) === -1)
      return "tag <transformations> missing";
    else {
      if (index !== TRANSFORMATIONS_INDEX)
        this.onXMLMinorError("tag <transformations> out of order");

      //Parse transformations block
      if ((error = this.parseTransformations(nodes[index])) !== null)
        return error;
    }

    // <primitives>
    if ((index = nodeNames.indexOf("primitives")) === -1)
      return "tag <primitives> missing";
    else {
      if (index !== PRIMITIVES_INDEX)
        this.onXMLMinorError("tag <primitives> out of order");

      //Parse primitives block
      if ((error = this.parsePrimitives(nodes[index])) !== null) return error;
    }

    // <animations>
    if ((index = nodeNames.indexOf("animations")) === -1)
      return "tag <animations> missing";
    else {
      if (index !== ANIMATIONS_INDEX)
        this.onXMLMinorError("tag <animations> out of order");

      //Parse animations block
      if ((error = this.parseAnimations(nodes[index])) !== null) return error;
    }

    // <components>
    if ((index = nodeNames.indexOf("components")) === -1)
      return "tag <components> missing";
    else {
      if (index !== COMPONENTS_INDEX)
        this.onXMLMinorError("tag <components> out of order");

      //Parse components block
      if ((error = this.parseComponents(nodes[index])) !== null) return error;
    }
    this.log("all parsed");
    return null;
  }

  /**
   * Parses the <scene> block
   * @method parseScene
   * @param {scene block element} sceneNode
   */
  parseScene(sceneNode) {
    // Get root of the scene.
    const root = this.reader.getString(sceneNode, "root");
    if (root === null) return "no root defined for scene";

    this.idRoot = root;

    // Get axis length
    const axis_length = this.reader.getFloat(sceneNode, "axis_length");
    if (axis_length === null)
      this.onXMLMinorError(
        "no axis_length defined for scene; assuming 'length = 1'"
      );

    this.referenceLength = axis_length || 1;

    this.log("Parsed scene");

    return null;
  }

  /**
   * Parses the <views> block
   * @method parseView
   * @param {view block element} viewsNode
   */
  parseView(viewsNode) {
    let children = viewsNode.children;

    this.views = [];
    this.viewsIDs = {};
    let numViews = 0;

    const defaultViewID = this.reader.getString(viewsNode, "default");
    this.defaultView = undefined;
    this.defaultViewIndex = undefined;

    // traverse all views children and add to this.views (new CGFcamera or new CGFcameraOrtho)
    for (let i = 0; i < children.length; i++) {
      let camera;
      if (
        children[i].nodeName !== "perspective" &&
        children[i].nodeName !== "ortho"
      ) {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      const viewID = this.reader.getString(children[i], "id");
      if (viewID === null || viewID === "") {
        this.onXMLMinorError("ID must be defined for view");
        continue;
      }

      // check for repeated IDs
      if (this.viewsIDs[viewID] !== undefined) {
        this.onXMLMinorError(
          "ID must be unique for each view (conflict: ID = " + viewID + ")"
        );
        continue;
      }

      // parse common properties
      const near = this.reader.getFloat(children[i], "near");
      if (!(near !== null && !isNaN(near))) {
        this.onXMLMinorError(
          "unable to parse near of the view for ID = " + viewID
        );
        continue;
      }

      const far = this.reader.getFloat(children[i], "far");
      if (!(far !== null && !isNaN(far))) {
        this.onXMLMinorError(
          "unable to parse far of the view for ID = " + viewID
        );
        continue;
      }

      const grandChildren = children[i].children;
      const nodeNames = [];
      for (let j = 0; j < grandChildren.length; j++) {
        nodeNames.push(grandChildren[j].nodeName);
      }

      // parse from and to position
      const fromIndex = nodeNames.indexOf("from");
      const toIndex = nodeNames.indexOf("to");

      if (fromIndex === -1 || toIndex === -1) {
        this.onXMLMinorError(
          "view 'from' and/or 'to' position undefined for ID = " + viewID
        );
        continue;
      }

      const from = this.parseCoordinates3D(
        grandChildren[fromIndex],
        "view from position for ID" + viewID
      );
      if (!Array.isArray(from)) {
        this.onXMLMinorError(from);
        continue;
      }

      const to = this.parseCoordinates3D(
        grandChildren[toIndex],
        "view from position for ID" + viewID
      );
      if (!Array.isArray(to)) {
        this.onXMLMinorError(to);
        continue;
      }

      if (children[i].nodeName === "perspective") {
        const angle = this.reader.getFloat(children[i], "angle");
        if (!(angle !== null && !isNaN(angle))) {
          this.onXMLMinorError(
            "unable to parse angle of the view for ID = " + viewID
          );
          continue;
        }

        camera = new CGFcamera(angle, near, far, from, to);
      } else {
        const left = this.reader.getFloat(children[i], "left");
        if (!(left !== null && !isNaN(left))) {
          this.onXMLMinorError(
            "unable to parse left of the view for ID = " + viewID
          );
          continue;
        }

        const right = this.reader.getFloat(children[i], "right");
        if (!(right !== null && !isNaN(right))) {
          this.onXMLMinorError(
            "unable to parse right of the view for ID = " + viewID
          );
          continue;
        }

        const top = this.reader.getFloat(children[i], "top");
        if (!(top !== null && !isNaN(top))) {
          this.onXMLMinorError(
            "unable to parse top of the view for ID = " + viewID
          );
          continue;
        }

        const bottom = this.reader.getFloat(children[i], "bottom");
        if (!(bottom !== null && !isNaN(bottom))) {
          this.onXMLMinorError(
            "unable to parse bottom of the view for ID = " + viewID
          );
          continue;
        }

        // parse up position
        const upIndex = nodeNames.indexOf("up");
        let up = Array(0, 1, 0);
        if (upIndex !== -1) {
          up = this.parseCoordinates3D(
            grandChildren[upIndex],
            "view up position for ID" + viewID
          );
          if (!Array.isArray(up)) {
            this.onXMLMinorError(up);
            continue;
          }
        }
        camera = new CGFcameraOrtho(
          left,
          right,
          bottom,
          top,
          near,
          far,
          from,
          to,
          up
        );
      }

      if (viewID === defaultViewID) {
        this.defaultView = camera;
        this.defaultViewIndex = numViews;
      }

      this.viewsIDs[viewID] = numViews++;
      this.views.push(camera);
    }

    if (this.defaultView === undefined) {
      this.onXMLMinorError("default view does not exist");
      this.defaultView = this.views[0];
      this.defaultViewIndex = 0;
    }
    if (numViews === 0) return "at least one view must be defined";

    this.log("Parsed views");
    return null;
  }

  /**
   * Parses the <ambient> node
   * @method parseAmbient
   * @param {ambient block element} ambientsNode
   */
  parseAmbient(ambientsNode) {
    const children = ambientsNode.children;

    this.ambient = [];
    this.background = [];

    const nodeNames = [];

    for (let i = 0; i < children.length; i++)
      nodeNames.push(children[i].nodeName);

    const ambientIndex = nodeNames.indexOf("ambient");
    const backgroundIndex = nodeNames.indexOf("background");

    let color = this.parseColor(children[ambientIndex], "ambient");
    if (!Array.isArray(color)) return color;
    else this.ambient = color;

    color = this.parseColor(children[backgroundIndex], "background");
    if (!Array.isArray(color)) return color;
    else this.background = color;

    this.log("Parsed ambient");

    return null;
  }

  /**
   * Parses the <light> node
   * @method parseLights
   * @param {lights block element} lightsNode
   */
  parseLights(lightsNode) {
    const children = lightsNode.children;

    this.lights = {};
    let numLights = 0;

    // Any number of lights.
    for (let i = 0; i < children.length; i++) {
      // Storing light information
      const global = [];
      const attributeNames = [];
      const attributeTypes = [];

      //Check type of light
      if (children[i].nodeName !== "omni" && children[i].nodeName !== "spot") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      } else {
        attributeNames.push(...["location", "ambient", "diffuse", "specular"]);
        attributeTypes.push(...["position", "color", "color", "color"]);
      }

      // Get id of the current light.
      const lightID = this.reader.getString(children[i], "id");
      if (lightID === null || lightID === "") {
        this.onXMLMinorError("no ID defined for light");
        continue;
      }

      // Checks for repeated IDs.
      if (this.lights[lightID] !== undefined) {
        this.onXMLMinorError(
          "ID must be unique for each light (conflict: ID = " + lightID + ")"
        );
        continue;
      }

      let aux = this.reader.getBoolean(children[i], "enabled");
      if (!(aux !== null && !isNaN(aux) && (aux === true || aux === false)))
        this.onXMLMinorError(
          "unable to parse value component of the 'enable light' field for ID = " +
            lightID +
            "; assuming 'value = 1'"
        );

      // Light enable/disable
      const enableLight = aux;

      //Add enabled boolean and type name to light info
      global.push(enableLight);
      global.push(children[i].nodeName);

      // Specifications for the current light.
      const grandChildren = children[i].children;
      const nodeNames = [];
      for (let j = 0; j < grandChildren.length; j++) {
        nodeNames.push(grandChildren[j].nodeName);
      }

      let invalidGrandChild = false;
      for (let j = 0; j < attributeNames.length; j++) {
        const attributeIndex = nodeNames.indexOf(attributeNames[j]);

        if (attributeIndex !== -1) {
          if (attributeTypes[j] === "position")
            aux = this.parseCoordinates4D(
              grandChildren[attributeIndex],
              "light position for ID" + lightID
            );
          else
            aux = this.parseColor(
              grandChildren[attributeIndex],
              attributeNames[j] + " illumination for ID" + lightID
            );

          if (!Array.isArray(aux)) {
            this.onXMLMinorError(aux);
            invalidGrandChild = true;
            break;
          }

          global.push(aux);
        } else {
          this.onXMLMinorError(
            "light " + attributeNames[i] + " undefined for ID = " + lightID
          );
          invalidGrandChild = true;
          break;
        }
      }
      if (invalidGrandChild) continue;

      // Gets the additional attributes of the spot light
      if (children[i].nodeName === "spot") {
        const angle = this.reader.getFloat(children[i], "angle");
        if (!(angle !== null && !isNaN(angle))) {
          this.onXMLMinorError(
            "unable to parse angle of the light for ID = " + lightID
          );
          continue;
        }

        const exponent = this.reader.getFloat(children[i], "exponent");
        if (!(exponent !== null && !isNaN(exponent))) {
          this.onXMLMinorError(
            "unable to parse exponent of the light for ID = " + lightID
          );
          continue;
        }

        // Retrieves the light target.
        const targetIndex = nodeNames.indexOf("target");
        let targetLight = [];
        if (targetIndex !== -1) {
          aux = this.parseCoordinates3D(
            grandChildren[targetIndex],
            "target light for ID " + lightID
          );
          if (!Array.isArray(aux)) {
            this.onXMLMinorError(aux);
            continue;
          }

          targetLight = aux;
        } else {
          this.onXMLMinorError("light target undefined for ID = " + lightID);
          continue;
        }

        global.push(...[angle, exponent, targetLight]);
      }

      // Gets the attributes for the attenuation
      const attenuationIndex = nodeNames.indexOf("attenuation");
      if (attenuationIndex === -1) {
        this.onXMLMinorError(
          "There is no attenuation tag for the light: " + lightID
        );
        continue;
      }
      const constant = this.reader.getFloat(
        grandChildren[attenuationIndex],
        "constant"
      );
      if (!(constant !== null && !isNaN(constant))) {
        this.onXMLMinorError(
          "unable to parse constant value of the attenuation tag of the light: " +
            lightID
        );
        continue;
      }
      const linear = this.reader.getFloat(
        grandChildren[attenuationIndex],
        "linear"
      );
      if (!(linear !== null && !isNaN(linear))) {
        this.onXMLMinorError(
          "unable to parse linear value of the attenuation tag of the light: " +
            lightID
        );
        continue;
      }
      const quadratic = this.reader.getFloat(
        grandChildren[attenuationIndex],
        "quadratic"
      );
      if (!(quadratic !== null && !isNaN(quadratic))) {
        this.onXMLMinorError(
          "unable to parse quadratic value of the attenuation tag of the light: " +
            lightID
        );
        continue;
      }

      // At most one of the three components can be 1.0
      // At least one of the three components must be 1.0
      const attenuationValues = [constant, linear, quadratic];
      if (
        attenuationValues.find((element) => element === 1.0) === undefined ||
        attenuationValues.reduce((partialSum, v) => partialSum + v, 0) !== 1.0
      ) {
        this.onXMLMinorError(
          "Invalid values for the attenuation tag of the light: " + lightID
        );
        continue;
      }

      global.push(...[attenuationValues, lightID]);

      this.lights[lightID] = global;
      numLights++;
    }

    if (numLights === 0) return "at least one light must be defined";
    else if (numLights > 8)
      return "too many lights defined; WebGL imposes a limit of 8 lights";

    this.log("Parsed lights");
    return null;
  }

  /**
   * Parses the <textures> block
   * @method parseTextures
   * @param {textures block element} texturesNode
   */
  parseTextures(texturesNode) {
    const children = texturesNode.children;

    this.textures = { none: null };
    this.texturePaths = { none: null };

    //For each texture in textures block, check ID and file URL
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeName !== "texture") {
        this.onXMLMinorError("unknow tag <" + children[i].nodeName + ">");
        continue;
      }

      const textureID = this.reader.getString(children[i], "id");
      if (textureID === null || textureID === "") {
        this.onXMLMinorError("no ID defined for texture");
        continue;
      }

      // Checks for repeated IDs
      if (this.texturePaths[textureID] !== undefined) {
        this.onXMLMinorError(
          "ID must be unique for each texture (conflict: ID = " +
            textureID +
            ")"
        );
        continue;
      }

      const filePath = this.reader.getString(children[i], "file");
      if (filePath === null || filePath === "") {
        this.onXMLMinorError(
          "no filePath defined for texture with ID = " + textureID
        );
        continue;
      }
      this.texturePaths[textureID] = filePath;
    }

    return null;
  }

  /**
   * Parses the <materials> node
   * @method parseMaterials
   * @param {materials block element} materialsNode
   */
  parseMaterials(materialsNode) {
    const children = materialsNode.children;

    // defaultMaterial allows the rootNode to have an inherit material
    const defaultMaterial = new CGFappearance(this.scene);
    defaultMaterial.setAmbient(0.2, 0.4, 0.8, 1.0);
    defaultMaterial.setDiffuse(0.2, 0.4, 0.8, 1.0);
    defaultMaterial.setSpecular(0.2, 0.4, 0.8, 1.0);
    defaultMaterial.setEmission(0, 0, 0, 1);
    defaultMaterial.setShininess(10);

    this.materials = { defaultMaterial: defaultMaterial };

    // Any number of materials.
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeName !== "material") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current material.
      let materialID = this.reader.getString(children[i], "id");
      if (materialID === null || materialID === "") {
        this.onXMLMinorError("no ID defined for material");
        continue;
      }

      // Checks for repeated IDs.
      if (this.materials[materialID] !== undefined) {
        this.onXMLMinorError(
          "ID must be unique for each material (conflict: ID = " +
            materialID +
            ")"
        );
        continue;
      }

      let material = new CGFappearance(this.scene);

      // Get shininess of the current material.
      let materialShininess = this.reader.getString(children[i], "shininess");
      if (materialShininess === null) {
        this.onXMLMinorError("no shininess defined for material " + materialID);
        continue;
      }
      material.setShininess(materialShininess);

      const grandChildren = children[i].children;
      let invalidGrandChild = false;
      for (let j = 0; j < grandChildren.length; j++) {
        const color = this.parseColor(
          grandChildren[j],
          `${grandChildren[j].nodeName} of the material ` + materialID
        );
        if (!Array.isArray(color)) {
          this.onXMLMinorError(color);
          invalidGrandChild = true;
          break;
        }
        switch (grandChildren[j].nodeName) {
          case "emission":
            material.setEmission(color[0], color[1], color[2], color[3]);
            break;
          case "ambient":
            material.setAmbient(color[0], color[1], color[2], color[3]);
            break;
          case "diffuse":
            material.setDiffuse(color[0], color[1], color[2], color[3]);
            break;
          case "specular":
            material.setSpecular(color[0], color[1], color[2], color[3]);
            break;
          default:
            this.onXMLMinorError(
              "Invalid material child tag for material = " + materialID
            );
        }
      }
      if (invalidGrandChild) continue;
      this.materials[materialID] = material;
    }

    this.log("Parsed materials");
    return null;
  }

  /**
   * Parses <translation> tag
   * @method parseTranslationTag
   * @param {translation tag} translation
   * @param {string} errorMessage - error message to display if applicable
   * @returns {array} - array with the translation values
   */
  parseTranslationTag(translation, errorMessage) {
    return this.parseCoordinates3D(translation, errorMessage);
  }

  /**
   * Parses the <translate> tag and updates the transformation matrix
   * @method parseTranslation
   * @param {translate tag} translation
   * @param {mat4} transfMatrix - transformation matrix to apply the translation to
   * @param {string} errorMessage - error message to display if applicable
   * @returns {mat4} - a transformation matrix with the translation applied,
   *                   an error message otherwise
   */
  parseTranslation(translation, transfMatrix, errorMessage) {
    const attributes = this.parseTranslationTag(translation, errorMessage);
    if (typeof attributes === "string") return attributes;

    return mat4.translate(transfMatrix, transfMatrix, attributes);
  }

  /**
   * Parses the <scale> tag
   * @method parseScaleTag
   * @param {scale tag} scale
   * @param {array} coordinates - coordinates identifiers
   * @param {string} errorMessage - error message to display if applicable
   * @returns {array} - array with the scale values
   */
  parseScaleTag(scale, errorMessage, coordinates = ["x", "y", "z"]) {
    return this.parseCoordinates3D(scale, errorMessage, coordinates);
  }

  /**
   * Parses the <scale> tag and updates the transformation matrix
   * @method parseScale
   * @param {scale tag} scale
   * @param {mat4} transfMatrix - transformation matrix to apply the scale to
   * @param {string} errorMessage - error message to display if applicable
   * @returns {mat4} a matrix with the scale applied,
   *                 an error message otherwise
   */
  parseScale(scale, transfMatrix, errorMessage) {
    const attributes = this.parseScaleTag(scale, errorMessage);
    if (typeof attributes === "string") return attributes;

    return mat4.scale(transfMatrix, transfMatrix, attributes);
  }

  /**
   * Parses the <rotate> tag
   * @method parseRotationTag
   * @param {rotation tag} rotate
   * @param {array} errorMessages - error messages to display if needed
   * @returns {object} the attributes of the <rotation> tag,
   *                   an error message if any error occurred
   */
  parseRotationTag(rotation, errorMessages) {
    const axis = this.reader.getString(rotation, "axis");
    if (!(axis !== null && ["x", "y", "z"].includes(axis)))
      return errorMessages[0];

    const angle = this.reader.getFloat(rotation, "angle");
    if (!(angle !== null && !isNaN(angle))) return errorMessages[1];

    return { axis, angle };
  }

  /**
   * Parses the <rotation> tag and updates the transformation matrix
   * @method parseRotation
   * @param {rotation tag} rotation
   * @param {mat4} transfMatrix - matrix to apply the rotation to
   * @param {array} errorMessages - error messages to display if needed
   * @returns {mat4} a matrix with the rotation applied,
   *                 an error message otherwise
   */
  parseRotation(rotation, transfMatrix, errorMessages) {
    const attributes = this.parseRotationTag(rotation, errorMessages);
    if (typeof attributes === "string") return attributes;

    return mat4.rotate(transfMatrix, transfMatrix, attributes["angle"], [
      attributes["axis"] === "x" ? 1 : 0,
      attributes["axis"] === "y" ? 1 : 0,
      attributes["axis"] === "z" ? 1 : 0,
    ]);
  }

  /**
   * Parses the <transformations> block
   * @method parseTransformations
   * @param {transformations block element} transformationsNode
   */
  parseTransformations(transformationsNode) {
    const children = transformationsNode.children;

    this.transformations = {};

    // Any number of transformations.
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeName !== "transformation") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current transformation.
      const transformationID = this.reader.getString(children[i], "id");
      if (transformationID === null || transformationID === "") {
        this.onXMLMinorError("no ID defined for transformation");
        continue;
      }

      // Checks for repeated IDs.
      if (this.transformations[transformationID] !== undefined) {
        this.onXMLMinorError(
          "ID must be unique for each transformation (conflict: ID = " +
            transformationID +
            ")"
        );
        continue;
      }

      // Specifications for the current transformation.
      const grandChildren = children[i].children;
      let transfMatrix = mat4.create();

      for (let j = 0; j < grandChildren.length; j++) {
        switch (grandChildren[j].nodeName) {
          case "translate":
            const t = this.parseTranslation(
              grandChildren[j],
              transfMatrix,
              "translate transformation for ID " + ID
            );
            if (typeof t === "string") {
              this.onXMLMinorError(t);
              continue;
            }
            transfMatrix = t;
            break;
          case "scale":
            const s = this.parseScale(
              grandChildren[j],
              transfMatrix,
              "scale transformation for ID " + transformationID
            );
            if (typeof s === "string") {
              this.onXMLMinorError(s);
              continue;
            }
            transfMatrix = s;
            break;
          case "rotate":
            const r = this.parseRotation(grandChildren[j], transfMatrix, [
              "Unable to parse axis value of the rotation for transformation = " +
                transformationID,
              "Unable to parse angle value of the rotation for transformation = " +
                transformationID,
            ]);
            if (typeof r === "string") {
              this.onXMLMinorError(r);
              continue;
            }
            transfMatrix = r;
            break;
          default:
            this.onXMLMinorError(
              "Invalid transformation child tag for transformation = " +
                transformationID
            );
        }
      }
      this.transformations[transformationID] = transfMatrix;
    }

    this.log("Parsed transformations");
    return null;
  }

  /**
   * Parses the <rectangle> tag
   * @method parseRectangleTag
   * @param {string} rectangleID - rectangle's ID
   * @param {primitive tag} rectangle
   * @returns new MyRectangle on success, error message otherwise
   */
  parseRectangle(rectangleID, rectangle) {
    // x1
    const x1 = this.reader.getFloat(rectangle, "x1");
    if (!(x1 !== null && !isNaN(x1))) {
      return (
        "unable to parse x1 of the primitive coordinates for ID = " +
        rectangleID
      );
    }

    // y1
    const y1 = this.reader.getFloat(rectangle, "y1");
    if (!(y1 !== null && !isNaN(y1))) {
      return (
        "unable to parse y1 of the primitive coordinates for ID = " +
        rectangleID
      );
    }

    // x2
    const x2 = this.reader.getFloat(rectangle, "x2");
    if (!(x2 !== null && !isNaN(x2) && x2 > x1)) {
      return (
        "unable to parse x2 of the primitive coordinates for ID = " +
        rectangleID
      );
    }

    // y2
    const y2 = this.reader.getFloat(rectangle, "y2");
    if (!(y2 !== null && !isNaN(y2) && y2 > y1)) {
      return (
        "unable to parse y2 of the primitive coordinates for ID = " +
        rectangleID
      );
    }
    return new MyRectangle(this.scene, rectangleID, x1, x2, y1, y2);
  }

  /**
   * Parses the <triangle> tag
   * @method parseTriangle
   * @param {string} triangleID - trinagle's ID
   * @param {primitive tag} triangle
   * @returns new MyTriangle on success, error message otherwise
   */
  parseTriangle(triangleID, triangle) {
    // v1
    const v1 = this.reader.getString(triangle, "v1");
    if (!(v1 !== null && v1 !== ""))
      return "unable to parse v1 of the primitive for ID = " + triangleID;
    const vertex1 = v1.split(",").map((v) => parseInt(v));
    if (vertex1.filter((v) => !isNaN(v)).length !== 3)
      return (
        "missing coordinates for vertex v1 of the primitive for ID = " +
        triangleID
      );

    // v2
    const v2 = this.reader.getString(triangle, "v2");
    if (!(v2 !== null && v2 !== ""))
      return "unable to parse v2 of the primitive for ID = " + triangleID;
    const vertex2 = v2.split(",").map((v) => parseInt(v));
    if (vertex2.filter((v) => !isNaN(v)).length !== 3)
      return (
        "missing coordinates for vertex v2 of the primitive for ID = " +
        triangleID
      );

    // v3
    const v3 = this.reader.getString(triangle, "v3");
    if (!(v3 !== null && v3 !== ""))
      return "unable to parse v3 of the primitive for ID = " + triangleID;
    const vertex3 = v3.split(",").map((v) => parseInt(v));
    if (vertex3.filter((v) => !isNaN(v)).length !== 3)
      return (
        "missing coordinates for vertex v3 of the primitive for ID = " +
        triangleID
      );

    return new MyTriangle(this.scene, vertex1, vertex2, vertex3);
  }

  /**
   * Parses the <cylinder> tag
   * @method parseCylinder
   * @param {string} cylinderID - cylinder's ID
   * @param {primitive tag} cylinder
   * @returns new MyCylinder on success, error message otherwise
   */
  parseCylinder(cylinderID, cylinder) {
    // slices
    const slices = this.reader.getInteger(cylinder, "slices");
    if (!(slices !== null && !isNaN(slices)) && slices > 0) {
      return "unable to parse slices of the primitive for ID = " + cylinderID;
    }

    // topRadius
    const topRadius = this.reader.getFloat(cylinder, "top");
    if (!(topRadius !== null && !isNaN(topRadius)) && topRadius > 0) {
      return (
        "unable to parse topRadius of the primitive for ID = " + cylinderID
      );
    }

    // bottomRadius
    const bottomRadius = this.reader.getFloat(cylinder, "base");
    if (!(bottomRadius !== null && !isNaN(bottomRadius)) && bottomRadius > 0) {
      return (
        "unable to parse bottomRadius of the primitive for ID = " + cylinderID
      );
    }

    // heigth
    const height = this.reader.getFloat(cylinder, "height");
    if (!(height !== null && !isNaN(height)) && height > 0)
      return "unable to parse height of the primitive for ID = " + cylinderID;

    // stacks
    const stacks = this.reader.getInteger(cylinder, "stacks");
    if (!(stacks !== null && !isNaN(stacks) && stacks > 0))
      return "unable to parse stacks of the primitive for ID = " + cylinderID;

    return new MyCylinder(
      this.scene,
      slices,
      topRadius,
      bottomRadius,
      height,
      stacks
    );
  }

  /**
   * Parses the <sphere> tag
   * @method parseSphere
   * @param {string} sphereID - sphere's ID
   * @param {primitive tag} sphere
   * @returns new MySphere on success, error message otherwise
   */
  parseSphere(sphereID, sphere) {
    // slices
    const slices = this.reader.getInteger(sphere, "slices");
    if (!(slices !== null && !isNaN(slices)) && slices > 0)
      return "unable to parse slices of the primitive for ID = " + sphereID;

    // radius
    const radius = this.reader.getFloat(sphere, "radius");
    if (!(radius !== null && !isNaN(radius)) && radius > 0)
      return "unable to parse radius of the primitive for ID = " + sphereID;

    // stacks
    const stacks = this.reader.getInteger(sphere, "stacks");
    if (!(stacks !== null && !isNaN(stacks) && stacks > 0))
      return "unable to parse stacks of the primitive for ID = " + sphereID;

    return new MySphere(this.scene, slices, radius, stacks);
  }

  /**
   * Parses the <torus> tag
   * @method parseTorus
   * @param {string} torusID - torus's ID
   * @param {primitive tag} torus
   * @returns new MyTorus on success, error message otherwise
   */
  parseTorus(torusID, torus) {
    const inner = this.reader.getFloat(torus, "inner");
    if (!(inner !== null && !isNaN(inner)) && inner > 0)
      return (
        "unable to parse inner radius of the primitive for ID = " + torusID
      );

    const outer = this.reader.getFloat(torus, "outer");
    if (!(outer !== null && !isNaN(outer)) && outer > 0)
      return (
        "unable to parse outer radius of the primitive for ID = " + torusID
      );

    const slices = this.reader.getInteger(torus, "slices");
    if (!(slices !== null && !isNaN(slices)) && slices > 0)
      return "unable to parse slices of the primitive for ID = " + torusID;

    const loops = this.reader.getInteger(torus, "loops");
    if (!(loops !== null && !isNaN(loops) && loops > 0))
      return "unable to parse loops of the primitive for ID = " + torusID;

    return new MyTorus(this.scene, inner, outer, slices, loops);
  }

  /**
   * Parses the <patch> tag
   * @method parsePatch
   * @param {string} patchID - patch's ID
   * @param {primitive tag} patch
   * @returns new MyPatch on success, error message otherwise
   */
  parsePatch(patchID, patch) {
    const degree_u = this.reader.getInteger(patch, "degree_u");
    if (
      !(degree_u !== null && !isNaN(degree_u)) &&
      degree_u >= 1 &&
      degree_v <= 3
    )
      return "unable to parse degree_u of the primitive for ID = " + patchID;

    const parts_u = this.reader.getInteger(patch, "parts_u");
    if (!(parts_u !== null && !isNaN(parts_u)) && parts_u > 0)
      return "unable to parse parts_u of the primitive for ID = " + patchID;

    const degree_v = this.reader.getInteger(patch, "degree_v");
    if (
      !(degree_v !== null && !isNaN(degree_v)) &&
      degree_v >= 1 &&
      degree_v <= 3
    )
      return "unable to parse degree_v of the primitive for ID = " + patchID;

    const parts_v = this.reader.getInteger(patch, "parts_v");
    if (!(parts_v !== null && !isNaN(parts_v)) && parts_v > 0)
      return "unable to parse parts_v of the primitive for ID = " + patchID;

    const controlpoints_n = (degree_u + 1) * (degree_v + 1);
    if (patch.children.length !== controlpoints_n)
      return `invalid number of <controlpoints> for primitive = ${patchID}. \
              Got: ${patch.children.length}, expected: ${patch.children.length}`;

    const controlpoints = [];
    for (let i = 0; i < controlpoints_n; i += degree_v + 1) {
      const controlpoints_temp = [];
      for (let j = 0; j <= degree_v; j++) {
        const controlpoint = this.parseCoordinates3D(
          patch.children[i + j],
          `<controlpoint> for primtive ${patchID}`
        );
        if (!Array.isArray(controlpoint)) {
          return controlpoint;
        }
        controlpoints_temp.push([...controlpoint, 1]);
      }
      controlpoints.push(controlpoints_temp);
    }

    return new MyPatch(
      this.scene,
      degree_u,
      parts_u,
      degree_v,
      parts_v,
      controlpoints
    );
  }

  /**
   * Parses the <primitives> block
   * @method parsePrimitives
   * @param {primitives block element} primitivesNode
   */
  parsePrimitives(primitivesNode) {
    const children = primitivesNode.children;

    this.primitives = {};
    // possible primitives names
    const grandChildrenNames = [
      "rectangle",
      "triangle",
      "cylinder",
      "sphere",
      "torus",
      "patch",
    ];

    // Any number of primitives.
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeName !== "primitive") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current primitive.
      const primitiveID = this.reader.getString(children[i], "id");
      if (primitiveID === null || primitiveID === "") {
        this.onXMLMinorError("no ID defined for primitive");
        continue;
      }

      // Checks for repeated IDs.
      if (this.primitives[primitiveID] !== undefined) {
        this.onXMLMinorError(
          "ID must be unique for each primitive (conflict: ID = " +
            primitiveID +
            ")"
        );
        continue;
      }

      const grandChildren = children[i].children;

      // Validate the primitive type
      if (
        grandChildren.length !== 1 ||
        !grandChildrenNames.includes(grandChildren[0].nodeName)
      ) {
        this.onXMLMinorError(
          "There must be exactly 1 primitive type (rectangle, triangle, cylinder, sphere or torus)"
        );
        continue;
      }

      // Specifications for the current primitive.
      const primitiveType = grandChildren[0].nodeName;
      let primitive;
      // Retrieves the primitive coordinates.
      if (primitiveType === "rectangle") {
        primitive = this.parseRectangle(primitiveID, grandChildren[0]);
        if (typeof primitive === "string") {
          this.onXMLMinorError(primitive);
          continue;
        }
      } else if (primitiveType === "cylinder") {
        primitive = this.parseCylinder(primitiveID, grandChildren[0]);
        if (typeof primitive === "string") {
          this.onXMLMinorError(primitive);
          continue;
        }
      } else if (primitiveType === "triangle") {
        primitive = this.parseTriangle(primitiveID, grandChildren[0]);
        if (typeof primitive === "string") {
          this.onXMLMinorError(primitive);
          continue;
        }
      } else if (primitiveType === "sphere") {
        primitive = this.parseSphere(primitiveID, grandChildren[0]);
        if (typeof primitive === "string") {
          this.onXMLMinorError(primitive);
          continue;
        }
      } else if (primitiveType === "torus") {
        primitive = this.parseTorus(primitiveID, grandChildren[0]);
        if (typeof primitive === "string") {
          this.onXMLMinorError(primitive);
          continue;
        }
      } else if (primitiveType === "patch") {
        primitive = this.parsePatch(primitiveID, grandChildren[0]);
        if (typeof primitive === "string") {
          this.onXMLMinorError(primitive);
          continue;
        }
      }

      this.primitives[primitiveID] = primitive;
    }

    this.log("Parsed primitives");
    return null;
  }

  /**
   * Parses the keyframes for the given animation
   * @method parseKeyframes
   * @param {string} animationID - animation's ID whose keyframes are to be parsed
   * @param {keyframes block element} keyframesNode
   * @return parsed keyframes
   */
  parseKeyframes(animationID, animationComponent) {
    const children = animationComponent.children;

    const grandChildrenOrder = {
      0: { op: "translation" },
      1: { op: "rotation", axis: "z" },
      2: { op: "rotation", axis: "y" },
      3: { op: "rotation", axis: "x" },
      4: { op: "scale" },
    };

    let keyframes = [];
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeName !== "keyframe") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      const keyframe_instant = this.reader.getFloat(children[i], "instant");
      if (
        !(
          keyframe_instant !== null &&
          !isNaN(keyframe_instant) &&
          keyframe_instant >= 0
        )
      ) {
        this.onXMLMinorError(
          `Unable to parse instant value of the keyframe for animation = ${animationID}`
        );
        continue;
      }

      const grandChildren = children[i].children;
      if (grandChildren.length !== Object.keys(grandChildrenOrder).length) {
        this.onXMLMinorError(
          `The <keyframe> tag must have the following children ${Object.values(
            grandChildrenOrder
          ).map((obj) => obj.op)}. Error for animation = ${animationID}`
        );
        continue;
      }

      const keyframe = {
        instant: keyframe_instant,
        translation: [],
        rotation: [],
        scale: [],
      };
      let parsingErrors = false;
      for (let j = 0; j < grandChildren.length; j++) {
        const transformationType = grandChildren[j].nodeName;

        if (transformationType !== grandChildrenOrder[j].op) {
          this.onXmlMinorError("");
          parsingErrors = true;
          break;
        }

        let parsedResult;
        switch (transformationType) {
          case "translation":
            parsedResult = this.parseTranslationTag(
              grandChildren[j],
              `translation component of the keyframe with instant = ${keyframe_instant} for animation = ${animationID}`
            );
            break;
          case "rotation":
            parsedResult = this.parseRotationTag(
              grandChildren[j],
              `rotation component of the keyframe with instant = ${keyframe_instant} for animation = ${animationID}`
            );
            break;
          case "scale":
            parsedResult = this.parseScaleTag(
              grandChildren[j],
              `scale component of the keyframe with instant = ${keyframe_instant} for animation = ${animationID}`,
              ["xs", "ys", "zs"]
            );
            break;
        }

        // check for errors upon transformation parsing
        if (typeof parsedTranformation === "string") {
          this.onXMLMinorError(parsedTranformation);
          parsingErrors = true;
          break;
        }

        // if transformation is a rotation, need to be handled differently
        if (transformationType === "rotation") {
          if (parsedResult.axis !== grandChildrenOrder[j].axis) {
            this.onXMLMinorError(
              "The rotation attributes of the <keyframe> tag must follow the order: [x, y, z]"
            );
            parsingErrors = true;
            break;
          }
          parsedResult.angle = (parsedResult.angle * Math.PI) / 180;
          keyframe["rotation"] = [...keyframe["rotation"], parsedResult];
        } else {
          keyframe[transformationType] = parsedResult;
        }
      }

      if (parsingErrors) continue;

      keyframes = [...keyframes, keyframe];
    }

    return keyframes;
  }

  /**
   * Parses the <animations> node
   * @method parseAnimations
   * @param {animations block} animationsNode
   */
  parseAnimations(animationsNode) {
    const children = animationsNode.children;

    this.usedAnimations = [];
    this.animations = {};

    // Any number of animations.
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeName !== "keyframeanim") {
        this.onXMLMinorError(`unknown tag <${children[i].nodeName}>`);
        continue;
      }

      // Get id of the current animation.
      let animationID = this.reader.getString(children[i], "id");
      if (animationID === null || animationID === "") {
        this.onXMLMinorError("no ID defined for keyframeanim");
        continue;
      }

      // Get the loop variable of the current animation.
      let animationLoop = this.reader.getBoolean(children[i], "loop");
      if (animationLoop === null) animationLoop = false;

      // Get the loop_time variable of the current animation if loop is set to true.
      let animationTime = null;
      if (animationLoop) {
        animationTime = this.reader.getFloat(children[i], "loop_time");
        if (!(animationTime !== null && !isNaN(animationTime))) {
          this.onXMLMinorError(
            `no loop_time defined for keyframeanim ${animationID}`
          );
          animationTime = null;
        }
      }

      // Checks for repeated IDs.
      if (this.animations[animationID] !== undefined) {
        this.onXMLMinorError(
          `ID must be unique for each keyframeanim (conflict: ID = ${animationID})`
        );
        continue;
      }

      const keyframes = this.parseKeyframes(animationID, children[i]);
      if (keyframes.length < 1) {
        this.onXMLMinorError(
          `Invalid number of <keyframe> tags in animation = ${animationID}. There must be at least one valid <keyframe> tag.`
        );
        continue;
      }
      this.animations[animationID] = new MyKeyframeAnimation(
        keyframes,
        animationTime
      );
    }

    this.log("Parsed animations");
    return null;
  }

  /**
   * Parses the <texture> tag
   * @method parseTexture
   * @param {textures component} textureComponent
   * @returns null if ID is invalid, an object with textureID and its lengths otherwise
   */
  parseTexture(componentID, textureComponent) {
    const textureID = this.reader.getString(textureComponent, "id");
    if (textureID === null || textureID === "") {
      this.onXMLMinorError(
        "Invalid value for the texture ID for component = " + componentID
      );
      return null;
    }

    let length_t = null;
    let length_s = null;
    if (textureID !== "none") {
      length_t = this.reader.getFloat(textureComponent, "length_t");
      if (!(length_t !== null && !isNaN(length_t))) {
        if (textureID !== "inherit") {
          this.onXMLMinorError(
            "Unable to parse length_t value of the texture for component = " +
              componentID
          );
          length_t = 1;
        }
      }

      length_s = this.reader.getFloat(textureComponent, "length_s");
      if (!(length_s !== null && !isNaN(length_s))) {
        if (textureID !== "inherit") {
          this.onXMLMinorError(
            "Unable to parse length_s value of the texture for component = " +
              componentID
          );
          length_s = 1;
        }
      }
    }

    return {
      texture: textureID,
      lengths: [length_t, length_s],
    };
  }

  /**
   * Parses the <components> block
   * @method parseComponents
   * @param {components block element} componentsNode
   */
  parseComponents(componentsNode) {
    let children = componentsNode.children;

    this.components = {};

    let grandChildren = [];
    let nodeNames = [];

    // Any number of components.
    for (let i = 0; i < children.length; i++) {
      if (children[i].nodeName !== "component") {
        this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
        continue;
      }

      // Get id of the current component
      const componentID = this.reader.getString(children[i], "id");
      if (componentID === null || componentID === "") {
        this.onXMLMinorError("no ID defined for componentID");
        continue;
      }

      let newNode = new MyNode(componentID, mat4.create());

      // Checks for repeated IDs
      if (this.components[componentID] !== undefined) {
        this.onXMLMinorError(
          "ID must be unique for each component (conflict: ID = " +
            componentID +
            ")"
        );
        continue;
      }

      grandChildren = children[i].children;
      nodeNames = [];
      for (let j = 0; j < grandChildren.length; j++) {
        nodeNames.push(grandChildren[j].nodeName);
      }

      const transformationIndex = nodeNames.indexOf("transformation");
      const materialsIndex = nodeNames.indexOf("materials");
      const textureIndex = nodeNames.indexOf("texture");
      const texturesIndex = nodeNames.indexOf("textures");
      const childrenIndex = nodeNames.indexOf("children");
      const animationIndex = nodeNames.indexOf("animation");
      const highlightedIndex = nodeNames.indexOf("highlighted");

      const transformationComponent = grandChildren[transformationIndex];
      if (transformationComponent.children.length > 0) {
        let transformationNames = [];
        for (let j = 0; j < transformationComponent.children.length; j++) {
          transformationNames.push(
            transformationComponent.children[j].nodeName
          );
        }
        if (transformationNames.indexOf("transformationref") === 0) {
          if (transformationNames.length !== 1) {
            this.onXMLMinorError(
              "It can only exist one transformation ref tag per component (Error in " +
                componentID +
                ")"
            );
          }
          const transformationID = this.reader.getString(
            transformationComponent.children[0],
            "id"
          );
          if (transformationID === null || transformationID === "") {
            this.onXMLMinorError(
              "Invalid value for the transformationref for component + " +
                componentID
            );
          } else {
            newNode.setTransformationRef(transformationID);
          }
        } else {
          let transformationMatrix = mat4.create();
          for (const transformation of transformationComponent.children) {
            switch (transformation.nodeName) {
              case "translate":
                const t = this.parseTranslation(
                  transformation,
                  transformationMatrix,
                  "Unable to parse the tag <translation /> for component = " +
                    componentID
                );
                if (typeof t === "string") {
                  this.onXMLMinorError(t);
                  continue;
                }
                transformationMatrix = t;
                break;
              case "scale":
                const s = this.parseScale(
                  transformation,
                  transformationMatrix,
                  "Unable to parse the tag <scale /> for component = " +
                    componentID
                );
                if (typeof s === "string") {
                  this.onXMLMinorError(s);
                  continue;
                }
                transformationMatrix = s;
                break;
              case "rotate":
                const r = this.parseRotation(
                  transformation,
                  transformationMatrix,
                  "Unable to parse the tag <rotate /> for component = " +
                    componentID
                );
                if (typeof r === "string") {
                  this.onXMLMinorError(r);
                  continue;
                }
                transformationMatrix = r;
                break;
              default:
                this.onXMLMinorError(
                  "Invalid transformation tag for component = " + componentID
                );
            }
          }
          newNode.setTransformationMatrix(transformationMatrix);
        }
      }

      const materialComponent = grandChildren[materialsIndex];
      for (const material of materialComponent.children) {
        const materialID = this.reader.getString(material, "id");
        if (materialID === null || materialID === "") {
          this.onXMLMinorError(
            "Invalid value for the material ID for component = " + componentID
          );
          continue;
        }
        newNode.addMaterial(materialID);
      }

      // Texture
      if (textureIndex !== -1 && texturesIndex !== -1)
        return (
          "It must only exist one type of texture tag: error on component = " +
          componentID
        );
      if (textureIndex === -1 && texturesIndex === -1)
        return (
          "It must exist one tag of type texture(s): error on component = " +
          componentID
        );

      let texturesComponent =
        textureIndex !== -1
          ? { children: [grandChildren[textureIndex]] }
          : grandChildren[texturesIndex];

      for (let textureComponent of texturesComponent.children) {
        const texture = this.parseTexture(componentID, textureComponent);
        if (texture !== null) newNode.addTexture(texture);
      }

      // Children
      const childrenComponent = grandChildren[childrenIndex];
      for (const child of childrenComponent.children) {
        const childID = this.reader.getString(child, "id");

        if (childID === null || childID === "") {
          this.onXMLMinorError(
            "Invalid value for the " +
              child.nodeName +
              " for component " +
              componentID
          );
          continue;
        }

        if (child.nodeName === "primitiveref") {
          newNode.addPrimitive(childID);
        } else if (child.nodeName === "componentref") {
          newNode.addComponent(childID);
        }
      }

      // Animation
      if (animationIndex !== -1) {
        const animationComponent = grandChildren[animationIndex];
        const animationID = this.reader.getString(animationComponent, "id");
        if (animationID === null || animationID === "") {
          this.onXMLMinorError(
            "Invalid value for the animation ID for component = " + componentID
          );
          continue;
        }
        newNode.setAnimation(animationID);
      }

      // Highlighted
      if (highlightedIndex !== -1) {
        const messageError = `highlighted tag for component ${componentID}`;

        const highlightedComponent = grandChildren[highlightedIndex];

        let color = this.parseRGB(highlightedComponent, messageError);
        if (!Array.isArray(color)) {
          this.onXMLMinorError(color);
          color = [1.0, 1.0, 1.0];
        }

        let scaleFactor = this.reader.getFloat(highlightedComponent, "scale_h");
        if (
          !(scaleFactor !== null && !isNaN(scaleFactor) && scaleFactor >= 0)
        ) {
          this.onXMLMinorError(
            `unable to parse scale_h attribute of the ${messageError}`
          );
          scaleFactor = 1.0;
        }

        newNode.setHighlightValues({
          color,
          scaleFactor,
        });
      }

      this.components[componentID] = newNode;
    }
    this.log("Parsed components");
    return null;
  }

  /**
   * Checks if the tree is valid
   * @method checkNodeTree
   * @param {MyNode} node - current node
   * @param {array} currentTree - nodes already visited in the current branch
   * @returns true if the tree is valid, false otherwise
   */
  checkNodeTree(node, currentTree) {
    const nodeID = node.getNodeID();
    if (currentTree.includes(nodeID)) {
      this.onXMLMinorError(
        "The component " +
          nodeID +
          " was already used in the current tree: " +
          currentTree
      );
      return false;
    }

    // check transformationsRef
    if (node.isTransfRef()) {
      const transformationID = node.getTransformation().transformation;
      if (this.transformations[transformationID] === undefined) {
        this.onXMLMinorError(
          "The component " + nodeID + " has an invalid transformationref value"
        );
        node.setTransformationMatrix(mat4.create());
      }
    }

    // check materials
    let materials = node.getMaterials();
    const materialLength = materials.length;
    materials = materials.filter(
      (material) =>
        material === "inherit" || this.materials[material] !== undefined
    );
    if (materials.length < 1) {
      this.onXMLError(
        "The component " + nodeID + " does not have any valid material."
      );
      return false;
    }
    if (materialLength > materials.length) {
      this.onXMLMinorError(
        "The component " + nodeID + " has some invalid materials"
      );
      node.setMaterials(materials);
    }

    // check textures
    let textures = node.getTextures();
    const texturesLength = textures.length;
    textures.filter((texture) => {
      const textureID = texture.texture;
      return (
        textureID === "inherit" || this.texturePaths[textureID] !== undefined
      );
    });
    if (textures.length < 1) {
      this.onXMLError(
        "The component " + nodeID + " does not have any valid texture."
      );
      return false;
    }
    if (texturesLength > textures.length) {
      this.onXMLMinorError(
        "The component " + nodeID + " has some invalid textures"
      );
      node.setTextures(textures);
    }
    textures.forEach((texture) => {
      // Create only textures objects for those that are going to be used
      const textureID = texture.texture;
      if (textureID === "inherit" || textureID === "none") return;
      if (this.textures[textureID] === undefined)
        this.textures[textureID] = new CGFtexture(
          this.scene,
          this.texturePaths[textureID]
        );
    });

    // Check children
    let primitiveChildren = node.getPrimitiveChildren();
    const primitiveLength = primitiveChildren.length;
    primitiveChildren = primitiveChildren.filter(
      (primitive) => this.primitives[primitive] !== undefined
    );

    let componentChildren = node.getComponentChildren();
    const componentLength = componentChildren.length;
    componentChildren = componentChildren.filter(
      (component) =>
        this.components[component] !== undefined &&
        !currentTree.includes(component) &&
        this.checkNodeTree(
          this.components[component],
          currentTree.concat([nodeID])
        )
    );

    if (primitiveChildren.length + componentChildren.length < 1) {
      this.onXMLError(
        "The component " + nodeID + " does not have any valid children."
      );
      return false;
    }

    if (primitiveLength > primitiveChildren.length) {
      this.onXMLMinorError(
        "The component " + nodeID + " has some invalid primitiverefs"
      );
      node.setPrimitiveChildren(primitiveChildren);
    }
    if (componentLength > componentChildren.length) {
      this.onXMLMinorError(
        "The component " + nodeID + " has some invalid componentrefs"
      );
      node.setComponentChildren(componentChildren);
    }

    // check animations
    let animation = node.getAnimation();
    if (animation !== null) {
      if (this.animations[animation] === undefined) {
        this.onXMLError(
          `The component ${nodeID} does not have a valid animation. It does not exist any animation with ID = ${animation} in the animations component.`
        );
        return false;
      }
      if (!this.usedAnimations.includes(animation))
        this.usedAnimations = [...this.usedAnimations, animation];
    }

    if (node.getHightlightValues().scaleFactor !== null) {
      this.displayHighlighted[nodeID] = false;
      this.scene.interface.addHighlightedComponent(nodeID);
    }

    return true;
  }

  /**
   * Processes the nodes tree to display them
   * @method processNode
   * @param {MyNode} node - current node
   * @param {string} inheritMaterial - material to be used in case of inheritance
   * @param {string} inheritTexture - texture to be used in case of inheritance
   * @param {boolean} changeMaterial - true if the materials are to be changed
   * @param {boolean} changeTexture - true if the textures are to be changed
   * @param {array} processedNodes - nodes that already had their materials/textures changed
   * @returns {array} array of parsed nodes updated after recursion
   */
  processNode(
    node,
    inheritMaterial,
    inheritTexture,
    changeMaterial,
    changeTexture,
    processedNodes,
  ) {
    const nodeID = node.getNodeID();

    this.scene.pushMatrix();
    let { idTexture, inherit_lengths } = inheritTexture;

    let { isTransformationRef, transformation } = node.getTransformation();
    if (isTransformationRef)
      transformation = this.transformations[transformation];
    this.scene.multMatrix(transformation);

    if (!processedNodes.includes(nodeID)) {
      if (changeMaterial) node.changeMaterial();
      if (changeTexture) node.changeTexture();
      processedNodes.push(nodeID);
    }

    let material = node.getMaterial();
    let { texture, lengths } = node.getTexture();

    const idMaterial = material !== "inherit" ? material : inheritMaterial;
    material = this.materials[idMaterial];

    idTexture = texture === "inherit" ? idTexture : texture;
    let [length_t, length_s] = lengths;
    if (length_t === null && texture === "inherit") {
      length_t = inherit_lengths[0];
    }
    if (length_s === null && texture === "inherit") {
      length_s = inherit_lengths[1];
    }
    texture = this.textures[idTexture];

    material.setTexture(texture);
    material.apply();
    material.setTextureWrap("REPEAT", "REPEAT");

    const animationID = node.getAnimation();
    let displayChildren = true;
    if (animationID !== null) {
      const animation = this.animations[animationID].apply();
      if (animation === null) displayChildren = false;
      else this.scene.multMatrix(animation);
    }

    let changeShader = false;
    const hightlightValues = node.getHightlightValues();

    if (
      hightlightValues.color !== null &&
      hightlightValues.scaleFactor !== null &&
      this.displayHighlighted[nodeID]
    ) {
      changeShader = true;
      this.shader.setUniformsValues(hightlightValues);
      this.scene.setActiveShader(this.shader);
    }

    const primitiveChildren = node.getPrimitiveChildren();
    if (displayChildren) {
      for (const primitive of primitiveChildren) {
        if (!this.primitives[primitive] instanceof MyPatch) {
          if (this.displayNormals) this.primitives[primitive].enableNormalViz();
          else this.primitives[primitive].disableNormalViz();
          this.primitives[primitive].updateTexCoords(length_t, length_s);
        }
        this.primitives[primitive].display();
      }

      if (changeShader) this.scene.setActiveShader(this.scene.defaultShader);

      const componentChildren = node.getComponentChildren();
      const currTexture = {
        idTexture: idTexture,
        inherit_lengths: [length_t, length_s],
      };
      for (const component of componentChildren) {
        processedNodes = this.processNode(
          this.components[component],
          idMaterial,
          currTexture,
          changeMaterial,
          changeTexture,
          processedNodes
        );
      }
    }

    this.scene.popMatrix();

    return processedNodes;
  }

  /**
   * Parse the coordinates from a node given its ID
   * @method parseCoordinates3D
   * @param {block element} node
   * @param {array} coordinates - coordinates identifiers
   * @param {string} messageError - message to be displayed in case of error
   * @returns {array} parsed 3D coordinates
   */
  parseCoordinates3D(node, messageError, coordinates = ["x", "y", "z"]) {
    // x
    const x = this.reader.getFloat(node, coordinates[0]);
    if (!(x !== null && !isNaN(x)))
      return `unable to parse ${coordinates[0]}-coordinate of the ${messageError}`;

    // y
    const y = this.reader.getFloat(node, coordinates[1]);
    if (!(y !== null && !isNaN(y)))
      return `unable to parse ${coordinates[1]}-coordinate of the ${messageError}`;

    // z
    const z = this.reader.getFloat(node, coordinates[2]);
    if (!(z !== null && !isNaN(z)))
      return `unable to parse ${coordinates[2]}-coordinate of the ${messageError}`;
    return [x, y, z];
  }

  /**
   * Parse the coordinates from a node given its ID
   * @method parseCoordinates4D
   * @param {block element} node
   * @param {string} messageError - message to be displayed in case of error
   * @returns {array} parsed 4D coordinates
   */
  parseCoordinates4D(node, messageError) {
    //Get x, y, z
    const position = this.parseCoordinates3D(node, messageError);

    if (!Array.isArray(position)) return position;

    // w
    const w = this.reader.getFloat(node, "w");
    if (!(w !== null && !isNaN(w)))
      return "unable to parse w-coordinate of the " + messageError;

    return [...position, w];
  }

  /**
   * Parse the color RGBA components from a node
   * @method parseColor
   * @param {block element} node
   * @param {string} messageError - message to be displayed in case of error
   * @returns {array} parsed color RGBA components
   */
  parseColor(node, messageError) {
    // R
    const r = this.reader.getFloat(node, "r");
    if (!(r !== null && !isNaN(r) && r >= 0 && r <= 1))
      return "unable to parse R component of the " + messageError;

    // G
    const g = this.reader.getFloat(node, "g");
    if (!(g !== null && !isNaN(g) && g >= 0 && g <= 1))
      return "unable to parse G component of the " + messageError;

    // B
    const b = this.reader.getFloat(node, "b");
    if (!(b !== null && !isNaN(b) && b >= 0 && b <= 1))
      return "unable to parse B component of the " + messageError;

    // A
    const a = this.reader.getFloat(node, "a");
    if (!(a !== null && !isNaN(a) && a >= 0 && a <= 1))
      return "unable to parse A component of the " + messageError;

    return [r, g, b, a];
  }

  /**
   * Parse the color RGB components from a node
   * @method parseRGB
   * @param {block element} node
   * @param {string} messageError - message to be displayed in case of error
   * @returns {array} parsed color RGB components
   */
  parseRGB(node, messageError) {
    // R
    const r = this.reader.getFloat(node, "r");
    if (!(r !== null && !isNaN(r) && r >= 0 && r <= 1))
      return "unable to parse R component of the " + messageError;

    // G
    const g = this.reader.getFloat(node, "g");
    if (!(g !== null && !isNaN(g) && g >= 0 && g <= 1))
      return "unable to parse G component of the " + messageError;

    // B
    const b = this.reader.getFloat(node, "b");
    if (!(b !== null && !isNaN(b) && b >= 0 && b <= 1))
      return "unable to parse B component of the " + messageError;

    return [r, g, b];
  }

  /**
   * Callback to be executed on any read error, showing an error on the console
   * @method onXMLError
   * @param {string} message
   */
  onXMLError(message) {
    console.error("XML Loading Error: " + message);
    this.loadedOk = false;
  }

  /**
   * Callback to be executed on any minor error, showing a warning on the console
   * @method onXMLMinorError
   * @param {string} message
   */
  onXMLMinorError(message) {
    console.warn("Warning: " + message);
  }

  /**
   * Callback to be executed on any message
   * @method log
   * @param {string} message
   */
  log(message) {
    console.log("   " + message);
  }

  /**
   * Displays the scene, processing each node, starting in the root node
   * @method displayScene
   */
  displayScene() {
    this.processNode(
      this.components[this.idRoot],
      "defaultMaterial",
      "none",
      this.scene.gui.isKeyPressed("KeyM"),
      this.scene.gui.isKeyPressed("KeyT"),
      [],
    );
  }

  /**
   * Called periodically, as per setUpdatePeriod() in init()
   * @method update
   * @param {float} t
   */
  update(t) {
    // Dividing the time by 1000 "slows down" the variation (i.e. in 1000 ms timeFactor increases 1 unit).
    const tValue = t / 1000;
    this.shader.setUniformsValues({ timeFactor: (tValue % 10) * 10 });
    if (this.usedAnimations !== undefined) {
      Object.values(this.usedAnimations).forEach((anim) =>
        this.animations[anim].update(tValue)
      );
    }
  }
}
