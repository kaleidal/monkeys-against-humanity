<script>
    const joinedPlayers = [
        { name: "Player1", isHost: true },
        { name: "Player2", isHost: false },
        { name: "Player3", isHost: false },
    ];

    const cardPacks = [
        { name: "Freaky", selected: true, key: "freaky" },
        { name: "Brainrot", selected: false, key: "freaky" },
        { name: "Black", selected: false, key: "freaky" },
    ];
</script>

<div class="flex gap-8 justify-end items-end min-h-screen bg-black p-[80px] text-white">
    <img src="/illustrations/monsters_lobby_stare.png" alt="Lobby Monsters" class="absolute top-0 left-0 pointer-events-none" />
    <img src="/illustrations/monsters_lobby_write.svg" alt="Lobby Monsters" class="absolute bottom-[10vh] left-0 pointer-events-none" />

    <section class="flex flex-col gap-4 bg-neutral-900 p-[60px] py-[50px] w-[43vw] h-[85vh] z-10">
        <h1 class="text-[32px] font-normal font-poppins">card packs</h1>

        {#each cardPacks as pack}
            <div class="flex flex-row justify-center items-center h-[240px] {pack.selected ? 'border-8 border-[#E1FF00]' : ''}">
                <img
                        src="/card_packs/{pack.key}.png"
                        alt="page icon"
                        class="inset-0 w-full pointer-events-none select-none transition-all duration-300 opacity-40 hover:greyscale-[50%] hover:opacity-80"
                        class:filter={!pack.selected}
                        class:grayscale={!pack.selected}
                        style="height: 100%; object-fit: fill;"
                />

                <h1 class="text-[96px] font-bold font-poppins absolute self-center {pack.selected ? 'text-[#FFFFFF]' : 'text-[#A8A8A8]'}">{pack.name}</h1>
            </div>
        {/each}
    </section>

    <section class="flex flex-col gap-4 bg-neutral-900 p-[40px] w-[27vw] h-[85vh]">
        <h1 class="text-[32px] font-normal font-poppins">joined players</h1>
        {#each joinedPlayers as player}
            <div class="flex flex-row justify-between items-center bg-[#282828] px-[25px] py-[15px]">
                <h1 class="text-2xl font-normal font-poppins">{player.name}</h1>
                {#if player.isHost}
                    <img src="/icons/crown.svg" alt="host crown" class="w-[24px] h-[24px] pointer-events-none select-none" />
                {/if}
            </div>
        {/each}
    </section>
</div>