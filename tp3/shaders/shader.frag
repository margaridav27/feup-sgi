#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform float timeFactor;
uniform vec3 color;

void main() {
	// pulsing color
	vec4 pulseColor = vec4(color, 1.0);
	vec4 texColor = texture2D(uSampler, vTextureCoord);

	gl_FragColor = mix(texColor, pulseColor, (sin(timeFactor) + 1.0) / 2.0);
}