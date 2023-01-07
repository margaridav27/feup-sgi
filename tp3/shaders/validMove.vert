attribute vec3 aVertexPosition; // position vector for vertex
attribute vec3 aVertexNormal; // normal vector for vertex
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

varying vec2 vTextureCoord;
varying vec3 offset;

uniform float timeFactor;
 
void main() {
	float timeOffset = sin(timeFactor) / 2.0 + .5;
    float scaleFactor = .01;
    offset = aVertexNormal * timeOffset * scaleFactor;

    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition - offset, 1.0);
}
