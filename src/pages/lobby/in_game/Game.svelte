<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { supabase } from '../../../util/supabase';
    import TsarChooseCard from './tsar/TsarChooseCard.svelte';
    import PlayerChooseCard from './player/PlayerChooseCard.svelte';
    import TsarWaiting from './tsar/TsarWaiting.svelte';
    import { session } from '../../../util/session';
    import TsarJudge from './tsar/TsarJudge.svelte';
    import RoundReveal from './RoundReveal.svelte';
    import GameOver from './GameOver.svelte';
    import Intermission from "../../Intermission.svelte";

    let { params }: { params: { id: string } } = $props();
    const lobbyId = params.id;

    type Lobby = {
        id: string;
        code: string;
        host_uuid: string;
        status: 'waiting' | 'in_game' | 'finished';
        max_players?: number | undefined;
        max_rounds?: number | undefined;
        card_packs?: string[] | undefined;
    };

    type Player = { id?: string; lobby_id: string; user_id: string; username: string; score?: number | undefined };
    type Round = { id: string; lobby_id: string; round_number: number; tsar_user_id: string; prompt: string | undefined; status: 'tsar_select' | 'submitting' | 'judging' | 'reveal' | 'complete'; winning_submission_id?: string | undefined };
    type Submission = { id: string; lobby_id: string; round_id: string; player_user_id: string; answer: string };

    let lobby = $state<Lobby | null>(null);
    let players = $state<Player[]>([]);
    let currentRound = $state<Round | null>(null);
    let submissions = $state<Submission[]>([]);

    let lobbyCh: ReturnType<typeof supabase.channel> | null = null;
    let roundsCh: ReturnType<typeof supabase.channel> | null = null;
    let subsCh: ReturnType<typeof supabase.channel> | null = null;
    let playersCh: ReturnType<typeof supabase.channel> | null = null;

    let packsKeys = $state<string[]>([]);
    $effect(() => { packsKeys = lobby?.card_packs ?? []; });

    let me = $state<string | null>(null);
    $effect(() => { me = $session.user?.id ?? null; });

    let iAmTsar = $state(false);
    $effect(() => { iAmTsar = !!currentRound && !!me && currentRound!.tsar_user_id === me; });

    let iAmHost = $state(false);
    $effect(() => { iAmHost = !!lobby && !!me && lobby!.host_uuid === me; });

    let expectedSubmissions = $state(0);
    $effect(() => { expectedSubmissions = Math.max(0, players.length - 1); });

    let mySubmitted = $state(false);
    $effect(() => { mySubmitted = !!me && submissions.some((s) => s.player_user_id === me); });

    let errorMsg = $state('');
    let nextLoading = $state(false);
    let submittedIds = $state<string[]>([]);
    $effect(() => { submittedIds = submissions.map(s => s.player_user_id); });

    async function fetchLobby() {
        const { data } = await supabase.from('lobbies').select('*').eq('id', lobbyId).single();
        lobby = (data as any) || null;
    }
    async function fetchPlayers() {
        const { data } = await supabase.from('players').select('*').eq('lobby_id', lobbyId).order('id');
        players = (data as any) || [];
    }
    async function fetchCurrentRound() {
        const { data } = await supabase
            .from('rounds')
            .select('*')
            .eq('lobby_id', lobbyId)
            .order('round_number', { ascending: false })
            .limit(1)
            .maybeSingle();
        currentRound = (data as any) || null;
        if (currentRound) await fetchSubmissions(currentRound.id);
    }
    async function fetchSubmissions(roundId: string) {
        const { data } = await supabase.from('submissions').select('*').eq('lobby_id', lobbyId).eq('round_id', roundId);
        submissions = (data as any) || [];
    }

    function nextTsarFor(roundNumber: number) {
        if (players.length === 0) return null;
        const order = [...players].sort((a, b) => (a.user_id || '').localeCompare(b.user_id || ''));
        const idx = (roundNumber - 1) % order.length;
        return order[idx]?.user_id ?? null;
    }

    async function ensureRoundExists() {
        if (!lobby || lobby.status !== 'in_game') return;
        await fetchCurrentRound();
        if (!currentRound && me === lobby.host_uuid) {
            const roundNumber = 1;
            const tsar = nextTsarFor(roundNumber);
            if (!tsar) return;
            const { data, error } = await supabase
                .from('rounds')
                .insert([{ lobby_id: lobbyId, round_number: roundNumber, tsar_user_id: tsar, prompt: null, status: 'tsar_select' }])
                .select()
                .single();
            if (error) {
                console.error('Failed to create round:', error);
                errorMsg = `Failed to create round: ${error.message}`;
                return;
            }
            currentRound = data as any;
        }
    }

    async function startJudgingIfComplete() {
        if (!currentRound) return;
        if (currentRound.status !== 'submitting') return;
        if (submissions.length >= expectedSubmissions) {
            await supabase.from('rounds').update({ status: 'judging' }).eq('id', currentRound.id);
        }
    }

    async function onTsarSelectPrompt(prompt: string) {
        if (!currentRound) return;
        currentRound = { ...currentRound, prompt, status: 'submitting' } as any;
        await supabase.from('rounds').update({ prompt, status: 'submitting' }).eq('id', currentRound!.id);
    }

    async function onPlayerSubmit(answer: string) {
        if (!currentRound || !me) return;
        if (submissions.some((s) => s.player_user_id === me)) return;
        // optimistic add
        submissions = [...submissions, { id: 'local-' + crypto.randomUUID(), lobby_id: lobbyId, round_id: currentRound.id, player_user_id: me, answer } as any];
        await supabase.from('submissions').insert([{ lobby_id: lobbyId, round_id: currentRound.id, player_user_id: me, answer }]);
    }

    async function onTsarPickWinner(submissionId: string) {
        if (!currentRound) return;
        const win = submissions.find((s) => s.id === submissionId);
        if (!win) return;
        currentRound = { ...currentRound, winning_submission_id: submissionId, status: 'reveal' } as any;
        const winPlayer = players.find(p => p.user_id === win.player_user_id);
        if (winPlayer) {
            players = players.map(p => p.user_id === win.player_user_id ? { ...p, score: (p.score || 0) + 1 } : p);
        }
        await supabase.from('rounds').update({ winning_submission_id: submissionId, status: 'reveal' }).eq('id', currentRound!.id);
        await supabase.from('players').update({ score: (winPlayer?.score || 0) + 1 }).eq('lobby_id', lobbyId).eq('user_id', win.player_user_id);
        await fetchPlayers();
    }

    async function onNextRound() {
        if (!currentRound || !lobby) return;
        nextLoading = true;
        errorMsg = '';
        try {
            const maxRounds = lobby.max_rounds ?? 8;
            if (currentRound.round_number >= maxRounds) {
                const { error } = await supabase.from('lobbies').update({ status: 'finished' }).eq('id', lobbyId);
                if (error) throw error;
                return;
            }
            const nextNumber = currentRound.round_number + 1;
            const tsar = nextTsarFor(nextNumber);
            if (!tsar) throw new Error('No next Tsar found');
            const { data, error } = await supabase
                .from('rounds')
                .insert([{ lobby_id: lobbyId, round_number: nextNumber, tsar_user_id: tsar, prompt: null, status: 'tsar_select' }])
                .select()
                .single();
            if (error) throw error;
            currentRound = data as any;
            submissions = [];
        } catch (e: any) {
            console.error('Next round failed:', e);
            errorMsg = `Next round failed: ${e?.message || e}`;
        } finally {
            nextLoading = false;
        }
    }

    // auto re-subscribe submissions channel on round change
    $effect(() => {
        if (!currentRound) return;
        try { subsCh && supabase.removeChannel(subsCh); } catch {}
        subsCh = supabase
            .channel(`subs-${currentRound.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `round_id=eq.${currentRound.id}` }, async () => {
                await fetchSubmissions(currentRound!.id);
                await startJudgingIfComplete();
            })
            .subscribe();
    });

    // check if judging should start when counts change
    $effect(() => { startJudgingIfComplete(); });

    onMount(async () => {
        await Promise.all([fetchLobby(), fetchPlayers()]);
        // subscribe players
        playersCh = supabase
            .channel(`players-${lobbyId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `lobby_id=eq.${lobbyId}` }, async () => {
                await fetchPlayers();
            })
            .subscribe();
        // subscribe
        lobbyCh = supabase
            .channel(`lobby-${lobbyId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` }, async () => {
                await fetchLobby();
            })
            .subscribe();

        roundsCh = supabase
            .channel(`rounds-${lobbyId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `lobby_id=eq.${lobbyId}` }, async (payload) => {
                const r = (payload as any).new as any;
                if (r && (!currentRound || r.round_number >= currentRound.round_number)) {
                    currentRound = r;
                    await fetchSubmissions(r.id);
                    if (r.status === 'reveal') {
                        await fetchPlayers(); // make sure scoreboard reflects updated points everywhere
                    }
                }
            })
            .subscribe();

        await ensureRoundExists();
        await fetchCurrentRound();
    });

    onDestroy(() => {
        try { lobbyCh && supabase.removeChannel(lobbyCh); } catch {}
        try { roundsCh && supabase.removeChannel(roundsCh); } catch {}
        try { subsCh && supabase.removeChannel(subsCh); } catch {}
        try { playersCh && supabase.removeChannel(playersCh); } catch {}
    });
</script>

{#if !lobby}
    <Intermission />
{:else if lobby.status === 'finished'}
    <GameOver players={players} />
{:else}
    {#if !currentRound}
        <div class="min-h-screen text-white bg-black flex flex-col items-center justify-center gap-3">
            {#if errorMsg}
                <div class="text-red-400 text-sm font-mono">{errorMsg}</div>
            {:else}
                <Intermission />
            {/if}
        </div>
    {:else}
        {#if currentRound.status === 'tsar_select'}
            {#if iAmTsar}
                <TsarChooseCard packsKeys={packsKeys} onSelect={onTsarSelectPrompt} />
            {:else}
                <div class="w-full h-screen flex flex-col justify-center items-center">
                    <h1 class="text-[32px] font-normal text-white font-poppins text-center">{players.find(p => p.user_id === currentRound?.tsar_user_id)?.username || 'The Tsar'} is choosing a prompt...</h1>
                </div>
            {/if}
        {:else if currentRound.status === 'submitting'}
            {#if iAmTsar}
                <TsarWaiting prompt={currentRound.prompt || ''} players={players} tsarUuid={currentRound.tsar_user_id} submittedIds={submittedIds} />
            {:else}
                {#if mySubmitted}
                    <div class="min-h-screen text-white bg-black flex flex-col items-center justify-center gap-3">
                        <div class="text-[32px]">Waiting for other players to submit...</div>
                        <div class="text-[24px] text-gray-400">You have submitted your card.</div>
                    </div>
                {:else}
                    <PlayerChooseCard packsKeys={packsKeys} prompt={currentRound.prompt || ''} onSelect={onPlayerSubmit} players={players} tsarUuid={currentRound.tsar_user_id} submittedIds={submittedIds} />
                {/if}
            {/if}
        {:else if currentRound.status === 'judging'}
            <TsarJudge submissions={submissions} onPick={onTsarPickWinner} canPick={iAmTsar} prompt={currentRound.prompt} />
        {:else if currentRound.status === 'reveal'}
            <RoundReveal canContinue={iAmHost} prompt={currentRound.prompt} submissions={submissions} winningId={currentRound.winning_submission_id} players={players} onNext={onNextRound} loading={nextLoading} errorMsg={errorMsg} />
        {/if}
    {/if}
{/if}
