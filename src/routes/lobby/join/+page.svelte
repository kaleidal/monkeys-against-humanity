<script lang="ts">
	import { goto } from '$app/navigation';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/convexApi';
	import { getDisplayError } from '$lib/errors';
	import { createGuestSession, currentUser, saveGuestSession, signIn } from '$lib/auth';
	import { t } from '$lib/i18n';

	const convex = useConvexClient();

	let code = '';
	let guestName = '';
	let loading = false;
	let error = '';

	function formatCode(value: string) {
		const raw = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
		return raw.length <= 3 ? raw : `${raw.slice(0, 3)}-${raw.slice(3)}`;
	}

	async function joinLobby() {
		error = '';
		code = formatCode(code);

		if (code.length !== 7) {
			error = $t('joinInvalidCode');
			return;
		}

		loading = true;

		try {
			const guest = !$currentUser
				? createGuestSession(guestName.trim() || 'Player')
				: null;

			const lobbyId = await convex.mutation(api.games.joinLobby, {
				code,
				guestId: guest?.guestId,
				guestSecret: guest?.guestSecret,
				guestName: guest?.name
			});

			if (guest) {
				saveGuestSession(code, guest);
				saveGuestSession(lobbyId, guest);
			}

			await goto(`/lobby/${lobbyId}`);
		} catch (err) {
			error = getDisplayError(err, $t('joinCouldNotJoin'));
		} finally {
			loading = false;
		}
	}

	async function goToSignIn() {
		await signIn('/lobby/join');
	}
</script>

<div class="bg-[#090909] min-h-screen w-full overflow-hidden select-none flex items-center justify-center p-[6vw] md:p-[40px]">
	<img src="/illustrations/monsters_join_bottom.svg" alt="Join Monster" class="hidden md:block absolute bottom-0 left-0 pointer-events-none max-w-[40vw]" />
	<img src="/illustrations/monsters_join_top.svg" alt="Join Monster" class="hidden md:block absolute top-0 right-0 pointer-events-none max-w-[40vw]" />

	<div class="bg-[#141414] md:rotate-[5deg] w-[92vw] md:w-fit h-fit flex flex-col gap-[24px] md:gap-[32px] justify-center items-center p-[6vw] md:p-[48px]">
		<h1 class="font-medium text-[40px] md:text-[52px] text-white font-poppins">{$t('joinTitle')}</h1>
		<input
			type="text"
			placeholder={$t('joinCodePlaceholder')}
			class="bg-[#1E1E1E] font-poppins w-full md:min-w-[520px] px-[20px] md:px-[40px] py-[16px] md:py-[20px] text-white text-[24px] md:text-[36px] focus:outline-none"
			bind:value={code}
			on:input={(event) => (code = formatCode((event.currentTarget as HTMLInputElement).value))}
		/>

		{#if !$currentUser}
			<input
				type="text"
				placeholder={$t('joinNicknamePlaceholder')}
				class="bg-[#1E1E1E] font-poppins w-full md:min-w-[520px] px-[20px] md:px-[40px] py-[16px] md:py-[20px] text-white text-[18px] md:text-[28px] focus:outline-none"
				bind:value={guestName}
			/>
		{/if}

		{#if error}
			<div class="text-red-400 font-poppins text-[14px] md:text-[18px] -mt-2 md:-mt-6">{error}</div>
		{/if}

		<button
			class="bg-[#E1FF00] px-[40px] md:px-[72px] py-[14px] md:py-[16px] cursor-pointer hover:rounded-full text-black font-poppins text-[40px] md:text-[48px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out disabled:opacity-60"
			on:click={joinLobby}
			disabled={loading}
		>
			{loading ? $t('joinJoining') : $t('joinLobby')}
		</button>

		{#if !$currentUser}
			<button
				class="font-poppins text-[#A0FF11] text-[16px] md:text-[36px] underline underline-offset-4 cursor-pointer"
				on:click={goToSignIn}
			>
				{$t('joinSignInInstead')}
			</button>
		{:else}
			<p class="font-poppins text-[#A0FF11] text-[16px] md:text-[28px]">
				{$t('joinLoggedInAs', { name: $currentUser.displayName || $currentUser.handle || $currentUser.id })}
			</p>
		{/if}
	</div>
</div>
