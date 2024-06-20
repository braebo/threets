<script lang="ts">
	import type { Stage } from 'threets'

	import { basicScene } from '$lib/scenes/basic'
	import { onDestroy, onMount } from 'svelte'

	let stage: Stage

	onMount(async () => {
		stage = await basicScene('#scene')
	})

	onDestroy(() => {
		globalThis.window?.location.reload()
	})
</script>

<canvas id="scene" />

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
		background: var(--bg-a);
		color: var(--fg-d);
		border: 1px solid var(--bg-d);
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		margin: 0.5rem auto;
	}

	canvas {
		width: 90%;
		border-radius: 1rem;
		margin: 1rem auto;
		// prettier-ignore
		box-shadow:
			0 0.6rem 0.5rem #0001,
			0 0.3rem 1rem #0003,
			0 0.7rem 2rem #0002,
		;
	}
</style>
