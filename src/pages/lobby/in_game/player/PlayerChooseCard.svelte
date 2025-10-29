<script lang="ts">
    export let packsKeys: string[] = [];
    export let prompt: string | null = '';
    export let onSelect: (a: string) => void = () => {};
    export let players: Array<{ username: string; user_id: string; score?: number }> = [];
    export let tsarUuid: string = '';
    export let submittedIds: string[] = [];

    const modules = import.meta.glob('/src/packs/*.ts', { eager: true });

    const packs = Object.keys(modules).map((path) => {
        const name = (path.split('/').pop() || '').replace('.ts', '');
        return { name, data: modules[path] as any };
    });

    function getAnswersFromSelected(): string[] {
        let all: string[] = [];
        for (const p of packs) {
            if (packsKeys.includes(p.name)) all = all.concat((p.data.answers || []) as string[]);
        }
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }
        return all.slice(0, 5);
    }

    let selectedAnswers = getAnswersFromSelected();

    function choose(answer: string) {
        onSelect(answer);
    }
</script>

<div class="w-full min-h-screen bg-[#090909] text-white p-[8vh] flex flex-col md:flex-row gap-[6vw]">
    <section class="flex flex-col gap-3 bg-neutral-900 p-[6vh] w-full md:w-[22vw] h-[83vh] overflow-y-auto">
        <h1 class="text-[24px] md:text-[32px] font-normal font-poppins">players</h1>
        {#each players as player}
            <div class="flex flex-row justify-between items-center bg-[#282828] px-4 py-2">
                <div class="flex items-center gap-2">
                    <h1 class="text-lg md:text-2xl font-normal font-poppins">{player.username}</h1>
<!--                    <span class="text-[#E1FF00] font-semibold text-sm md:text-base">{player.score ?? 0}</span>-->
                </div>
                <div class="flex items-center gap-2">
                    {#if player.user_id === tsarUuid}
                        <img src="/icons/tsar.svg" alt="tsar crown" class="w-[20px] h-[20px] md:w-[24px] md:h-[24px] pointer-events-none select-none" />
                    {/if}
                    {#if submittedIds.includes(player.user_id)}
                        <svg width="20" height="20" viewBox="0 0 34 34" fill="none">
                            <path d="M28.3332 8.5L12.7498 24.0833L5.6665 17" stroke="#E1FF00" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    {:else if player.user_id !== tsarUuid}
                        <svg width="20" height="20" viewBox="0 0 34 34" fill="none">
                            <g clip-path="url(#clip0)"><path d="M17.0002 8.50001V17L22.6668 19.8333M31.1668 17C31.1668 24.824 24.8242 31.1667 17.0002 31.1667C9.17613 31.1667 2.8335 24.824 2.8335 17C2.8335 9.17598 9.17613 2.83334 17.0002 2.83334C24.8242 2.83334 31.1668 9.17598 31.1668 17Z" stroke="#EB9F11" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
                            <defs><clipPath id="clip0"><rect width="34" height="34" fill="white"/></clipPath></defs>
                        </svg>
                    {/if}
                </div>
            </div>
        {/each}
    </section>

    <img src="/illustrations/player_choose.png" alt="player choosing" class="absolute top-0 left-[20vw] w-[70vw] md:w-[40vw] absolute -top-[8vw] left-[10vw] md:top-0 md:left-[25vw] h-auto pointer-events-none select-none opacity-80" />

    <div class="absolute right-[5vh] top-[5vh] h-[300px] md:h-[400px] w-[220px] md:w-[300px] bg-[#E1FF00] rounded-[24px] md:rounded-[40px] items-start justify-start p-6 md:p-[40px] text-left">
        <p class="text-[18px] md:text-[24px] font-poppins text-black font-medium">{prompt}</p>
    </div>

    <div class="absolute bottom-[8vh] left-[31vw] z-10 gap-[12px] flex flex-row w-[65vw] gap-[10px] justify-between items-start">
        {#each selectedAnswers as card}
            <button class="flex-grow basis-[42%] md:basis-auto h-[200px] md:h-[350px] w-[180px] md:w-[200px] bg-[#EEEEEE] rounded-[24px] md:rounded-[40px] cursor-pointer hover:scale-[1.03] hover:rotate-[-2deg] md:hover:rotate-[-3deg] transition-all duration-300 active:scale-[0.97] ease-in-out flex items-start justify-start p-4 md:p-[40px] text-left" onclick={() => choose(card)}>
                <span class="text-[16px] md:text-[24px] font-poppins text-black font-medium">{card}</span>
            </button>
        {/each}
    </div>
</div>