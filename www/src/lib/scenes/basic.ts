import { Stage } from 'threets'

export async function basicScene() {
	const stage = new Stage({
		vertex: `#version 300 es
precision mediump float;

in vec4 a_position;
uniform vec2 u_resolution;
uniform mat4 u_matrix;
out vec2 v_uv;

void main() {
    v_uv = a_position.xy / u_resolution;
    gl_Position = u_matrix * a_position;

    gl_PointSize = 2.0;
}`,
		fragment: `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

void main() {
   fragColor = vec4(v_uv, v_uv.y + v_uv.x, 1.0);
}`,
	})

	// stage.addGeometry({
	// 	name: 'a_grid',
	// 	positions: new Float32Array([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1]),
	// })

	stage.render()
}
