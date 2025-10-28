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

    function get5PromptsFromPacks() {
        let allPrompts: string[] = [];
        cardPacks.forEach(pack => {
            if (pack.selected) {
                allPrompts = allPrompts.concat(pack.data.prompts);
            }
        });

        // Shuffle the prompts
        for (let i = allPrompts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPrompts[i], allPrompts[j]] = [allPrompts[j], allPrompts[i]];
        }

        return allPrompts.slice(0, 5);
    }

    const selectedPrompts = get5PromptsFromPacks();
    let chosenPrompt: string | null = null;
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
                    on:click={() => chosenPrompt = card}
            >
                <p class="text-[24px] font-poppins text-black font-medium">{card}</p>
            </button>
        {/each}
    </div>

    {#if chosenPrompt}
        <div class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-80 flex flex-col items-center justify-center gap-[40px] p-[50px]">
            <h2 class="text-[36px] font-medium text-white font-poppins">You selected:</h2>
            <div class="w-[500px] h-[700px] bg-white rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center justify-center p-[30px]">
                <p class="text-[28px] font-poppins">{chosenPrompt}</p>
            </div>
            <button
                class="bg-[#E1FF00] px-[60px] py-[15px] cursor-pointer hover:rounded-full text-black font-poppins text-[24px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out"
                on:click={() => chosenPrompt = null}
            >
                Choose Again
            </button>
        </div>
    {/if}
</div>