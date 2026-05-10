<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { completeSignIn } from '$lib/auth';
	import { getDisplayError } from '$lib/errors';
	import { t } from '$lib/i18n';
	import Intermission from '../../_components/Intermission.svelte';

	let error = '';

	onMount(async () => {
		try {
			await completeSignIn();
		} catch (err) {
			error = getDisplayError(err, $t('authSignInFailedFallback'));
			setTimeout(() => {
				goto('/');
			}, 2000);
		}
	});
</script>

{#if error}
	<div class="min-h-screen bg-[#090909] flex items-center justify-center p-10">
		<div class="bg-[#141414] p-10 text-center text-white font-poppins">
			<h1 class="text-[36px] mb-3">{$t('authSignInFailed')}</h1>
			<p class="text-[#B5B5B5]">{error}</p>
		</div>
	</div>
{:else}
	<Intermission />
{/if}
