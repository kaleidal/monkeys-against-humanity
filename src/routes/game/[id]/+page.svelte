<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { useConvexClient } from 'convex-svelte';
	import GameOver from './_components/GameOver.svelte';
	import PlayerChooseCard from './_components/PlayerChooseCard.svelte';
	import RoundReveal from './_components/RoundReveal.svelte';
	import TsarChooseCard from './_components/TsarChooseCard.svelte';
	import TsarJudge from './_components/TsarJudge.svelte';
	import TsarWaiting from './_components/TsarWaiting.svelte';
	import Intermission from '../../_components/Intermission.svelte';
	import { getGuestSession } from '$lib/auth';
	import { api } from '$lib/convexApi';
	import { getDisplayError } from '$lib/errors';
	import { t } from '$lib/i18n';
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

	let stateData: any = null;
	let stateError: Error | null = null;
	let pageLoading = true;

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
				stateError = new Error(getDisplayError(nextError, $t('gameCouldNotLoad')));
				pageLoading = false;
			}
		}

		connect();

		return () => {
			active = false;
			unsubscribe?.();
		};
	});

	$: round = stateData?.currentRound;
	$: viewer = stateData?.viewer;
	$: players = (stateData?.players || []) as any[];
	$: submissions = (stateData?.submissions || []) as any[];
	$: iAmTsar = Boolean(round && viewer?.playerId === round.tsarPlayerId);
	$: mySubmitted = Boolean(viewer?.playerId && submissions.some((item: any) => item.playerId === viewer.playerId));
	$: submittedIds = submissions.map((item: any) => item.playerId);
	$: tsarPlayer = players.find((player: any) => player.id === round?.tsarPlayerId);

	$: if (stateData?.lobby?.status === 'waiting') {
		goto(`/lobby/${lobbyId}`);
	}

	async function choosePrompt(prompt: string) {
		await convex.mutation(api.games.selectPrompt, {
			lobbyId,
			prompt,
			guestId: guest?.guestId,
			guestSecret: guest?.guestSecret
		});
	}

	async function submitAnswer(answer: string) {
		await convex.mutation(api.games.submitAnswer, {
			lobbyId,
			answer,
			guestId: guest?.guestId,
			guestSecret: guest?.guestSecret
		});
	}

	async function pickWinner(submissionId: string) {
		await convex.mutation(api.games.pickWinner, {
			lobbyId,
			submissionId,
			guestId: guest?.guestId,
			guestSecret: guest?.guestSecret
		});
	}

	async function nextRound() {
		await convex.mutation(api.games.advanceRound, {
			lobbyId,
			guestId: guest?.guestId,
			guestSecret: guest?.guestSecret
		});
	}
</script>

{#if pageLoading}
	<Intermission />
{:else if stateError || !stateData?.lobby}
	<div class="min-h-screen bg-black flex items-center justify-center p-10">
		<div class="bg-[#141414] p-10 text-white font-poppins">
			{stateError?.message || $t('gameNotFound')}
		</div>
	</div>
{:else if stateData.lobby.status === 'finished'}
	<GameOver />
{:else if !round}
	<Intermission />
{:else if round.status === 'tsar_select'}
	{#if iAmTsar}
		<TsarChooseCard packsKeys={stateData.lobby.cardPacks} onSelect={choosePrompt} />
	{:else}
		<div class="w-full h-screen flex flex-col justify-center items-center">
			<h1 class="text-[32px] font-normal text-white font-poppins text-center">
				{$t('gameTsarIsChoosing', { name: tsarPlayer?.username || $t('gameTsarDefaultName') })}
			</h1>
		</div>
	{/if}
{:else if round.status === 'submitting'}
	{#if iAmTsar}
		<TsarWaiting
			prompt={round.prompt || ''}
			players={players.map((player: any) => ({ username: player.username, user_id: player.id, score: player.score }))}
			tsarUuid={round.tsarPlayerId}
			submittedIds={submittedIds}
		/>
	{:else if mySubmitted}
		<div class="min-h-screen text-white bg-black flex flex-col items-center justify-center gap-3">
			<div class="text-[32px]">{$t('gameWaitingForPlayers')}</div>
			<div class="text-[24px] text-[#E1FF00]">{$t('gameYouSubmitted')}</div>
		</div>
	{:else}
		<PlayerChooseCard
			packsKeys={stateData.lobby.cardPacks}
			prompt={round.prompt || ''}
			onSelect={submitAnswer}
			players={players.map((player: any) => ({ username: player.username, user_id: player.id, score: player.score }))}
			tsarUuid={round.tsarPlayerId}
			submittedIds={submittedIds}
		/>
	{/if}
{:else if round.status === 'judging'}
	<TsarJudge
		submissions={submissions.map((submission: any) => ({ id: submission.id, answer: submission.answer }))}
		onPick={pickWinner}
		canPick={iAmTsar}
		prompt={round.prompt || ''}
	/>
{:else if round.status === 'reveal'}
	<RoundReveal
		canContinue={Boolean(viewer?.isHost)}
		prompt={round.prompt || ''}
		submissions={submissions.map((submission: any) => ({
			id: submission.id,
			answer: submission.answer,
			player_user_id: submission.playerId
		}))}
		winningId={round.winningSubmissionId}
		players={players.map((player: any) => ({
			user_id: player.id,
			username: player.username,
			score: player.score
		}))}
		onNext={nextRound}
	/>
{/if}
