<script>
    const joinedPlayers = [
        { name: "Player1", isHost: true },
        { name: "Player2", isHost: false },
        { name: "Player3", isHost: false },
    ];
</script>

<div class="w-full min-h-screen bg-[#090909] text-white p-[80px] flex flex-row gap-[100px]">
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

    <div class="h-full w-[60vw] p-[50px] flex flex-row justify-between items-start gap-[20px] pointer-events-none">
        <div
                class="h-[400px] w-[300px] bg-[#E1FF00] rounded-[40px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-[1.05] hover:rotate-[-3deg] transition-all duration-300 active:scale-[0.95] ease-in-out flex items-start justify-start p-[40px] py-[35px] text-left"
        >
            <p class="text-[24px] font-poppins text-black font-medium">The safe word is ____.</p>
        </div>

        <h1 class="text-[36px] w-[25vw] text-white font-poppins font-medium self-center">you’re gonna have to wait until everyone finishes..</h1>
        <img src="/illustrations/tsar_waiting.svg" alt="Tsar Waiting Illustration" class="w-[50vw] absolute right-0 bottom-0 h-auto pointer-events-none select-none" />
    </div>
</div>