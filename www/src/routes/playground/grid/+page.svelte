<script lang="ts">
	import type { Stage } from 'threets'
	import type {
		// WASDController,
		OrbitController,
	} from 'threets'

	import { gridScene } from '$lib/scenes/grid-scene'
	import { onDestroy, onMount } from 'svelte'

	import {
		// type BundledLanguage,
		// type BundledTheme,
		type Highlighter,
		codeToHtml,
		getHighlighter,
		type BundledTheme,
	} from 'shiki/bundle/web'

	// `getHighlighter` is async, it initializes the internal and
	// loads the themes and languages specified.

	let stage: Stage
	// let controller: WASDController
	let controller: OrbitController

	let highlighter: Highlighter
	const lang = 'json'
	const theme: BundledTheme = 'poimandres'

	let listener = ''
	let cameraMatrix = ''

	onMount(async () => {
		highlighter ??= await getHighlighter({
			themes: [theme],
			langs: [lang],
		})

		const scene = await gridScene('#scene')
		stage = scene.stage
		controller = scene.controller

		let i = 0
		stage.onUpdate(async () => {
			i++
			if (i !== 1 && i % 50 !== 0) {
				return
			}
			codeToHtml(
				`\nController ` +
					prettyPrint(
						{
						...controller,
						eventTarget: undefined,
						stage: undefined,
						// 	// state: controller.state,
						// 	active: controller.active,
						// 	//// @ts-expect-error
						// 	// moves: controller.moves,
						// 	speed: controller.speed,
						// 	target: controller.target,
						// 	position: controller._position,
						}
					),
				{ lang, theme },
			).then((html) => (listener = html))

			codeToHtml(`\nCamera ` + prettyPrint(stage.camera), {
				lang,
				theme,
			}).then((html) => (cameraMatrix = html))
		})

		// setTimeout(() => {
		// 	console.clear()
		// }, 10)
	})

	onDestroy(() => {
		globalThis.window?.location.reload()
	})

	const prettyPrint = (data: any) => JSON.stringify(data, null, 2).replaceAll(/"/g, '')

	let i = 0
	function increment(_node: Element) {
		i++
	}
</script>

{#if stage}
	<button
		on:click={() => {
			console.log('foo')
			stage.camera.transform.position.setX(10)
			stage.camera.transform.update()
			stage.render()
		}}>x = 10</button
	>
{/if}

<canvas id="scene" />

<div class="debug-data-container">
	<div class="debug-data">
		{#key listener}
			<div class="count" use:increment>{i}</div>
			{@html listener}
		{/key}
	</div>

	<div class="debug-data">
		{#key cameraMatrix}
			{@html cameraMatrix}
		{/key}
	</div>
</div>

<div class="buttons">
	<button on:click={() => console.log(stage)}>log(stage)</button>
</div>

<style lang="scss">
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
		position: absolute;
		top: 1rem;
		left: 4.5rem;
	}
	.debug-data {
		:global(*) {
			font-size: .8rem;
		}
		
		position: relative;
		width: 13rem;
		// height: 20rem;
		margin: 1rem auto;
		color: var(--light-a);

		:global(:first-child) {
			padding: 1.5rem 0.5rem;
			border-radius: 0.5rem;
		}
	}

	.count {
		position: absolute;
		top: -0.9rem;
		right: 0.25rem;
	}

	canvas {
		width: 90%;
		border-radius: 1rem;
		margin: 1rem auto;
	}
</style>
