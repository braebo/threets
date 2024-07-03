export interface AudioOptions {
	/**
	 * @default 1024
	 */
	fftSize: number
	/**
	 * @default 0.8
	 */
	smoothingTimeConstant: number
	/**
	 * Whether to automatically initialize the audio context.  You'll usually need to call
	 * {@link Audio.init} manually in response to a user gesture per browser policy.
	 * @default false
	 */
	autoInit?: boolean
}

export class Audio {
	initialized = false

	ctx!: AudioContext
	analyser!: AnalyserNode
	dataArray!: Float32Array

	stream?: MediaStreamAudioSourceNode

	private _fftSize: number
	private _smoothingConstant: number

	constructor(options?: Partial<AudioOptions>) {
		this._fftSize = options?.fftSize ?? 1024
		this._smoothingConstant = options?.smoothingTimeConstant ?? 0.8
		if (options?.autoInit) this.init()
	}

	init() {
		if (this.initialized) return
		this.initialized = true

		console.log('Audio init()')
		console.log('◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼')

		this.ctx = new AudioContext()
		this.analyser = new AnalyserNode(this.ctx, {
			fftSize: this._fftSize,
			smoothingTimeConstant: this._smoothingConstant,
		})
		this.dataArray = new Float32Array(this.analyser.frequencyBinCount)

		globalThis.window.addEventListener(
			'click',
			() => {
				if (this.ctx.state === 'suspended') this.ctx.resume()
			},
			{ once: true },
		)
	}

	get fftSize() {
		return this._fftSize
	}
	set fftSize(value: number) {
		this._fftSize = value
		this.analyser.fftSize = value
	}

	get smoothingTimeConstant() {
		return this._smoothingConstant
	}
	set smoothingTimeConstant(value: number) {
		this._smoothingConstant = value
		this.analyser.smoothingTimeConstant = value
	}

	async useMicrophone(): Promise<void> {
		if (this.stream) return
		if (!globalThis.navigator.mediaDevices) throw new Error('getUserMedia support not detected')
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		this.stream = this.ctx.createMediaStreamSource(stream)
		this.stream.connect(this.analyser)
	}

	update(): Float32Array {
		this.analyser.getFloatFrequencyData(this.dataArray)
		return this.dataArray
	}

	dispose(): void {
		this.stream?.disconnect()
		this.analyser.disconnect()
		this.ctx.close()
		this.initialized = false
	}
}
