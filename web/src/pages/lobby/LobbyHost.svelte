<script lang="ts">
    import Slider from "../../components/Slider.svelte";
    import {onMount} from "svelte";
    import { supabase } from '../../util/supabase';
    import { session } from '../../util/session';
    import {writable} from "svelte/store";
    import Intermission from "../Intermission.svelte";

    let loading = false;
    let errorMsg = '';

    const lobbyPlayers = writable<any[]>([]);

    const cardPacks = [
        { name: "Freaky", selected: true, key: "freaky" },
        { name: "Brainrot", selected: false, key: "brainrot" },
        { name: "Black", selected: false, key: "black" },
    ];

    const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let lobbyCode = '';

    let lobbyId: string = "";
    const getUsername = async() => {
        const sess = $session.user
        if (sess && sess.id !== null) {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', sess.id)
                .single();
            if (error) {
                console.error('Error fetching username:', error);
                return null;
            }
            return data.username;
        }
    };

    onMount(async() => {
        loading = true;
        errorMsg = '';

        const userId = $session.user?.id;
        const username = await getUsername();

        for (let i = 0; i < 6; i++) {
            lobbyCode += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
            if (i === 2) lobbyCode += '-';
        }

        // Step 1: Insert lobby
        const { data: lobbyData, error: lobbyError } = await supabase
            .from('lobbies')
            .insert([{
                code: lobbyCode,
                host_uuid: userId,
                status: 'waiting',
            }])
            .select()
            .single();

        if (lobbyError || !lobbyData?.id) {
            errorMsg = lobbyError?.message || 'Failed to create lobby';
            loading = false;
            return;
        }

        lobbyId = lobbyData.id;

        // Step 2: Insert the host as the first player
        const { error: playerError } = await supabase
            .from('players')
            .insert([{
                lobby_id: lobbyId,
                user_id: userId,
                username
            }]);

        if (playerError) {
            errorMsg = playerError.message || 'Failed to add host as player';
            loading = false;
            return;
        }

        const channel = supabase
            .channel(`players-${lobbyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'players',
                    filter: `lobby_id=eq.${lobbyId}`
                },
                async () => {
                    console.log("Change detected in players table");
                    const { data, error } = await supabase
                        .from('players')
                        .select('*')
                        .eq('lobby_id', lobbyId);

                    if (error) {
                        console.error('Error fetching players:', error);
                        lobbyPlayers.set([]);
                    } else {
                        lobbyPlayers.set(data || []);
                    }

                    console.log('Players updated:', data);
                }
            )
            .subscribe();

        // Initial fetch of players
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('lobby_id', lobbyId);
        if (error) {
            console.error('Error fetching players:', error);
            lobbyPlayers.set([]);
        } else {
            lobbyPlayers.set(data || []);
        }

        loading = false;
    })

    let maxPlayers: number = 4;
    let rounds: number = 8;
    let cardPacksSelected: string[] = [];

    async function onMaxPlayersChange(value: number) {
        await supabase
            .from('lobbies')
            .update({ max_players: value })
            .eq('id', lobbyId);
    }

    async function onRoundsChange(value: number) {
        await supabase
            .from('lobbies')
            .update({ max_rounds: value })
            .eq('id', lobbyId);
    }

    async function onCardPacksChange(packs: string[]) {
        await supabase
            .from('lobbies')
            .update({ card_packs: packs })
            .eq('id', lobbyId);

    }

    $: if (maxPlayers) {
        onMaxPlayersChange(maxPlayers);
    }

    $: if (rounds) {
        onRoundsChange(rounds);
    }

    $: {
        cardPacksSelected = cardPacks.filter(pack => pack.selected).map(pack => pack.key);
        onCardPacksChange(cardPacksSelected);
    }

    async function startGame() {
        const { error } = await supabase
            .from('lobbies')
            .update({ status: 'in_game' })
            .eq('id', lobbyId);

        if (error) {
            errorMsg = 'Failed to start game';
            return;
        }

        window.location.href = `/#/game/${lobbyId}`;
    }
</script>

{#if loading}
    <Intermission />
{:else if errorMsg}
    <div class="flex flex-col justify-center items-center min-h-screen bg-black p-[80px] text-white">
        <h1 class="text-4xl font-poppins mb-4 text-[#E1FF00]">Error</h1>
        <p class="text-xl font-poppins">{errorMsg}</p>
    </div>
{:else}

    <div class="flex gap-8 justify-center items-start min-h-screen bg-black p-[80px] text-white">
        <section class="flex flex-col h-[85vh] justify-between">
            <div class="flex flex-col gap-[100px] bg-neutral-900 p-[60px] w-[30vw]">
                <div class="flex flex-col gap-[10px]">
                    <h1 class="text-[32px] font-normal font-poppins">players</h1>
                    <Slider min={1} max={8} step={1} bind:value={maxPlayers} />
                </div>

                <div class="flex flex-col gap-[10px]">
                    <h1 class="text-[32px] font-normal font-poppins">rounds</h1>
                    <Slider min={4} max={32} step={4} bind:value={rounds} />
                </div>

                <div class="flex w-full flex-col gap-[10px] items-center justify-center bg-[#282828] px-[40px] py-[20px]">
                    <h1 class="text-2xl font-normal font-poppins">lobby code</h1>
                    <div class="flex flex-row gap-[10px]">
                        <h1 class="text-[36px] text-[#E1FF00] font-medium font-poppins">{lobbyCode}</h1>
                        <button aria-label="copy" class="cursor-pointer text-[#E1FF00] active:text-[#A7BC07] transition-colors duration-300" onclick={() => { navigator.clipboard.writeText(lobbyCode); }}>
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.33317 21.3334C3.8665 21.3334 2.6665 20.1334 2.6665 18.6667V5.33335C2.6665 3.86669 3.8665 2.66669 5.33317 2.66669H18.6665C20.1332 2.66669 21.3332 3.86669 21.3332 5.33335M13.3332 10.6667H26.6665C28.1393 10.6667 29.3332 11.8606 29.3332 13.3334V26.6667C29.3332 28.1394 28.1393 29.3334 26.6665 29.3334H13.3332C11.8604 29.3334 10.6665 28.1394 10.6665 26.6667V13.3334C10.6665 11.8606 11.8604 10.6667 13.3332 10.6667Z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <button onclick={() => startGame()} type="button" class="bg-[#E1FF00] px-[100px] py-[20px] cursor-pointer hover:rounded-full text-black font-poppins text-[56px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out">
                start game
            </button>
        </section>

        <section class="flex flex-col gap-4 bg-neutral-900 p-[60px] py-[50px] w-[43vw] h-[85vh]">
            <h1 class="text-[32px] font-normal font-poppins">card packs</h1>

            {#each cardPacks as pack}
                <button class="flex flex-row justify-center items-center h-[240px] cursor-pointer {pack.selected ? 'border-8 border-[#E1FF00]' : ''}" onclick={() => { pack.selected = !pack.selected; }}>
                    <img
                            src="/card_packs/{pack.key}.png"
                            alt="page icon"
                            class="inset-0 w-full pointer-events-none select-none transition-all duration-300 opacity-40 hover:greyscale-[50%] hover:opacity-80"
                            class:filter={!pack.selected}
                            class:grayscale={!pack.selected}
                            style="height: 100%; object-fit: fill;"
                    />

                    <h1 class="text-[96px] font-bold font-poppins absolute self-center {pack.selected ? 'text-[#FFFFFF]' : 'text-[#A8A8A8]'}">{pack.name}</h1>
                </button>
            {/each}
        </section>

        <section class="flex flex-col gap-4 bg-neutral-900 p-[40px] w-[27vw] h-[85vh]">
            <h1 class="text-[32px] font-normal font-poppins">joined players</h1>
            {#each $lobbyPlayers as player}
                <div class="flex flex-row justify-between items-center bg-[#282828] px-[25px] py-[15px]">
                    <h1 class="text-2xl font-normal font-poppins">{player.username}</h1>
                    {#if player.user_id === $session.user?.id}
                        <img src="/icons/crown.svg" alt="host crown" class="w-[24px] h-[24px] pointer-events-none select-none" />
                    {/if}
                </div>
            {/each}
        </section>
    </div>
{/if}