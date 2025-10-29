<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { supabase } from '../../util/supabase';

    // Get route params from svelte-spa-router (v4 passes { params })
    let { params }: { params: { id: string } } = $props();

    let lobbyId: string = params?.id;
    let lobby = $state<{
        id: string;
        code: string;
        host_uuid: string;
        status: string;
        max_players?: number | null;
        max_rounds?: number | null;
        card_packs?: string[] | null;
    } | null>(null);
    let players = $state<Array<{ id?: string; lobby_id: string; user_id: string; username: string }>>([]);

    const modules = import.meta.glob('/src/packs/*.ts', { eager: true });
    const packs = Object.keys(modules).map((path) => {
        const name = (path.split('/').pop() || '').replace('.ts', '');
        return { key: name, name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) };
    });
    let cardsSearch = $state('');

    function getPackBg(key: string) { return `/card_packs/${key}.png`; }

    // Runes-compliant reactive computation for displayed packs
    let cardPacks = $state<Array<{ key: string; name: string; selected: boolean }>>([]);
    $effect(() => {
        const selectedSet = new Set(lobby?.card_packs ?? []);
        const searchLower = cardsSearch.trim().toLowerCase();
        const mapped = packs.map((p) => ({ key: p.key, name: p.name, selected: selectedSet.has(p.key) }));
        cardPacks = searchLower ? mapped.filter((p) => p.name.toLowerCase().includes(searchLower)) : mapped;
    });

    let playersChannel: ReturnType<typeof supabase.channel> | null = null;
    let lobbyChannel: ReturnType<typeof supabase.channel> | null = null;

    async function refreshPlayers() {
        if (!lobbyId) return;
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('lobby_id', lobbyId);
        if (error) {
            console.error('Error fetching players:', error);
            players = [];
        } else {
            players = data || [];
        }
    }

    async function refreshLobby() {
        if (!lobbyId) return;
        const { data, error } = await supabase
            .from('lobbies')
            .select('*')
            .eq('id', lobbyId)
            .single();
        if (error) {
            console.error('Error fetching lobby:', error);
        } else {
            lobby = data as any;
        }
    }

    function subscribeRealtime(id: string) {
        playersChannel = supabase
            .channel(`players-${id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'players', filter: `lobby_id=eq.${id}` },
                async () => {
                    await refreshPlayers();
                }
            )
            .subscribe();

        lobbyChannel = supabase
            .channel(`lobby-${id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lobbies', filter: `id=eq.${id}` },
                async (payload) => {
                    await refreshLobby();
                    if ((payload.new as any)?.status === 'in_game') {
                        window.location.href = `/#/game/${id}`;
                    }
                }
            )
            .subscribe();
    }

    async function init() {
        if (!lobbyId) return;
        await Promise.all([refreshLobby(), refreshPlayers()]);
        subscribeRealtime(lobbyId);
    }

    onMount(() => {
        init();
    });

    onDestroy(() => {
        try { playersChannel && supabase.removeChannel(playersChannel); } catch {}
        try { lobbyChannel && supabase.removeChannel(lobbyChannel); } catch {}
    });
</script>

<div class="flex gap-8 justify-end items-end min-h-screen bg-black p-[80px] text-white">
    <img src="/illustrations/monsters_lobby_stare.png" alt="Lobby Monsters" class="absolute top-0 left-0 pointer-events-none" />
    <img src="/illustrations/monsters_lobby_write.svg" alt="Lobby Monsters" class="absolute bottom-[10vh] left-0 pointer-events-none" />

    <section class="flex flex-col gap-4 bg-neutral-900 p-[60px] py-[50px] w-[43vw] h-[85vh] z-10">
        <div class="flex flex-row items-baseline justify-between">
            <h1 class="text-[32px] font-normal font-poppins">card packs</h1>
            <div class="text-sm text-neutral-400 font-mono">code: {lobby?.code}</div>
        </div>

        <div class="flex flex-col gap-[10px] overflow-y-scroll scroll-smooth hide-scrollbar">
            {#each cardPacks as pack}
                <div
                    class="flex flex-col justify-center items-center min-h-[240px] cursor-default relative overflow-hidden {pack.selected ? 'border-8 border-[#E1FF00]' : ''}"
                    style="background-image: url('{getPackBg(pack.key)}'); background-size: cover; background-position: center;"
                >
                    <div class="absolute inset-0 bg-black/50"></div>
                    <h1 class="relative z-10 text-[48px] font-bold font-poppins {pack.selected ? 'text-[#FFFFFF]' : 'text-[#A8A8A8]'}">
                        {pack.name}
                    </h1>
                </div>
            {/each}
        </div>
    </section>

    <section class="flex flex-col gap-4 bg-neutral-900 p-[40px] w-[27vw] h-[85vh]">
        <h1 class="text-[32px] font-normal font-poppins">joined players</h1>
        {#each players as player}
            <div class="flex flex-row justify-between items-center bg-[#282828] px-[25px] py-[15px]">
                <h1 class="text-2xl font-normal font-poppins">{player.username}</h1>
                {#if lobby && player.user_id === lobby.host_uuid}
                    <img src="/icons/crown.svg" alt="host crown" class="w-[24px] h-[24px] pointer-events-none select-none" />
                {/if}
            </div>
        {/each}
    </section>
</div>