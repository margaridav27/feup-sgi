attribute vec3 aVertexPosition; // position vector for vertex
attribute vec3 aVertexNormal; // normal vector for vertex
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

varying vec2 vTextureCoord;

uniform float nRows;
uniform float nCols;
uniform float row;
uniform float col;

void main() {
    vTextureCoord = vec2((aTextureCoord.x + col) / nCols, (aTextureCoord.y + row) / nRows); 
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
