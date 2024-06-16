import { Gui } from '../../../fractils/src/lib/gui/Gui'

import { Geometry, type GeometryOptions } from './geometry'
import { Uniform, type UniformOptions } from './uniform'
import { Camera, type CameraOptions } from './camera'
import { Transform } from './transform'
import { Matrix4 } from './matrix'
import { select } from './utils'

export type QuerySelector = `#${string}` | `.${string}` | string

export interface StageOptions {
	canvas?: HTMLCanvasElement | QuerySelector
	container?: HTMLElement | QuerySelector
	autoInit?: boolean
	vertex?: string
	fragment?: string
	depth?: number
	camera?: CameraOptions
}

export class Stage {
	opts: StageOptions

	canvas!: HTMLCanvasElement
	container!: Element
	resizeObserver!: ResizeObserver

	gl: WebGL2RenderingContext | null = null
	program: WebGLProgram | null = null

	uniforms: Map<'u_resolution' | 'u_matrix' | string, Uniform> = new Map()
	geometries: Map<'a_position' | string, Geometry> = new Map()

	camera!: Camera
	transform!: Transform

	uResolution!: Uniform
	uMatrix!: Uniform
	uTime!: Uniform

	vertexShader: WebGLShader | null = null
	vertex: string | null = `#version 300 es
precision mediump float;
in vec4 a_position;
uniform vec2 u_resolution;
out vec2 v_uv;
main() {
	v_uv = a_position.xy / u_resolution;
	gl_Position = a_position;
}`

	fragmentShader: WebGLShader | null = null
	fragment: string | null = `#version 300 es
precision mediump float;
in vec2 v_uv;
out vec4 fragColor;
void main() {
	fragColor = vec4(v_uv, (v_uv.y + v_uv.x) * 0.5), 1.0);
}`

	initialized = false

	constructor(options?: StageOptions) {
		this.opts = options ?? {}

		if (this.opts?.autoInit) {
			if (typeof globalThis.window === 'undefined') {
				// @ts-ignore
				if (!!import.meta?.env?.DEV) {
					console.warn(
						'PocketShader is not running in a browser environment.  Aborting automatic initialization.',
					)
				}
				return
			}

			if (globalThis.document?.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', this.init)
			} else {
				this.init()
			}
		}

		if (options?.autoInit) {
			if (typeof globalThis.document === 'undefined') return

			this.init()
		}
	}

	init() {
		if (this.initialized) return
		this.initialized = true

		//* Setup Container

		let container = select(this.opts.container)
		if (!container) container = document.body
		this.container = container

		//* Setup Canvas

		let canvas = select(this.opts.canvas)
		if (!canvas) {
			canvas = document.createElement('canvas')
			container.appendChild(canvas)
		}
		this.canvas = canvas as HTMLCanvasElement

		this.resizeObserver = new ResizeObserver(this.resize)
		this.resizeObserver.observe(this.canvas as HTMLCanvasElement, { box: 'content-box' })

		//* Setup WebGL Context

		const gl = this.canvas.getContext('webgl2')
		if (!gl) throw new Error('WebGL2 not supported')
		this.gl = gl

		//* Setup Shaders

		if (this.opts?.vertex) this.vertex = this.opts.vertex
		if (this.opts?.fragment) this.fragment = this.opts.fragment

		this.vertexShader = this._compileShader(this.gl.VERTEX_SHADER, this.vertex!)
		this.fragmentShader = this._compileShader(this.gl.FRAGMENT_SHADER, this.fragment!)

		this.program = this._createProgram()

		//* Setup Uniforms

		this.transform = new Transform({
			identity: () => Transform.projection(this.canvas.width, this.canvas.height, this.opts.depth ?? 400),
		})

		this._createDefaultUniforms()

		//* Setup Camera

		this.camera = new Camera({
			fov: 60,
			aspect: this.canvas.width / this.canvas.height,
			zNear: 1,
			zFar: 2000,
		})

		this.addUniform({
			name: 'u_camera',
			type: 'array',
			value: () => this.camera.transform.matrix,
			update: (location, value) => {
				this.gl!.uniformMatrix4fv(location, false, value)
			},
		})
	}

	addUniform(uniformOrOptions: Uniform | UniformOptions) {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')
		if (uniformOrOptions instanceof Uniform) this.uniforms.set(uniformOrOptions.name, uniformOrOptions)
		else this.uniforms.set(uniformOrOptions.name, new Uniform(this.gl, this.program, uniformOrOptions))
	}

	addGeometry(geometryOrOptions: Geometry | GeometryOptions) {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')
		if (geometryOrOptions instanceof Geometry) this.geometries.set(geometryOrOptions.name, geometryOrOptions)
		else this.geometries.set(geometryOrOptions.name, new Geometry(this.gl, this.program, geometryOrOptions))
	}

	update() {
		this.transform.update()

		for (const uniform of this.uniforms.values()) {
			uniform.update(uniform.value())
		}
	}

	render() {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')

		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
		this.gl.clearColor(0, 0, 0, 0)
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
		this.gl.enable(this.gl.DEPTH_TEST)
		this.gl.useProgram(this.program)

		this.update()

		for (const geometry of this.geometries.values()) {
			geometry.render()
		}
	}

	private _createDefaultUniforms() {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')

		this.addUniform({
			name: 'u_matrix',
			type: 'array',
			value: () => this.transform!.matrix,
			update: (location, value) => {
				this.gl!.uniformMatrix4fv(location, false, value)
			},
		})

		this.addUniform({
			name: 'u_resolution',
			type: 'vec2',
			value: () => [this.canvas.width, this.canvas.height] as [number, number],
			update: (location, value) => {
				this.gl!.uniform2fv(location, value)
			},
		})

		this.addUniform({
			name: 'u_time',
			type: 'float',
			value: () => performance.now() / 1000,
			update: (location, value) => {
				this.gl!.uniform1f(location, value)
			},
		})
	}

	private _createProgram() {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.vertex) throw new Error('Vertex shader not found')
		if (!this.fragment) throw new Error('Fragment shader not found')

		const program = this.gl.createProgram()!
		if (!program) throw new Error('Failed to create program.')

		this.gl.attachShader(program, this.vertex)
		this.gl.attachShader(program, this.fragment)

		this.gl.linkProgram(program)

		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			console.error('Failed to link program', this.gl.getProgramInfoLog(program))
			throw new Error('Failed to link program')
		}

		if (this.vertexShader) {
			this.gl.detachShader(program, this.vertexShader)
			this.gl.deleteShader(this.vertexShader)
		}
		if (this.fragmentShader) {
			this.gl.detachShader(program, this.fragmentShader)
			this.gl.deleteShader(this.fragmentShader)
		}

		return program
	}

	private _compileShader(
		type: WebGL2RenderingContext['VERTEX_SHADER'] | WebGL2RenderingContext['FRAGMENT_SHADER'],
		source: string,
	) {
		if (!this.gl) throw new Error('WebGL2 context not found')

		const shader = this.gl.createShader(type)
		if (!shader) throw new Error('Failed to create shader')
		this.gl.shaderSource(shader, source)
		this.gl.compileShader(shader)
		return shader
	}

	resize = (entries: ResizeObserverEntry[]) => {
		const target = entries[0].target
		if (target instanceof HTMLCanvasElement) {
			target.width = Math.round(entries[0].devicePixelContentBoxSize[0].inlineSize)
			target.height = Math.round(entries[0].devicePixelContentBoxSize[0].blockSize)
		}
	}

	// private _resizeCanvasToDisplay(canvas: HTMLCanvasElement) {
	// 	// Get the size the browser is displaying the canvas in device pixels.
	// 	const [displayWidth, displayHeight] = [canvas.clientWidth, canvas.clientHeight]

	// 	// Check if the canvas is not the same size.
	// 	const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

	// 	if (needResize) {
	// 		// Make the canvas the same size
	// 		canvas.width = displayWidth
	// 		canvas.height = displayHeight
	// 	}

	// 	return needResize
	// }
}

export default async function (canvas?: HTMLCanvasElement) {
	canvas ??= document.createElement('canvas')
	canvas.width = 800
	canvas.height = 600
	document.body.appendChild(canvas)
	const gl = canvas.getContext('webgl2')

	if (!gl) {
		throw new Error('WebGL2 not supported')
	}

	resizeCanvasToDisplaySize(canvas)

	const gui = new Gui()

	const vert = /*glsl*/ `#version 300 es
precision mediump float;
in vec4 a_position;
in vec4 a_color;

uniform vec2 u_resolution;
uniform mat4 u_matrix;

out vec4 v_color;
out vec2 v_uv;

void main() {
	v_uv = a_position.xy / u_resolution;
	v_color = a_color;
	gl_Position = u_matrix * a_position;
}`

	const frag = /*glsl*/ `#version 300 es
precision mediump float;
in vec4 v_color;
in vec2 v_uv;

uniform vec2 u_resolution;

out vec4 fragColor;

void main() {
	fragColor = v_color;
}`

	//?  Init

	const vertex = compileShader(gl, gl.VERTEX_SHADER, vert)
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, frag)
	const program = createProgram(gl, vertex, fragment)

	//? Matrix

	const translation = [0, 0, 0]
	const rotation = [0, 0, 0]
	const scale = [1, 1, 1]

	let matrix = Matrix4.projection(canvas.clientWidth, canvas.clientHeight, 400)

	matrix = Matrix4.translate(matrix, translation[0], translation[1], translation[2])
	matrix = Matrix4.rotateX(matrix, rotation[0])
	matrix = Matrix4.rotateY(matrix, rotation[1])
	matrix = Matrix4.rotateZ(matrix, rotation[2])
	matrix = Matrix4.scaleBy(matrix, scale[0], scale[1], scale[2])

	//? Uniforms

	const uResolution = new Uniform(gl, program, {
		name: 'u_resolution',
		type: 'vec2',
		value: () => [gl.canvas.width, gl.canvas.height],
		update: (location, value) => {
			gl.uniform2fv(location, value)
		},
	})

	const uMatrix = new Uniform(gl, program, {
		name: 'u_matrix',
		type: 'array',
		value: () => matrix,
		update: (location, value) => {
			gl.uniformMatrix4fv(location, false, value)
		},
	})

	function updateUniforms() {
		for (const uniform of [uResolution, uMatrix]) {
			uniform.update(uniform.value())
		}
	}

	/** Position attribute location. */
	const POSITION = new Geometry(gl, program, {
		name: 'a_position',
		size: 3,
		type: gl.FLOAT,
		normalize: false,
		stride: 0,
		offset: 0,
		// prettier-ignore
		positions: new Float32Array([
			// left column front
			  0,   0,  0,
			 30,   0,  0,
			  0, 150,  0,
			  0, 150,  0,
			 30,   0,  0,
			 30, 150,  0,

			// top rung front
			 30,   0,  0,
			100,   0,  0,
			 30,  30,  0,
			 30,  30,  0,
			100,   0,  0,
			100,  30,  0,

			// middle rung front
			 30,  60,  0,
			 67,  60,  0,
			 30,  90,  0,
			 30,  90,  0,
			 67,  60,  0,
			 67,  90,  0,

			// left column back
			  0,   0,  30,
			 30,   0,  30,
			  0, 150,  30,
			  0, 150,  30,
			 30,   0,  30,
			 30, 150,  30,

			// top rung back
			 30,   0,  30,
			100,   0,  30,
			 30,  30,  30,
			 30,  30,  30,
			100,   0,  30,
			100,  30,  30,

			// middle rung back
			 30,  60,  30,
			 67,  60,  30,
			 30,  90,  30,
			 30,  90,  30,
			 67,  60,  30,
			 67,  90,  30,

			// top
			  0,   0,   0,
			100,   0,   0,
			100,   0,  30,
			  0,   0,   0,
			100,   0,  30,
			  0,   0,  30,

			// top rung right
			100,   0,   0,
			100,  30,   0,
			100,  30,  30,
			100,   0,   0,
			100,  30,  30,
			100,   0,  30,

			// under top rung
			 30,  30,   0,
			 30,  30,  30,
			100,  30,  30,
			 30,  30,   0,
			100,  30,  30,
			100,  30,   0,

			// between top rung and middle
			30,   30,   0,
			30,   30,  30,
			30,   60,  30,
			30,   30,   0,
			30,   60,  30,
			30,   60,   0,

			// top of middle rung
			30,   60,   0,
			30,   60,  30,
			67,   60,  30,
			30,   60,   0,
			67,   60,  30,
			67,   60,   0,

			// right of middle rung
			67,   60,   0,
			67,   60,  30,
			67,   90,  30,
			67,   60,   0,
			67,   90,  30,
			67,   90,   0,

			// bottom of middle rung.
			30,   90,   0,
			30,   90,  30,
			67,   90,  30,
			30,   90,   0,
			67,   90,  30,
			67,   90,   0,

			// right of bottom
			30,   90,   0,
			30,   90,  30,
			30,  150,  30,
			30,   90,   0,
			30,  150,  30,
			30,  150,   0,

			// bottom
			 0,  150,   0,
			 0,  150,  30,
			30,  150,  30,
			 0,  150,   0,
			30,  150,  30,
			30,  150,   0,

			// left side
			0,   0,   0,
			0,   0,  30,
			0, 150,  30,
			0,   0,   0,
			0, 150,  30,
			0, 150,   0
		]),
	})
	const COLOR = new Geometry(gl, program, {
		name: 'a_color',
		size: 3,
		type: gl.UNSIGNED_BYTE,
		normalize: true,
		stride: 0,
		offset: 0,
		// prettier-ignore
		positions: new Float32Array([
			// left column front
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,

			// top rung front
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,

			// middle rung front
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,
			200,  70, 120,

			// left column back
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,

			// top rung back
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,

			// middle rung back
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,
			80, 70, 200,

			// top
			70, 200, 210,
			70, 200, 210,
			70, 200, 210,
			70, 200, 210,
			70, 200, 210,
			70, 200, 210,

			// top rung right
			200, 200, 70,
			200, 200, 70,
			200, 200, 70,
			200, 200, 70,
			200, 200, 70,
			200, 200, 70,

			// under top rung
			210, 100, 70,
			210, 100, 70,
			210, 100, 70,
			210, 100, 70,
			210, 100, 70,
			210, 100, 70,

			// between top rung and middle
			210, 160, 70,
			210, 160, 70,
			210, 160, 70,
			210, 160, 70,
			210, 160, 70,
			210, 160, 70,

			// top of middle rung
			70, 180, 210,
			70, 180, 210,
			70, 180, 210,
			70, 180, 210,
			70, 180, 210,
			70, 180, 210,

			// right of middle rung
			100, 70, 210,
			100, 70, 210,
			100, 70, 210,
			100, 70, 210,
			100, 70, 210,
			100, 70, 210,

			// bottom of middle rung.
			76, 210, 100,
			76, 210, 100,
			76, 210, 100,
			76, 210, 100,
			76, 210, 100,
			76, 210, 100,

			// right of bottom
			140, 210, 80,
			140, 210, 80,
			140, 210, 80,
			140, 210, 80,
			140, 210, 80,
			140, 210, 80,

			// bottom
			90, 130, 110,
			90, 130, 110,
			90, 130, 110,
			90, 130, 110,
			90, 130, 110,
			90, 130, 110,

			// left side
			160, 160, 220,
			160, 160, 220,
			160, 160, 220,
			160, 160, 220,
			160, 160, 220,
			160, 160, 220
		]),
	})

	//· Rendering ···································································¬

	function render(gl: WebGL2RenderingContext, program: WebGLProgram) {
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		// gl.enable(gl.CULL_FACE)
		gl.enable(gl.DEPTH_TEST)
		gl.useProgram(program)

		POSITION.render()
		COLOR.render()

		updateUniforms()

		// gl.drawArrays(gl.TRIANGLES, POSITION.offset, POSITION.vertexCount)
		// requestAnimationFrame(() => render(gl, program))
	}

	render(gl, program)

	function compileShader(
		gl: WebGL2RenderingContext,
		type: WebGL2RenderingContext['VERTEX_SHADER'] | WebGL2RenderingContext['FRAGMENT_SHADER'],
		source: string,
	) {
		const shader = gl.createShader(type)
		if (!shader) throw new Error('Failed to create shader')
		gl.shaderSource(shader, source)
		gl.compileShader(shader)
		return shader
	}

	function createProgram(gl: WebGL2RenderingContext, vertex: WebGLShader, fragment: WebGLShader): WebGLProgram {
		const program = gl.createProgram()!
		if (!program) throw new Error('Failed to create program.')

		gl.attachShader(program, vertex)
		gl.attachShader(program, fragment)

		gl.linkProgram(program)

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Failed to link program', gl.getProgramInfoLog(program))
			throw new Error('Failed to link program')
		}

		return program
	}
	//⌟

	//· Resizing ···································································¬

	const resizeObserver = new ResizeObserver(onResize)
	resizeObserver.observe(gl.canvas as HTMLCanvasElement, { box: 'content-box' })

	function onResize(entries: ResizeObserverEntry[]) {
		for (const entry of entries) {
			;(entry.target as HTMLCanvasElement).width = Math.round(entry.devicePixelContentBoxSize[0].inlineSize)
			;(entry.target as HTMLCanvasElement).height = Math.round(entry.devicePixelContentBoxSize[0].blockSize)
		}
		if (gl) render(gl, program)
	}

	function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
		// Get the size the browser is displaying the canvas in device pixels.
		const [displayWidth, displayHeight] = [canvas.clientWidth, canvas.clientHeight]

		// Check if the canvas is not the same size.
		const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

		if (needResize) {
			// Make the canvas the same size
			canvas.width = displayWidth
			canvas.height = displayHeight
		}

		return needResize
	}
	//⌟

	//· GUI ···································································¬

	const transformsFolder = gui.addFolder({ title: 'transforms' })
	const transformOpts = { min: -2, max: 2, step: 0.01 }

	const translateFolder = transformsFolder.addFolder({ title: 'translate' })
	translateFolder.addNumber({
		value: translation[0],
		title: 'x',
		...transformOpts,
	})
	translateFolder.addNumber({
		value: translation[1],
		title: 'y',
		...transformOpts,
	})
	translateFolder.addNumber({
		value: translation[2],
		title: 'z',
		...transformOpts,
	})
	// prettier-ignore
	translateFolder.on('change', (input) => {
		const v = input.value as number
		switch(input.title) {
			case 'x': matrix = Matrix4.translate(matrix, v, translation[1], translation[2]); break
			case 'y': matrix = Matrix4.translate(matrix, translation[0], v, translation[2]); break
			case 'z': matrix = Matrix4.translate(matrix, translation[0], translation[1], v); break
		}
	})

	const rotateFolder = transformsFolder.addFolder({ title: 'rotate' })
	rotateFolder.addNumber({
		value: rotation[0],
		title: 'x',
		...transformOpts,
	})
	rotateFolder.addNumber({
		value: rotation[1],
		title: 'y',
		...transformOpts,
	})
	rotateFolder.addNumber({
		value: rotation[2],
		title: 'z',
		...transformOpts,
	})
	// prettier-ignore
	rotateFolder.on('change', (input) => {
		const v = input.value as number
		switch(input.title) {
			case 'x': matrix = Matrix4.rotateX(matrix, v); break
			case 'y': matrix = Matrix4.rotateY(matrix, v); break
			case 'z': matrix = Matrix4.rotateZ(matrix, v); break
		}
	})

	const scaleFolder = transformsFolder.addFolder({ title: 'scale' })
	scaleFolder.addNumber({
		value: scale[0],
		title: 'x',
		...transformOpts,
	})
	scaleFolder.addNumber({
		value: scale[1],
		title: 'y',
		...transformOpts,
	})
	scaleFolder.addNumber({
		value: scale[2],
		title: 'z',
		...transformOpts,
	})
	// prettier-ignore
	scaleFolder.on('change', (input) => {
		const v = input.value as number
		switch(input.title) {
			case 'x': matrix = Matrix4.scaleBy(matrix, v, scale[1], scale[2]); break
			case 'y': matrix = Matrix4.scaleBy(matrix, scale[0], v, scale[2]); break
			case 'z': matrix = Matrix4.scaleBy(matrix, scale[0], scale[1], v); break
		}
	})

	transformsFolder.on('change', () => {
		render(gl, program)
	})

	gui.on('change', (input) => {
		if (input.title == 'size') POSITION.size = input.value as typeof POSITION.size
		if (input.title == 'type') POSITION.type = input.value as typeof POSITION.type
		if (input.title == 'normalize') POSITION.normalize = input.value as typeof POSITION.normalize
		if (input.title == 'stride') POSITION.stride = input.value as typeof POSITION.stride
		if (input.title == 'offset') POSITION.offset = input.value as typeof POSITION.offset

		// if (input.title.match(/1|2|3/)) {
		// 	POSITION.positions = new Float32Array(Object.values(p.vertex.positions))
		// }

		render(gl, program)
	})
	//⌟
}
