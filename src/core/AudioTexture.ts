// import type { TextureOptions } from './Texture'
// import type { AudioOptions } from './Audio'
// import type { Stage } from './Stage'

// import { Texture } from './Texture'
// import { Audio } from './Audio'

// export interface AudioTextureOptions {
// 	audio?: Partial<AudioOptions>
// 	texture?: Partial<TextureOptions>
// 	autoInit?: boolean
// }

// export class AudioTexture {
// 	audio!: Audio
// 	texture!: Texture
// 	opts: Partial<AudioTextureOptions>
// 	initialized = false

// 	constructor(
// 		public stage: Stage,
// 		options?: Partial<AudioTextureOptions>,
// 	) {
// 		this.opts = options ?? { audio: {}, texture: {} }

// 		if (options?.autoInit ?? true) this.init()
// 	}

// 	get data(): Float32Array {
// 		return this.audio.dataArray
// 	}

// 	get length(): number {
// 		return this.audio.dataArray.length
// 	}

// 	async init(): Promise<void> {
// 		if (this.initialized) return
// 		console.log('AudioTexture init()')
// 		console.log('◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼️◼')
		
// 		try {
// 			this.audio = new Audio(this.opts.audio)
// 			this.audio.init()
	
// 			// const textureSize = Math.pow(2, Math.ceil(Math.log2(Math.sqrt(this.audio.dataArray.length))))
// 			// const textureSize = this.audio.dataArray.length
// 			// const textureSize = Math.ceil(Math.sqrt(this.length))
// 			// const audioTexture = new Float32Array(textureSize * textureSize)

// 			const textureSize = this.length
// 			console.log('textureSize:', textureSize)
	
// 			this.texture = new Texture(this.stage, {
// 				name: this.opts.texture?.name ?? 'u_audioData',
// 				data: this.data,
// 				size: textureSize,
// 				type: 'FLOAT',
// 				format: 'RED',
// 				internalFormat: 'R32F',
// 				minFilter: 'NEAREST',
// 				magFilter: 'NEAREST',
// 				wrapS: 'CLAMP_TO_EDGE',
// 				wrapT: 'CLAMP_TO_EDGE',
// 			})
	
// 			this.texture.init()
// 			this.initialized = true
// 			console.log('AudioTexture initialized successfully')
// 		} catch (error) {
// 			console.error('Error initializing AudioTexture:', error)
// 			throw error
// 		}
// 	}

// 	update(): void {
// 		this.texture.data.set(this.audio.update())
// 		this.texture.update()
// 	}
// }
