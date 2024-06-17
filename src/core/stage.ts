import type { QuerySelector } from './types'

import { Geometry, type GeometryOptions } from './geometry'
import { Uniform, type UniformOptions } from './uniform'
import { Camera, type CameraOptions } from './camera'
import { select, LogMethods } from './utils'
import { Transform } from './transform'

export interface StageOptions {
	canvas?: HTMLCanvasElement | QuerySelector
	container?: HTMLElement | QuerySelector
	autoInit?: boolean
	vertex?: string
	fragment?: string
	depth?: number
	camera?: CameraOptions
	geometries?: GeometryOptions[]
	uniforms?: UniformOptions[]
}

@LogMethods('Stage')
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
uniform mat4 u_matrix;
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
	fragColor = vec4(v_uv, (v_uv.y + v_uv.x) * 0.5, 1.0);
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

		if (options?.autoInit ?? true) {
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
			identity: () =>
				Transform.projection(this.canvas.width, this.canvas.height, this.opts.depth ?? 400),
		})

		this._createDefaultUniforms()

		if (this.opts?.uniforms) {
			for (const uniform of this.opts.uniforms) {
				this.addUniform(uniform)
			}
		}

		//* Setup Geometries

		if (this.opts?.geometries) {
			for (const geometry of this.opts.geometries) {
				this.addGeometry(geometry)
			}
		}

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

		if (uniformOrOptions instanceof Uniform) {
			this.uniforms.set(uniformOrOptions.name, uniformOrOptions)
		} else {
			this.uniforms.set(
				uniformOrOptions.name,
				new Uniform(this.gl, this.program, uniformOrOptions),
			)
		}
	}

	addGeometry(options: GeometryOptions): Geometry {
		if (!this.gl) throw new Error('WebGL2 context not found')
		if (!this.program) throw new Error('Program not found')

		const geometry = new Geometry(this.gl, this.program, options)
		this.geometries.set(options.name, geometry)
		return geometry
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
			type: 'mat4',
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

		this.gl.attachShader(program, this.vertexShader!)
		this.gl.attachShader(program, this.fragmentShader!)
		this.gl.linkProgram(program)

		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			throw new Error('❌ Failed to link program', {
				cause: this.gl.getProgramInfoLog(program),
			})
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
		if (!shader) throw new Error('❌ Failed to create shader', { cause: { source, type } })
		this.gl.shaderSource(shader, source)
		this.gl.compileShader(shader)

		const message = this.gl.getShaderInfoLog(shader)
		const status = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)
		if (!status || message?.length) {
			console.error(
				`❌ Failed to compile ${type == this.gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader`,
			)
			throw new Error(message ?? 'Unknown error...', { cause: { source, type } })
		}

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
