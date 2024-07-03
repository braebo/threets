#version 300 es
precision mediump float;

in vec2 v_uv;
in vec3 v_position;

uniform sampler2D u_audioData;
uniform vec2 u_resolution;

out vec4 fragColor;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 audioSample = texture(u_audioData, vec2(v_uv.x, 0.0));
    float audioIntensity = audioSample.r;

   // Map frequency (x position) to hue
    float hue = v_position.x / u_resolution.x;

   // Map amplitude (y position) to saturation and value
    float saturation = clamp(v_position.y / 50.0, 0.5, 1.0);
    float value = clamp(v_position.y / 25.0, 0.5, 1.0);

    vec3 color = hsv2rgb(vec3(hue, saturation, value));

    fragColor = vec4(color, 1.0);
}