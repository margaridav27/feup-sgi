attribute vec3 aVertexPosition; // position vector for vertex
attribute vec3 aVertexNormal; // normal vector for vertex
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

varying vec2 vTextureCoord;
varying vec3 offset;

uniform float timeFactor;
uniform float scaleFactor;

void main() {
    // pulse effect
    offset = aVertexNormal * 0.1 * (sin(timeFactor) + 1.0) / 2.0;

    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition + offset * scaleFactor, 1.0);
    
    vTextureCoord = aTextureCoord;
}
