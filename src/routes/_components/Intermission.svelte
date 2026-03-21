<script lang="ts">
    const possibleTexts = [
        "just think of woo.. just woo... just woo...",
        "did you know? monsters love hugs!",
        "i wonder what humans taste like...",
        "i hope they have snacks here...",
        "time for a quick power nap!",
        "i could really go for some pizza right now.",
        "i heard there's a monster dance party later!",
        "i'm practicing my roar, wanna hear?",
        "i hope they have comfy chairs here.",
    ]

    const getRandomText = () => {
        const index = Math.floor(Math.random() * possibleTexts.length);
        return possibleTexts[index];
    }
</script>

<div class="bg-[#090909] min-h-screen w-full overflow-y-hidden select-none flex flex-col items-center justify-center gap-[100px]">
    <img src="/illustrations/intermission_monster.png" alt="Intermission Monster" class="pointer-events-none" />

    <p class="font-poppins text-[32px] text-[#7B7B7B] text-center">{getRandomText()}</p>

    <div class="h-[50px] w-[50px] rounded-full border-2 border-neutral-600 border-t-white animate-spin"></div>
</div>
