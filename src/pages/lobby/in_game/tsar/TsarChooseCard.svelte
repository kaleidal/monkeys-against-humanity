<script lang="ts">
    let { packsKeys = [] as string[], onSelect = ((_: string) => {}) } = $props();

    const modules = import.meta.glob('/src/packs/*.ts', { eager: true });

    const packs = Object.keys(modules).map((path) => {
        const name = (path.split('/').pop() || '').replace('.ts', '');
        return { name, data: modules[path] as any };
    });

    function getPromptsFromSelected(): string[] {
        let all: string[] = [];
        for (const p of packs) {
            if (packsKeys.includes(p.name)) all = all.concat((p.data.prompts || []) as string[]);
        }
        // shuffle
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }
        return all.slice(0, 5);
    }

    let selectedPrompts = getPromptsFromSelected();

    function choose(card: string) {
        onSelect(card);
    }
</script>

<div class="w-full min-h-screen bg-[#090909] flex flex-col items-center justify-center gap-[60px] p-[100px] relative overflow-hidden select-none">
    <div class="flex flex-col items-center justify-center gap-[20px]">
        <h1 class="text-[64px] font-normal text-white font-poppins self-center">you are the tsar.</h1>
        <h1 class="text-[28px] font-normal text-white font-poppins self-center">pick a card. any card...</h1>
    </div>

    <div class="flex flex-row gap-[40px] w-full">
        {#each selectedPrompts as card}
            <button
                    class="flex-grow aspect-auto h-[500px] w-[200px] bg-[#E1FF00] rounded-[40px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-[1.05] hover:rotate-[-3deg] transition-all duration-300 active:scale-[0.95] ease-in-out flex items-start justify-start p-[40px] py-[35px] text-left"
                    onclick={() => choose(card)}
            >
                <p class="text-[24px] font-poppins text-black font-medium">{card}</p>
            </button>
        {/each}
    </div>
</div>