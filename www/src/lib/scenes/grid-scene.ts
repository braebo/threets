import { Gui } from '../../../../../../../fractils/src/lib/gui/gui'
import { Stage } from 'threets'
import {
	WASDController,
	OrbitController,
} from 'threets'

export async function gridScene(selector: string) {
	const stage = new Stage({
		canvas: selector,
		vertex: `#version 300 es
precision mediump float;

in vec4 a_position;
uniform vec2 u_resolution;
uniform mat4 u_camera;
out vec2 v_uv;

void main() {
    v_uv = a_position.xy * 0.5 + 0.5;
	gl_Position = u_camera * a_position;
}`,
		fragment: `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

void main() {
   fragColor = vec4(v_uv.x, v_uv.y, v_uv.y + v_uv.x, 1.0);
}`,
	})

	stage.camera.transform.position.setY(5).setZ(-10)

	const controller = new OrbitController(stage)
	const controller2 = new WASDController(stage, { speed: 0.1 })

	// stage.addSimpleQuad()

	createGridGeometry()

	function createGridGeometry() {
		const size = 100
		const step = 10

		const positions = [] as number[]

		for (let i = -size; i <= size; i += step) {
			const y = Math.random() - 0.5
			positions.push(-size, y, i, size, y, i)
			positions.push(i, y, -size, i, y, size)
		}

		// floor grid
		stage.addGeometry({
			name: 'a_position',
			positions: new Float32Array(positions),
			mode: stage.gl?.LINES,
		})
	}

	let error = stage.gl?.getError()
	if (error != stage.gl?.NO_ERROR) {
		console.error('WebGL Error: ' + error)
	}

	// function render() {
	// 	stage.render()
	// 	controller.update()
	// 	requestAnimationFrame(render)
	// }
	let fps = 60, // Desired FPS
		now,
		then = Date.now(),
		interval = 1000 / fps,
		delta

	function render() {
		requestAnimationFrame(render)
		now = Date.now()
		delta = now - then

		if (delta > interval) {
			then = now - (delta % interval)
			stage.render()
			controller.update()
			controller2.update()
		}
	}

	render()

	const gui = new Gui()
	gui.addNumber({
		title: 'speed',
		binding: {
			key: 'speed',
			target: controller,
		},
		min: 0.01,
		max: 10,
		step: 0.01,
	})

	return { stage, controller }
}
