#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform float timeFactor;
uniform vec3 color;

void main() {
	float timeOffset = sin(timeFactor) / 2.0 + .85;
	vec4 offsetColor = vec4(color, 1.0);
	vec4 textureColor = texture2D(uSampler, vTextureCoord);

	gl_FragColor = textureColor;
	gl_FragColor = mix(textureColor, offsetColor, timeOffset);

}