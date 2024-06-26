<script lang="ts">
	import type { WASDController, OrbitController } from 'threets'
	import type { Stage } from 'threets'

	import { gridScene } from '$lib/scenes/grid2-scene'
	import { onDestroy, onMount } from 'svelte'

	import {
		type BundledTheme,
		type Highlighter,
		codeToHtml,
		getSingletonHighlighter,
	} from 'shiki/bundle/web'

	// `getHighlighter` is async, it initializes the internal and
	// loads the themes and languages specified.

	let stage: Stage
	let wasd_controller: WASDController
	let orbit_controller: OrbitController

	let highlighter: Highlighter
	const lang = 'json'
	const theme: BundledTheme = 'poimandres'

	// let wasd_debug = ''
	// let orbit_debug = ''
	// let cameraMatrix = ''

	let _grid = {} as any

	onMount(async () => {
		highlighter ??= await getSingletonHighlighter({
			themes: [theme],
			langs: [lang],
		})

		const { stage, grid } = await gridScene('#scene')
		// _grid = grid
		orbit_controller = stage.camera.controllers.orbit!
		wasd_controller = stage.camera.controllers.wasd!

		function getKeys<T extends Record<string, any>, K extends keyof T>(
			obj: T,
			keys: Array<K | (string & {})>,
			title = '',
		) {
			const str = prettyPrint(
				keys.reduce(
					(acc, key) => {
						// @ts-expect-error
						acc[key] = obj[key]
						return acc
					},
					{} as Pick<T, K>,
				),
			)

			return title ? `\n${title} ` + str : str
		}

		let i = 0
		stage.onUpdate(async () => {
			i++
			if (i !== 1 && i % 50 !== 0) {
				return
			}

			// codeToHtml(
			// 	getKeys(orbit_controller, ['active', 'position', 'target'], 'Orbit Controller'),
			// 	{ lang, theme },
			// ).then((html) => (orbit_debug = html))

			// codeToHtml(
			// 	getKeys(wasd_controller, ['active', 'moves', 'position', 'rotation'], 'WASD Controller'),
			// 	{ lang, theme },
			// ).then((html) => (wasd_debug = html))

			// codeToHtml(
			// 	getKeys(stage.camera, ['position', 'rotation', 'fov', 'near', 'far'], 'Camera'),
			// 	{ lang, theme },
			// ).then((html) => (cameraMatrix = html))

			codeToHtml(getKeys(grid.geometry, ['buffer'], 'Grid'), { lang, theme }).then(
				(html) => (_grid = html),
			)
		})
	})

	onDestroy(() => {
		globalThis.window?.location.reload()
	})

	function prettyPrint(data: any) {
		return JSON.stringify(data, null, 2).replaceAll(/"/g, '')
	}
</script>

<section class="page">
	{#if stage}
		<button
			on:click={() => {
				console.log('foo')
				stage.camera.position.x = 10
				stage.camera.update()
				stage.render()
			}}>x = 10</button
		>
	{/if}

	<canvas id="scene" />

	<div class="debug-data-container">
		<div class="debug-data">
			{#key _grid}
				{@html _grid}
			{/key}
		</div>

		<!-- <div class="debug-data">
		{#key wasd_controller}
			<div class="count" use:increment>{i}</div>
			{@html wasd_debug}
		{/key}
	</div> -->
		<!-- <div class="debug-data">
		{#key orbit_controller}
			{@html orbit_debug}
		{/key}
	</div> -->
		<!-- <div class="debug-data">
		{#key cameraMatrix}
			{@html cameraMatrix}
		{/key}
	</div> -->
	</div>

	<div class="buttons">
		<button on:click={() => console.log(stage)}>log(stage)</button>
	</div>
</section>

<style lang="scss">
	:global(body),
	:global(html),
	:global(#app),
	:global(#svelte),
	.page {
		max-height: 100vh;
		overflow: hidden;
	}

	.buttons {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 1rem;

		width: fit-content;
		margin: 1rem;
		margin-top: auto;
	}

	button {
		background: var(--dark-a);
		color: var(--light-d);
		border: 1px solid var(--bg-d);
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		margin: 0.5rem auto;
	}

	.debug-data-container {
		display: flex;
		flex-direction: column;
		position: absolute;
		top: 1rem;
		left: 4.5rem;
	}
	.debug-data {
		:global(*) {
			font-size: 0.8rem;
		}

		position: relative;
		width: 13rem;
		// height: 20rem;
		margin: 1rem auto;
		color: var(--light-a);

		:global(:first-child) {
			// padding: 1.5rem 0.5rem;
			border-radius: 0.5rem;
		}
	}

	// .count {
	// 	position: absolute;
	// 	top: -0.9rem;
	// 	right: 0.25rem;
	// }

	canvas {
		width: 90%;
		border-radius: 1rem;
		margin: 1rem auto;
		outline: 1px solid var(--bg-d);
	}
</style>
