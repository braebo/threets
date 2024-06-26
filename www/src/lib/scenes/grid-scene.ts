import { Gui } from '../../../../../../../fractils/src/lib/gui/Gui'
import { WASDController, OrbitController, Vector3 } from 'threets'
import { Stage } from 'threets'

export async function gridScene(selector: string) {
	const stage = new Stage({
		canvas: selector,
		camera: {
			// transform: {
			position: { x: 0, y: 10, z: 10 },
			// 	// position: new Vector3({ x: 0, y: 5, z: -10 }),
			// },
		},
		fragment: `#version 300 es
precision mediump float;

in vec2 v_uv;
// uniform vec2 u_resolution;
out vec4 fragColor;

void main() {
   fragColor = vec4(v_uv, v_uv.x / v_uv.x, 1.0);
}`,
	})

	const orbit_controller = new OrbitController(stage, {
		speed: 2,
		target: new Vector3(1, 5, 5),
	})

	const wasd_controller = new WASDController(stage, { speed: 1 })

	// stage.addSimpleQuad()

	createGridGeometry()

	const fps = 25
	const interval = 1000 / fps
	let now: number
	let then = Date.now()
	let delta = 0
	function render() {
		requestAnimationFrame(render)
		now = Date.now()
		delta = now - then

		if (delta > interval) {
			then = now - (delta % interval)
			stage.render()
			orbit_controller.update()
			wasd_controller.update()
		}
	}
	render()

	const gui = new Gui()
	gui.addNumber(wasd_controller, 'speed', {
		min: 0.01,
		max: 10,
		step: 0.01,
	})

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

	return { stage }
}
