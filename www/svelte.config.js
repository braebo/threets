import { sveltePreprocess } from 'svelte-preprocess'
import mdsvexConfig from './mdsvex.config.js'
import adapter from '@sveltejs/adapter-auto'
import { mdsvex } from 'mdsvex'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', ...mdsvexConfig.extensions],
	preprocess: [sveltePreprocess(), mdsvex(mdsvexConfig)],
	kit: { adapter: adapter() },
	vitePlugin: {
		inspector: {
			toggleButtonPos: 'bottom-left',
			toggleKeyCombo: 'control-alt',
			showToggleButton: 'active',
			holdMode: true,
		},
	},
}

export default config
