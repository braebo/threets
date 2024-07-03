import type { Geometry } from 'threets'

import { Gui } from '../../../../../../../fractils/src/lib/gui/Gui'
import { Stage, Vector3, WASDController } from 'threets'

let grid = {} as {
	geometry: Geometry
	animate: (time: number, delta: number) => void
}

const ctrls = {
	waves: {
		speed: 0.001, // Wave effect speed.
		amount: 0.01, // Wave effect amplitude.
		frequency: 0.05, // Wave effect frequency.
	},
	scale: 0.1, // Scale factor for converting dB to amplitude.
	amount: 0.2, // Audio spectrum influence.
	offset: 150, // Offset for the audio spectrum.
	log: 4.5, // Logarithmic scaling factor for the audio spectrum.
	center: 1, // Center gravity influence.
	centerZ: 0, // Center gravity z-axis offset.
	padding: 0.25, // Pinch the x-axis.
	falloff: 2, // The falloff factor for the center gravity.
	position_smoothing: 1.75, // The smoothing function's divisor.
	step: 4, // Grid resolution (distance between vertices).
	size: 200, // The width/height of the grid.

	colorAHex: '#2dc3e1' as const,
	colorA: new Vector3(0.17647058823529413, 0.7647058823529411, 0.8823529411764706),
	u_colorFactor: -900,
	colorBHex: '#e79752' as const,
	colorB: new Vector3(0.9058823529411765, 0.592156862745098, 0.3215686274509804),

	fft_size: 2048,
	fft_smoothing: 0.5,

	knob1: 1,
	knob2: 1,
	knob3: 1,
	knob4: -900,
}

async function createGui(stage: Stage) {
	const gui = new Gui({
		position: 'center',
	})

	await stage.camera.addGui(gui, { closed: true })

	const settingsFolder = gui.addFolder('settings')
	settingsFolder.addNumber(ctrls, 'knob1', { min: 1, max: 300, step: 0.001 })
	settingsFolder.addNumber(ctrls, 'knob2', { min: 1, max: 300, step: 0.001 })
	settingsFolder.addNumber(ctrls, 'knob3', { min: 0, max: 1, step: 0.001 })
	settingsFolder.addNumber(ctrls, 'knob4', { min: -2000, max: -500, step: 0.001 })

	const colorA = settingsFolder.addColor({ value: ctrls.colorAHex })
	colorA.on('change', (v) => {
		ctrls.colorA.set({ x: v.blue / 255, y: v.green / 255, z: v.red / 255 })
		console.log('colorA', ctrls.colorA)
	})
	settingsFolder.addNumber(ctrls, 'u_colorFactor', { min: -2000, max: -500, step: 0.001 })
	const colorB = settingsFolder.addColor({ value: ctrls.colorBHex })
	colorB.on('change', (v) => {
		ctrls.colorB.set({ x: v.blue / 255, y: v.green / 255, z: v.red / 255 })
	})

	const gridGui = await grid.geometry.addGui(gui, { title: 'grid' })

	const animFolder = gui.addFolder('animation')
	const wavesFolder = animFolder.addFolder('waves', { closed: true })
	wavesFolder.addNumber(ctrls.waves, 'speed', { min: 0.00001, max: 0.01, step: 0.0001 })
	wavesFolder.addNumber(ctrls.waves, 'amount', { min: 0, max: 1, step: 0.01 })
	wavesFolder.addNumber(ctrls.waves, 'frequency', { min: 0.01, max: 5, step: 0.001 })

	const audioFolder = animFolder.addFolder('audio')
	audioFolder.addNumber(ctrls, 'scale', { min: 0, max: 1, step: 0.01 })
	audioFolder.addNumber(ctrls, 'amount', { min: 0, max: 1, step: 0.01 })
	audioFolder.addNumber(ctrls, 'offset', { min: 0, max: 300, step: 0.01 })
	audioFolder.addNumber(ctrls, 'log', { min: 0, max: 10, step: 0.01 })
	audioFolder.addNumber(ctrls, 'center', { min: 0, max: 2, step: 0.01 })
	audioFolder.addNumber(ctrls, 'centerZ', { min: -50, max: 50, step: 0.01 })
	audioFolder.addNumber(ctrls, 'padding', { min: 0, max: 5, step: 0.001 })
	audioFolder.addNumber(ctrls, 'falloff', { min: 0, max: 10, step: 0.01 })
	audioFolder.addNumber(ctrls, 'position_smoothing', { min: 0, max: 5, step: 0.01 })

	gridGui.folder
		.addNumber(ctrls, 'size', { order: 10, min: 4, max: 500, step: 1 })
		.on('change', async () => {
			grid = await createGrid(stage)
		})

	gridGui.folder
		.addNumber(ctrls, 'step', { order: 0, min: 1, max: 20, step: 1 })
		.on('change', async () => {
			grid = await createGrid(stage)
		})
}

export async function gridScene(selector: string) {
	const stage = new Stage({
		canvas: selector,
		uniforms: [
			{
				name: 'u_colorA',
				type: 'vec3',
				value: () => ctrls.colorA.get(),
			},
			{
				name: 'u_colorB',
				type: 'vec3',
				value: () => ctrls.colorB.get(),
			},
			{
				name: 'u_colorFactor',
				type: 'float',
				value: () => ctrls.u_colorFactor,
			},
			{
				name: 'knob1',
				type: 'float',
				value: () => ctrls.knob1,
			},
			{
				name: 'knob2',
				type: 'float',
				value: () => ctrls.knob2,
			},
			{
				name: 'knob3',
				type: 'float',
				value: () => ctrls.knob3,
			},
			{
				name: 'knob4',
				type: 'float',
				value: () => ctrls.knob4,
			},
		],
		camera: {
			// position: { x: 0, y: 10, z: 10 }
			position: { x: ctrls.size / 2, y: 10, z: ctrls.size }, // todo - reposition geometry instead?
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
		fragment: /*glsl*/ `#version 300 es
precision mediump float;

in vec2 v_uv;
in vec3 v_position;

uniform sampler2D u_audioData;
uniform vec2 u_resolution;

uniform float knob1;
uniform float knob2;
uniform float knob3;
uniform float knob4;

uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform float u_colorFactor;

out vec4 fragColor;

void main() {
	vec4 audioSample = texture(u_audioData, vec2(v_uv.x * knob4, 0.0));
	float audioIntensity = audioSample.r;

	vec3 color = mix(u_colorA, u_colorB, (audioIntensity * v_position.y / u_colorFactor));
	// penis
	float alpha = (v_position.y - 2.);

   fragColor = vec4(color, alpha);
}`,
	})

	const wasd_controller = new WASDController(stage, {
		speed: 1,
		exclude: ['arrowup', 'arrowdown'],
	})

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
	const uvs = [] as number[]

	const vertsPerSide = Math.floor(ctrls.size / ctrls.step) + 1 // +1 to include both ends.

	// Generate vertices and UVs
	for (let z = 0; z < vertsPerSide; z++) {
		for (let x = 0; x < vertsPerSide; x++) {
			const xPos = x * ctrls.step
			const zPos = z * ctrls.step
			const y = 0
			positions.push(xPos, y, zPos)
			uvs.push(x / (vertsPerSide - 1), z / (vertsPerSide - 1))
		}
	}

	// Generate indices for triangles
	for (let z = 0; z < vertsPerSide - 1; z++) {
		for (let x = 0; x < vertsPerSide - 1; x++) {
			const topLeft = z * vertsPerSide + x
			const topRight = topLeft + 1
			const bottomLeft = (z + 1) * vertsPerSide + x
			const bottomRight = bottomLeft + 1

			// First triangle
			indices.push(topLeft, bottomLeft, topRight)
			// Second triangle
			indices.push(topRight, bottomLeft, bottomRight)
		}
	}

	// Create geometry.
	const geometry = stage.addGeometry({
		name: 'a_position',
		positions: new Float32Array(positions),
		indices: new Uint16Array(indices),
		uvs: new Float32Array(uvs),
		// mode: stage.gl?.LINES,
		mode: stage.gl?.TRIANGLES,
		transform: {
			position: new Vector3({ x: -ctrls.size / 2, y: 0, z: -ctrls.size / 2 }),
		},
	})

	async function initAudio() {
		const audioContext = new AudioContext()
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		const mic = audioContext.createMediaStreamSource(stream)
		const analyser = new AnalyserNode(audioContext, {
			fftSize: ctrls.fft_size,
			smoothingTimeConstant: ctrls.fft_smoothing,
		})
		mic.connect(analyser)

		analyser.fftSize = 2048
		analyser.smoothingTimeConstant = 0.5
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
			value: 0,
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
			audioTexture.set(dataArray)
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
			for (let z = 1; z < vertsPerSide - 1; z++) {
				for (let x = 1; x < vertsPerSide - 1; x++) {
					const index = z * vertsPerSide + x
					const positionIndex = index * 3

					let sum = 0
					sum += tempPositions[positionIndex - vertsPerSide * 3 + 1] // top
					sum += tempPositions[positionIndex + vertsPerSide * 3 + 1] // bottom
					sum += tempPositions[positionIndex - 3 + 1] // left
					sum += tempPositions[positionIndex + 3 + 1] // right
					sum += tempPositions[positionIndex + 1] // center

					geometry.positions[positionIndex + 1] = sum / ctrls.position_smoothing
				}
			}
		}
	}

	const { analyser, dataArray, updateAudioTexture } = await initAudio()

	let t = 0

	// let times = 0
	return {
		geometry,
		animate(time: number, delta: number) {
			t += delta * ctrls.waves.speed
			analyser.getFloatFrequencyData(dataArray)
			updateAudioTexture()

			const centerZ = (vertsPerSide - 1) / 2 + ctrls.centerZ

			for (let z = 0; z < vertsPerSide; z++) {
				for (let x = 0; x < vertsPerSide; x++) {
					const index = z * vertsPerSide + x
					const positionIndex = index * 3

					// Calculate normalized x position (0 to 1)
					const normalizedX = x / (vertsPerSide - 1)

					// // Map to frequency index
					// const frequencyIndex = Math.floor(normalizedX * (dataArray.length - 1))

					// Apply logarithmic scaling to the compressed range
					const logNormalizedX = Math.log(1 + normalizedX) / Math.log(ctrls.log)

					// Map to frequency index
					const frequencyIndex = Math.floor(logNormalizedX * (dataArray.length - 1))

					// Get the amplitude from the frequency data and apply padding
					let amplitude = Math.max(
						0,
						(dataArray[frequencyIndex] + ctrls.offset) * ctrls.scale,
					)

					// Calculate distance from center on z-axis
					const distanceFromCenterZ = Math.abs(z - centerZ) / centerZ

					// Apply falloff effect
					const falloffFactor = Math.pow(1 - distanceFromCenterZ, ctrls.falloff)

					// Create a peak effect along the z-axis with falloff
					const centerInfluence = Math.pow(
						1 - Math.min(distanceFromCenterZ, 1),
						ctrls.center,
					)
					// const centerInfluence = 1

					// Apply center influence, falloff, and audio influence to the amplitude
					amplitude *= centerInfluence * falloffFactor * ctrls.amount
					// amplitude *= centerInfluence * ctrls.amount

					// Apply subtle wave effect.
					const waveOffset =
						Math.sin(time * ctrls.waves.speed + x * ctrls.waves.frequency) *
						ctrls.waves.amount

					geometry.positions[positionIndex + 1] = amplitude + waveOffset
				}
			}
			geometry.refreshPositions()

			smoothGrid()

			updateAudioTexture()
		},
	}
}

function createFaceGeometry(stage: Stage, positions: number[], indices: number[], uvs: number[]) {
	return stage.addGeometry({
		name: 'grid_faces',
		positions: new Float32Array(positions),
		indices: new Uint16Array(indices),
		uvs: new Float32Array(uvs),
		mode: stage.gl?.TRIANGLES,
		transform: {
			position: new Vector3({ x: -ctrls.size / 2, y: 0, z: -ctrls.size / 2 }),
		},
	})
}

function createLineGeometry(stage: Stage, positions: number[], indices: number[]) {
	const linePositions: number[] = []
	const lineIndices: number[] = []

	// Create line geometry (thickened lines)
	for (let i = 0; i < indices.length; i += 3) {
		for (let j = 0; j < 3; j++) {
			const idx1 = indices[i + j]
			const idx2 = indices[i + ((j + 1) % 3)]
			addThickLine(positions, idx1, idx2, linePositions, lineIndices)
		}
	}

	return stage.addGeometry({
		name: 'grid_lines',
		positions: new Float32Array(linePositions),
		indices: new Uint16Array(lineIndices),
		mode: stage.gl?.TRIANGLES, // We use triangles for thick lines
		transform: {
			position: new Vector3({ x: -ctrls.size / 2, y: 0, z: -ctrls.size / 2 }),
		},
	})
}

function addThickLine(
	positions: number[],
	idx1: number,
	idx2: number,
	linePositions: number[],
	lineIndices: number[],
) {
	const startIndex = linePositions.length / 3
	const thickness = 0.1 // Adjust as needed

	const x1 = positions[idx1 * 3]
	const y1 = positions[idx1 * 3 + 1]
	const z1 = positions[idx1 * 3 + 2]
	const x2 = positions[idx2 * 3]
	const y2 = positions[idx2 * 3 + 1]
	const z2 = positions[idx2 * 3 + 2]

	// Calculate perpendicular vector
	// prettier-ignore
	const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
	const length = Math.sqrt(dx * dx + dy * dy + dz * dz)
	// prettier-ignore
	const px = -dy / length * thickness, py = dx / length * thickness, pz = 0;

	// Add four vertices to create a "thick" line
	// prettier-ignore
	linePositions.push(
        x1 + px, y1 + py, z1 + pz,
        x1 - px, y1 - py, z1 - pz,
        x2 + px, y2 + py, z2 + pz,
        x2 - px, y2 - py, z2 - pz
    );

	// Add indices for two triangles
	// prettier-ignore
	lineIndices.push(
		startIndex, startIndex + 1, startIndex + 2,
		startIndex + 1, startIndex + 3, startIndex + 2,
	)
}
