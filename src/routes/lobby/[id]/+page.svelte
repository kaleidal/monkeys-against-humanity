<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { useConvexClient } from 'convex-svelte';
	import Slider from '../../../components/Slider.svelte';
	import Toggle from '../../../components/Toggle.svelte';
	import Intermission from '../../_components/Intermission.svelte';
	import { api } from '$lib/convexApi';
	import { getGuestSession } from '$lib/auth';
	import { getDisplayError } from '$lib/errors';
	import { getPackBackground, packs } from '$lib/packs';
	import type { PageData } from './$types';

	export let data: PageData;
	const convex: any = useConvexClient();
	const lobbyId = data.lobbyId;
	const guest = lobbyId ? getGuestSession(lobbyId) : null;
	const queryArgs = {
		lobbyId: lobbyId as any,
		guestId: guest?.guestId,
		guestSecret: guest?.guestSecret
	};

	let maxPlayers = 6;
	let maxRounds = 8;
	let allowAnonymous = true;
	let selectedPacks: string[] = [];
	let stateData: any = null;
	let stateError: Error | null = null;
	let pageLoading = true;
	let dirty = false;
	let saving = false;
	let error = '';
	let autosaveHandle: ReturnType<typeof setTimeout> | null = null;
	let didHydrateHostSettings = false;
	let lastSavedSettings = '';

	onMount(() => {
		let unsubscribe: (() => void) | undefined;
		let active = true;

		async function connect() {
			pageLoading = true;
			stateError = null;

			try {
				const initial = await convex.query(api.games.getLobbyState, queryArgs);
				if (!active) return;
				stateData = initial;
				pageLoading = false;

				unsubscribe = convex.onUpdate(
					api.games.getLobbyState,
					queryArgs,
					(next: any) => {
						if (!active) return;
						stateData = next;
						stateError = null;
						pageLoading = false;
					},
					(nextError: Error) => {
						if (!active) return;
						stateError = nextError;
						pageLoading = false;
					}
				);
			} catch (nextError) {
				if (!active) return;
				stateError = new Error(getDisplayError(nextError, 'Could not load lobby'));
				pageLoading = false;
			}
		}

		connect();

		return () => {
			active = false;
			unsubscribe?.();
		};
	});

	onDestroy(() => {
		if (autosaveHandle) {
			clearTimeout(autosaveHandle);
		}
	});

	function serializeSettings(playersValue: number, roundsValue: number, anonymousValue: boolean, packsValue: string[]) {
		return JSON.stringify({
			maxPlayers: playersValue,
			maxRounds: roundsValue,
			allowAnonymous: anonymousValue,
			cardPacks: packsValue
		});
	}

	function applyLobbySettings(lobby: any) {
		maxPlayers = lobby.maxPlayers;
		maxRounds = lobby.maxRounds;
		allowAnonymous = lobby.allowAnonymous;
		selectedPacks = [...lobby.cardPacks];
	}

	$: if (stateData?.lobby && !isHost) {
		applyLobbySettings(stateData.lobby);
	}

	$: if (stateData?.lobby && isHost && !didHydrateHostSettings) {
		applyLobbySettings(stateData.lobby);
		lastSavedSettings = serializeSettings(
			stateData.lobby.maxPlayers,
			stateData.lobby.maxRounds,
			stateData.lobby.allowAnonymous,
			stateData.lobby.cardPacks
		);
		didHydrateHostSettings = true;
	}

	$: if (stateData?.lobby?.status === 'in_game') {
		goto(`/game/${lobbyId}`);
	}

	$: isHost = Boolean(stateData?.viewer?.isHost);

	function togglePack(key: string) {
		dirty = true;
		selectedPacks = selectedPacks.includes(key)
			? selectedPacks.filter((pack) => pack !== key)
			: [...selectedPacks, key];
	}

	function queueAutosave() {
		if (!isHost || !dirty) return;
		if (autosaveHandle) clearTimeout(autosaveHandle);
		autosaveHandle = setTimeout(() => {
			autosaveHandle = null;
			void saveSettings();
		}, 250);
	}

	async function saveSettings() {
		if (!isHost) return;
		saving = true;
		error = '';

		try {
			await convex.mutation(api.games.updateLobbySettings, {
				lobbyId,
				maxPlayers,
				maxRounds,
				allowAnonymous,
				cardPacks: selectedPacks
			});
			lastSavedSettings = serializeSettings(maxPlayers, maxRounds, allowAnonymous, selectedPacks);
			dirty = false;
		} catch (err) {
			error = getDisplayError(err, 'Could not save settings');
		} finally {
			saving = false;
		}
	}

	$: currentSettings = serializeSettings(maxPlayers, maxRounds, allowAnonymous, selectedPacks);

	$: if (isHost && didHydrateHostSettings && !saving && currentSettings !== lastSavedSettings) {
		dirty = true;
		queueAutosave();
	}

	$: if (isHost && didHydrateHostSettings && !saving && currentSettings === lastSavedSettings) {
		dirty = false;
	}

	async function startGame() {
		try {
			error = '';
			await convex.mutation(api.games.startGame, { lobbyId });
		} catch (err) {
			error = getDisplayError(err, 'Could not start game');
		}
	}
</script>

{#if pageLoading}
	<Intermission />
{:else if stateError || !stateData}
	<div class="min-h-screen bg-black flex items-center justify-center p-10">
		<div class="bg-[#141414] p-10 text-white font-poppins">
			{stateError?.message || 'Lobby not found'}
		</div>
	</div>
{:else}
	<div class="relative min-h-screen bg-black p-[6vw] md:p-[80px] text-white overflow-hidden">
		{#if !isHost}
			<img src="/illustrations/monsters_lobby_stare.png" alt="Lobby Monsters" class="hidden md:block absolute top-0 left-0 pointer-events-none select-none max-w-[24vw]" />
			<img src="/illustrations/monsters_lobby_write.svg" alt="Lobby Monsters" class="hidden md:block absolute bottom-[8vh] left-0 pointer-events-none select-none max-w-[30vw]" />
		{/if}

		<div class="flex flex-col md:flex-row gap-6 md:gap-8 {isHost ? 'justify-center items-start' : 'justify-end items-end'} min-h-[calc(100vh-12vw)] md:min-h-[calc(100vh-160px)]">
			{#if isHost}
				<section class="flex flex-col gap-[24px] md:gap-[40px] w-full md:w-[30vw] md:h-[85vh]">
					<div class="flex flex-col gap-[40px] md:gap-[80px] bg-neutral-900 p-[24px] md:p-[60px] flex-1 justify-between">
						<div class="flex flex-col gap-[10px]">
							<h1 class="text-[24px] md:text-[32px] font-normal font-poppins">players</h1>
							<Slider min={3} max={10} step={1} bind:value={maxPlayers} />
						</div>

						<div class="flex flex-col gap-[10px]">
							<h1 class="text-[24px] md:text-[32px] font-normal font-poppins">rounds</h1>
							<Slider min={4} max={24} step={4} bind:value={maxRounds} />
						</div>

						<div class="flex flex-col gap-6 bg-[#282828] px-[20px] md:px-[40px] py-[20px] md:py-[30px]">
							<div class="flex items-start justify-between gap-6">
								<h2 class="text-[24px] md:text-[32px] font-normal font-poppins">anonymous players</h2>
								<Toggle bind:checked={allowAnonymous} />
							</div>
						</div>

						<div class="flex w-full flex-col gap-[10px] items-center justify-center bg-[#282828] px-[20px] md:px-[40px] py-[14px] md:py-[20px]">
							<h1 class="text-xl md:text-2xl font-normal font-poppins">lobby code</h1>
							<div class="flex flex-row gap-[10px] items-center">
								<h1 class="text-[28px] md:text-[36px] text-[#E1FF00] font-medium font-poppins">
									{stateData.lobby.code}
								</h1>
								<button
									aria-label="copy"
									class="cursor-pointer text-[#E1FF00] flex items-center justify-center w-[22px] h-[22px] md:w-[28px] md:h-[28px]"
									on:click={() => navigator.clipboard.writeText(stateData.lobby.code)}
								>
									<svg viewBox="0 0 24 24" fill="none" class="w-full h-full" aria-hidden="true">
										<path
											d="M9 9H6.75C5.7835 9 5 9.7835 5 10.75V17.25C5 18.2165 5.7835 19 6.75 19H13.25C14.2165 19 15 18.2165 15 17.25V15"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="square"
										/>
										<path
											d="M10.75 5H17.25C18.2165 5 19 5.7835 19 6.75V13.25C19 14.2165 18.2165 15 17.25 15H10.75C9.7835 15 9 14.2165 9 13.25V6.75C9 5.7835 9.7835 5 10.75 5Z"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="square"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>

					{#if error}
						<p class="text-red-400 font-poppins">{error}</p>
					{/if}
				</section>
			{/if}

			<section class="flex flex-col gap-4 bg-neutral-900 p-[24px] md:p-[60px] py-[24px] md:py-[50px] w-full md:w-[43vw] h-[50vh] md:h-[85vh] overflow-visible z-10">
				<h1 class="text-[24px] md:text-[32px] font-normal font-poppins">card packs</h1>

				<div class="flex flex-wrap content-start gap-[12px] overflow-y-auto overflow-x-visible scroll-smooth hide-scrollbar px-[6px] py-[6px]">
					{#each packs as pack}
						<button
							class="flex h-[180px] md:h-[220px] w-[calc(50%-6px)] flex-none flex-col items-center justify-center cursor-pointer relative overflow-hidden outline-none focus:outline-none {selectedPacks.includes(pack.key) ? 'ring-4 ring-[#E1FF00]' : 'ring-0'}"
							style="background-image: url('{getPackBackground(pack.key)}'); background-size: cover; background-position: center;"
							on:click={() => stateData.viewer?.isHost && togglePack(pack.key)}
							disabled={!stateData.viewer?.isHost}
						>
							<div class="absolute inset-0 bg-black/50"></div>
							<h1 class="relative z-10 text-[26px] md:text-[40px] font-bold font-poppins text-white text-center px-4">
								{pack.name}
							</h1>
						</button>
					{/each}
				</div>
			</section>

			<section class="flex flex-col gap-4 w-full md:w-[27vw] md:h-[85vh] z-10">
				<div class="flex flex-col gap-4 bg-neutral-900 p-[24px] md:p-[40px] flex-1 min-h-[50vh] md:min-h-0 overflow-hidden">
					<h1 class="text-[24px] md:text-[32px] font-normal font-poppins">joined players</h1>
					<div class="flex flex-col gap-4 overflow-y-auto min-h-0 hide-scrollbar">
						{#each stateData.players as player}
							<div class="flex flex-row justify-between items-center bg-[#282828] px-[18px] md:px-[25px] py-[12px] md:py-[15px]">
								<div class="flex items-center gap-3">
									<h1 class="text-xl md:text-2xl font-normal font-poppins">{player.username}</h1>
									{#if player.isAnonymous}
										<span class="text-[#A0A0A0] text-sm">guest</span>
									{/if}
								</div>
								{#if player.isHost}
									<img src="/icons/crown.svg" alt="host crown" class="w-[20px] h-[20px] md:w-[24px] md:h-[24px] pointer-events-none select-none" />
								{/if}
							</div>
						{/each}
					</div>
				</div>

				{#if isHost}
					<div class="flex flex-col gap-3 w-full">
						<button
							type="button"
							class="bg-[#E1FF00] px-[40px] md:px-[60px] py-[14px] md:py-[20px] cursor-pointer hover:rounded-full text-black font-poppins text-[40px] md:text-[56px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out"
							on:click={startGame}
						>
							start game
						</button>
					</div>
				{/if}
			</section>
		</div>
	</div>
{/if}
