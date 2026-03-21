<script lang="ts">
	import { goto } from '$app/navigation';
	import { useConvexClient } from 'convex-svelte';
	import Slider from '../../../components/Slider.svelte';
	import Toggle from '../../../components/Toggle.svelte';
	import { packs, getPackBackground } from '$lib/packs';
	import { api } from '$lib/convexApi';
	import { getDisplayError } from '$lib/errors';
	import { currentUser, signIn } from '$lib/auth';
	import { t } from '$lib/i18n';

	const convex = useConvexClient();

	let maxPlayers = 6;
	let maxRounds = 8;
	let allowAnonymous = true;
	let selectedPacks = [packs[0]?.key, packs[1]?.key].filter(Boolean);
	let search = '';
	let loading = false;
	let error = '';

	$: filteredPacks = packs.filter((pack) =>
		pack.name.toLowerCase().includes(search.trim().toLowerCase())
	);

	function togglePack(key: string) {
		if (selectedPacks.includes(key)) {
			selectedPacks = selectedPacks.filter((pack) => pack !== key);
			return;
		}

		selectedPacks = [...selectedPacks, key];
	}

	async function createLobby() {
		if (!$currentUser) {
			await signIn('/lobby/create');
			return;
		}

		if (selectedPacks.length === 0) {
			error = $t('createPickAtLeastOnePack');
			return;
		}

		loading = true;
		error = '';

		try {
			const lobbyId = await convex.mutation(api.games.createLobby, {
				maxPlayers,
				maxRounds,
				allowAnonymous,
				cardPacks: selectedPacks
			});

			await goto(`/lobby/${lobbyId}`);
		} catch (err) {
			error = getDisplayError(err, $t('createCouldNotCreateLobby'));
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-black p-[6vw] md:p-[40px] text-white">
	<div class="mx-auto flex w-full max-w-[1300px] flex-col gap-6 md:h-[calc(100vh-80px)] md:flex-row md:items-stretch md:justify-center md:gap-6">
	<section class="flex w-full flex-col gap-[20px] md:w-[clamp(300px,28vw,440px)] md:h-full">
		<div class="flex flex-col gap-[28px] md:gap-[40px] bg-neutral-900 p-[24px] md:p-[36px] w-full flex-1 justify-between">
			<div class="flex flex-col gap-[10px]">
				<h1 class="text-[24px] md:text-[32px] font-normal font-poppins">{$t('createPlayers')}</h1>
				<Slider min={3} max={10} step={1} bind:value={maxPlayers} />
			</div>

			<div class="flex flex-col gap-[10px]">
				<h1 class="text-[24px] md:text-[32px] font-normal font-poppins">{$t('createRounds')}</h1>
				<Slider min={4} max={24} step={4} bind:value={maxRounds} />
			</div>

			<div class="flex flex-col gap-6 bg-[#282828] px-[20px] md:px-[40px] py-[20px] md:py-[30px]">
				<div class="flex items-start justify-between gap-6">
					<div>
						<h2 class="text-[24px] md:text-[28px] font-normal font-poppins">{$t('createAnonymousPlayers')}</h2>
					</div>
					<Toggle bind:checked={allowAnonymous} />
				</div>
			</div>
		</div>

		<button
			type="button"
			class="bg-[#E1FF00] px-[40px] md:px-[64px] py-[14px] md:py-[16px] cursor-pointer hover:rounded-full text-black font-poppins text-[40px] md:text-[44px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out disabled:opacity-60"
			on:click={createLobby}
			disabled={loading}
		>
			{loading ? $t('createOpening') : $currentUser ? $t('createOpenLobby') : $t('createSignIn')}
		</button>

		{#if error}
			<p class="text-red-400 font-poppins text-[18px]">{error}</p>
		{/if}
	</section>

	<section class="flex flex-col gap-4 bg-neutral-900 p-[24px] md:p-[36px] py-[24px] md:py-[36px] w-full md:w-[clamp(460px,42vw,700px)] h-[50vh] md:h-full overflow-hidden">
		<h1 class="text-[24px] md:text-[32px] font-normal font-poppins">{$t('createCardPacks')}</h1>
		<input
			type="text"
			placeholder={$t('createSearchPacks')}
			class="bg-[#1E1E1E] font-poppins w-full px-[16px] md:px-[20px] py-[12px] md:py-[15px] text-white text-[18px] md:text-[24px] focus:outline-none"
			bind:value={search}
		/>

		<div class="flex flex-wrap content-start gap-[12px] overflow-y-auto overflow-x-hidden scroll-smooth hide-scrollbar px-[6px] py-[6px] min-h-0">
			{#each filteredPacks as pack}
				<button
					class="flex h-[180px] md:h-[190px] w-[calc(50%-6px)] flex-none flex-col items-center justify-center cursor-pointer relative overflow-hidden outline-none focus:outline-none {selectedPacks.includes(pack.key) ? 'ring-4 ring-[#E1FF00]' : 'ring-0'}"
					style="background-image: url('{getPackBackground(pack.key)}'); background-size: cover; background-position: center;"
					on:click={() => togglePack(pack.key)}
				>
					<div class="absolute inset-0 bg-black/50"></div>
					<h1 class="relative z-10 text-[26px] md:text-[34px] font-bold font-poppins text-white text-center px-4">
						{pack.name}
					</h1>
				</button>
			{/each}
		</div>
	</section>
</div>
</div>
