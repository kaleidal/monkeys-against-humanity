<script lang="ts">
	import { language } from '$lib/i18n';

	const options = [
		{ value: 'en', label: 'English' },
		{ value: 'sq', label: 'Shqip' },
		{ value: 'hr', label: 'Hrvatski' },
		{ value: 'de', label: 'Deutsch' }
	] as const;
</script>

<div class="fixed top-3 right-3 z-[1000]">
	<select
		class="bg-[#1E1E1E] border border-[#3B3B3B] text-white text-sm font-poppins px-3 py-2 focus:outline-none"
		bind:value={$language}
		aria-label="Language"
	>
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</div>
