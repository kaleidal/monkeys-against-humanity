<script lang="ts">
    const modules = import.meta.glob('/src/packs/*.ts', { eager: true });

    const packs = Object.keys(modules).map((path) => {
        const name = (path.split('/').pop() || '').replace('.ts', '');
        return { name, data: modules[path] };
    });

    let cardPacks = packs.map((pack) => {
        return {
            key: pack.name,
            name: pack.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            selected: true,
            data: pack.data
        };
    });

    function get5AnswersFromPacks() {
        let allPrompts: string[] = [];
        cardPacks.forEach(pack => {
            if (pack.selected) {
                allPrompts = allPrompts.concat(pack.data.answers);
            }
        });

        // Shuffle the prompts
        for (let i = allPrompts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPrompts[i], allPrompts[j]] = [allPrompts[j], allPrompts[i]];
        }

        return allPrompts.slice(0, 5);
    }

    const selectedPrompts = get5AnswersFromPacks();

    const joinedPlayers = [
        { name: "Player1", isHost: true },
        { name: "Player2", isHost: false },
        { name: "Player3", isHost: false },
    ];
</script>

<div class="w-full min-h-screen bg-[#090909] text-white p-[80px] flex flex-row gap-[80px] items-end">
    <section class="flex flex-col gap-4 bg-neutral-900 p-[40px] w-[23vw] h-[85vh]">
        <h1 class="text-[32px] font-normal font-poppins">players</h1>
        {#each joinedPlayers as player}
            <div class="flex flex-row justify-between items-center bg-[#282828] px-[25px] py-[15px]">
                <h1 class="text-2xl font-normal font-poppins">{player.name}</h1>
                {#if player.isHost}
                    <img src="/icons/crown.svg" alt="host crown" class="w-[24px] h-[24px] pointer-events-none select-none" />
                {/if}
            </div>
        {/each}
    </section>

    <div class="absolute right-[5vw] top-[5vw] h-[400px] w-[270px] bg-[#E1FF00] rounded-[40px] items-start justify-start p-[40px] py-[35px] text-left">
        <p class="text-[24px] font-poppins text-black font-medium">The safe word is ____.</p>
    </div>

    <img src="/illustrations/player_choose.png" alt="Tsar Waiting Illustration" class="w-[40vw] absolute top-0 left-[25vw] h-auto pointer-events-none select-none" />

    <div class="h-full flex-grow flex flex-row gap-[10px] justify-between items-start">
        {#each selectedPrompts as card}
            <div class="flex-grow aspect-auto h-[350px] w-[200px] bg-[#EEEEEE] rounded-[40px] cursor-pointer hover:scale-[1.05] hover:rotate-[-3deg] transition-all duration-300 active:scale-[0.95] ease-in-out flex items-start justify-start p-[40px] py-[35px] text-left">
                <p class="text-[24px] font-poppins text-black font-medium">{card}</p>
            </div>
        {/each}
    </div>
</div>