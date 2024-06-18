import { Stage } from 'threets'

export async function basicScene() {
	const stage = new Stage({
// 		vertex: `#version 300 es
// precision mediump float;

// in vec4 a_position;
// uniform vec2 u_resolution;
// uniform mat4 u_matrix;
// out vec2 v_uv;

// void main() {
//     v_uv = a_position.xy * 0.5 + 0.5;
//     gl_Position = a_position;
// }`,
// 		fragment: `#version 300 es
// precision mediump float;

// in vec2 v_uv;
// out vec4 fragColor;

// void main() {
//    fragColor = vec4(v_uv.x, v_uv.y, v_uv.y + v_uv.x, 1.0);
// }`,
	})



	// // prettier-ignore
	// stage.addGeometry({
	// 	name: 'a_position',
	// 	positions: new Float32Array([
    //         -1, -1, 0,  // bottom left corner
    //          1, -1, 0,  // bottom right corner
    //         -1,  1, 0,  // top left corner
    //          1,  1, 0,  // top right corner
    //     ]),
    //     indices: new Uint16Array([0, 1, 2, 2, 1, 3]),
	// })
    stage.addSimpleQuad()

	// After your WebGL calls
	let error = stage.gl?.getError()
	if (error != stage.gl?.NO_ERROR) {
		console.error('WebGL Error: ' + error)
	}

	stage.render()

	return stage
}
