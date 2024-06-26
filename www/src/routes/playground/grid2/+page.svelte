<script lang="ts">
	import type { BundledTheme, Highlighter } from 'shiki/bundle/web'
	import type { WASDController } from 'threets'
	import type { Stage } from 'threets'

	import { codeToHtml, getSingletonHighlighter } from 'shiki/bundle/web'
	import { prettyPrintKeys } from '$lib/utils/prettyPrint'
	import { gridScene } from '$lib/scenes/grid2-scene'
	import { onDestroy, onMount } from 'svelte'

	let stage: Stage
	let wasd_controller: WASDController

	let highlighter: Highlighter
	const lang = 'json'
	const theme: BundledTheme = 'poimandres'

	let _grid = {} as any

	onMount(async () => {
		highlighter ??= await getSingletonHighlighter({
			themes: [theme],
			langs: [lang],
		})

		const { stage, grid } = await gridScene('#scene')

		wasd_controller = stage.camera.controllers.wasd!

		let i = 0
		stage.onUpdate(async () => {
			i++
			if (i !== 1 && i % 50 !== 0) {
				return
			}

			codeToHtml(prettyPrintKeys(grid.geometry, ['buffer'], 'Grid'), { lang, theme }).then(
				(html) => (_grid = html),
			)
		})
	})

	onDestroy(() => {
		globalThis.window?.location.reload()
	})
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
		position: absolute;
		bottom: 0;
		left: 1rem;

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
		padding: 0.5rem 1rem;
		margin: 0.5rem auto;

		background: var(--dark-a);
		color: var(--light-d);
		border: 1px solid var(--bg-d);
		border-radius: 0.5rem;

		font-family: var(--font-mono);
	}

	.debug-data-container {
		display: flex;
		justify-content: column;
		align-items: flex-end;

		position: absolute;
		top: 1rem;
		left: 2rem;

		height: calc(100% - 6rem);
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
		animation: fade-in 1s 0.5s forwards;
		opacity: 0;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
