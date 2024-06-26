import type { Geometry } from 'threets'

import { Gui } from '../../../../../../../fractils/src/lib/gui/Gui'
import { Stage, Vector3, WASDController } from 'threets'

let grid = {} as {
	geometry: Geometry
	animate: (time: number, delta: number) => void
}

const ctrls = {
	speed: 0.001,
	scale: 1, // Scale factor for converting dB to amplitude.
	waves: 0.01, // Wave effect amplitude.
	audio: 0.2, // Audio spectrum influence.
	center: 1, // Center gravity influence.
	padding: 0.25, // Pinch the x-axis.
	falloff: 2, // The falloff factor for the center gravity.
	smoothing: 5, // The smoothing function's divisor.
	size: 100, // The width/height of the grid.
	step: 2, // Grid resolution (distance between vertices).
}

export async function gridScene(selector: string) {
	const stage = new Stage({
		canvas: selector,
		camera: {
			// position: { x: 0, y: 10, z: 10 }
			position: { x: 50, y: 10, z: 100 }, // todo - reposition geometry instead
		},
		vertex: `#version 300 es
precision mediump float;

in vec4 a_position;
uniform vec2 u_resolution;
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
out vec2 v_uv;
out vec3 v_position;

void main() {
    v_uv = a_position.xy / u_resolution;
    v_position = a_position.xyz;
    vec4 worldPosition = u_modelMatrix * a_position;
    vec4 viewPosition = u_viewMatrix * worldPosition;
    gl_Position = u_projectionMatrix * viewPosition;
}`,
		fragment: `#version 300 es
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
}`,
	})
	// const orbit_controller = new OrbitController(stage, {
	// 	speed: 2,
	// 	target: new Vector3(1, 5, 5),
	// })
	const wasd_controller = new WASDController(stage, {
		speed: 1,
		exclude: ['arrowup', 'arrowdown'],
	})
	stage.addSimpleQuad()

	grid = await createGrid(stage)

	await createGui(stage)

	startRenderLoop()

	function startRenderLoop() {
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
				wasd_controller.update()
				grid.animate(now, delta)
				grid.geometry.refreshPositions()
			}
		}
		render()
	}

	return { stage, grid }
}

async function createGrid(stage: Stage) {
	const positions = [] as number[]
	const indices = [] as number[]

	const verticesPerSide = Math.floor(ctrls.size / ctrls.step) + 1 // +1 to include both ends.

	// Generate vertices
	for (let z = 0; z < verticesPerSide; z++) {
		for (let x = 0; x < verticesPerSide; x++) {
			const xPos = x * ctrls.step
			const zPos = z * ctrls.step
			const y = 0 // Initial y position (flat grid)
			positions.push(xPos, y, zPos)
		}
	}

	// Generate indices for lines.
	for (let z = 0; z < verticesPerSide - 1; z++) {
		for (let x = 0; x < verticesPerSide - 1; x++) {
			const topLeft = z * verticesPerSide + x
			const topRight = topLeft + 1
			const bottomLeft = (z + 1) * verticesPerSide + x
			const bottomRight = bottomLeft + 1

			// Add horizontal line
			indices.push(topLeft, topRight)
			// Add vertical line
			indices.push(topLeft, bottomLeft)

			// Add the last vertical line for the rightmost column
			if (x === verticesPerSide - 2) {
				indices.push(topRight, bottomRight)
			}
		}
		// Add the last horizontal line for the bottom row
		if (z === verticesPerSide - 2) {
			for (let x = 0; x < verticesPerSide - 1; x++) {
				const bottomLeft = (z + 1) * verticesPerSide + x
				const bottomRight = bottomLeft + 1
				indices.push(bottomLeft, bottomRight)
			}
		}
	}

	// Create geometry.
	const geometry = stage.addGeometry({
		name: 'a_position',
		positions: new Float32Array(positions),
		indices: new Uint16Array(indices),
		mode: stage.gl?.LINES,
		transform: {
			position: new Vector3({ x: -ctrls.size / 2, y: 0, z: -ctrls.size / 2 }),
		},
	})

	async function audio() {
		const audioContext = new AudioContext()
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		const mic = audioContext.createMediaStreamSource(stream)
		const analyser = audioContext.createAnalyser()
		mic.connect(analyser)

		analyser.fftSize = 256
		analyser.smoothingTimeConstant = 0.8
		const bufferLength = analyser.frequencyBinCount
		const dataArray = new Float32Array(bufferLength)

		analyser.getFloatFrequencyData(dataArray)

		// Outside the animate function, after creating the analyser and dataArray
		const textureSize = Math.ceil(Math.sqrt(dataArray.length))
		const audioTexture = new Float32Array(textureSize * textureSize)

		// Create the uniform
		stage.addUniform({
			name: 'u_audioData',
			type: 'sampler2D',
			value: 0, // We'll use texture unit 0
		})

		// Create and set up the texture
		const texture = stage.gl!.createTexture()
		stage.gl!.activeTexture(stage.gl!.TEXTURE0)
		stage.gl!.bindTexture(stage.gl!.TEXTURE_2D, texture)
		// prettier-ignore
		stage.gl!.texParameteri(stage.gl!.TEXTURE_2D, stage.gl!.TEXTURE_MIN_FILTER, stage.gl!.NEAREST)
		// prettier-ignore
		stage.gl!.texParameteri(stage.gl!.TEXTURE_2D, stage.gl!.TEXTURE_MAG_FILTER, stage.gl!.NEAREST)
		// prettier-ignore
		stage.gl!.texParameteri(stage.gl!.TEXTURE_2D, stage.gl!.TEXTURE_WRAP_S, stage.gl!.CLAMP_TO_EDGE)
		// prettier-ignore
		stage.gl!.texParameteri(stage.gl!.TEXTURE_2D, stage.gl!.TEXTURE_WRAP_T, stage.gl!.CLAMP_TO_EDGE)

		// Function to update the texture with new audio data
		function updateAudioTexture() {
			// Fill the audioTexture with the latest data
			for (let i = 0; i < dataArray.length; i++) {
				audioTexture[i] = dataArray[i]
			}
			// Upload the data to the GPU
			stage.gl!.texImage2D(
				stage.gl!.TEXTURE_2D,
				0,
				stage.gl!.R32F,
				textureSize,
				textureSize,
				0,
				stage.gl!.RED,
				stage.gl!.FLOAT,
				audioTexture,
			)
		}

		return { analyser, dataArray, updateAudioTexture }
	}

	/**
	 * Smooths vertices by averaging the heights of the surrounding vertices.
	 */
	function smoothGrid() {
		for (let i = 0; i < 3; i++) {
			const tempPositions = new Float32Array(geometry.positions)
			for (let z = 1; z < verticesPerSide - 1; z++) {
				for (let x = 1; x < verticesPerSide - 1; x++) {
					const index = z * verticesPerSide + x
					const positionIndex = index * 3

					let sum = 0
					sum += tempPositions[positionIndex - verticesPerSide * 3 + 1] // top
					sum += tempPositions[positionIndex + verticesPerSide * 3 + 1] // bottom
					sum += tempPositions[positionIndex - 3 + 1] // left
					sum += tempPositions[positionIndex + 3 + 1] // right
					sum += tempPositions[positionIndex + 1] // center

					geometry.positions[positionIndex + 1] = sum / ctrls.smoothing
				}
			}
		}
	}

	const { analyser, dataArray, updateAudioTexture } = await audio()

	return {
		geometry,
		animate(time: number, _delta: number) {
			analyser.getFloatFrequencyData(dataArray)
			updateAudioTexture()

			const centerZ = (verticesPerSide - 1) / 2

			for (let z = 0; z < verticesPerSide; z++) {
				for (let x = 0; x < verticesPerSide; x++) {
					const index = z * verticesPerSide + x
					const positionIndex = index * 3

					// Calculate normalized x position (0 to 1).
					const normalizedX = x / (verticesPerSide - 1)

					// Apply smooth padding effect.
					const paddingFactor = Math.pow(Math.sin(normalizedX * Math.PI), ctrls.padding)

					// Map to frequency index.
					const frequencyIndex = Math.floor(normalizedX * (dataArray.length - 1))

					// Get the amplitude from the frequency data and apply padding.
					let amplitude = Math.max(
						0,
						(dataArray[frequencyIndex] + 140) * ctrls.scale * paddingFactor,
					)

					// Calculate distance from center on z-axis.
					const distanceFromCenterZ = Math.abs(z - centerZ) / centerZ

					// Apply falloff effect.
					const falloffFactor = Math.pow(1 - distanceFromCenterZ, ctrls.falloff)

					// Create a peak effect along the z-axis with falloff.
					const centerInfluence = Math.pow(
						1 - Math.min(distanceFromCenterZ, 1),
						ctrls.center,
					)

					// Apply center influence, falloff, and audio influence to the amplitude.
					amplitude *= centerInfluence * falloffFactor * ctrls.audio

					// Apply subtle wave effect.
					const waveOffset = Math.sin(time * ctrls.speed + x * 0.05) * ctrls.waves

					// Set the y position (height) based on the audio data, center influence, falloff, and subtle wave.
					geometry.positions[positionIndex + 1] = amplitude + waveOffset
				}
			}

			geometry.refreshPositions()

			// Apply additional smoothing pass
			smoothGrid()

			updateAudioTexture()
		},
	}
}

async function createGui(stage: Stage) {
	const gui = new Gui({
		position: 'center',
	})
	await stage.camera.addGui(gui, { title: 'camera', closed: true })

	const animFolder = gui.addFolder('animation')
	animFolder.addNumber(ctrls, 'speed', {
		min: 0.00001,
		max: 0.01,
		step: 0.0001,
	})
	animFolder.addNumber(ctrls, 'scale', {
		min: 0,
		max: 1,
		step: 0.01,
	})
	animFolder.addNumber(ctrls, 'waves', {
		min: 0,
		max: 1,
		step: 0.01,
	})
	animFolder.addNumber(ctrls, 'audio', {
		min: 0,
		max: 20,
		step: 1,
	})
	animFolder.addNumber(ctrls, 'padding', {
		min: 0,
		max: 0.3,
		step: 0.001,
	})
	animFolder.addNumber(ctrls, 'falloff', {
		min: 0,
		max: 10,
		step: 0.01,
	})
	animFolder.addNumber(ctrls, 'smoothing', {
		min: 0,
		max: 100,
		step: 0.01,
	})

	const gridFolder = gui.addFolder('grid')

	gridFolder
		.addNumber(ctrls, 'size', {
			min: 4,
			max: 500,
			step: 1,
		})
		.on('change', async () => {
			grid = await createGrid(stage)
		})

	gridFolder
		.addNumber(ctrls, 'step', {
			min: 1,
			max: 20,
			step: 1,
		})
		.on('change', async () => {
			grid = await createGrid(stage)
		})
}
