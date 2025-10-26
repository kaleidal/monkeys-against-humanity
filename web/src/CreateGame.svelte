<script lang="ts">
  import * as ui from './ui';
  import bwomp from './assets/bwomp.mp3';

  const clickSound = new Audio(bwomp);
  function playClick() {
    clickSound.currentTime = 0;
    clickSound.play();
  }

  let nickname = '';
  let rounds = 5;

  function createGame() {
    playClick();
    // TODO: hook up to backend later
    alert(`Creating game for ${nickname || 'anonymous'} with ${rounds} rounds`);
  }

  function goHome() {
    playClick();
    location.hash = '#/';
  }
</script>

<div class="min-h-screen bg-[#090909] text-white">
  <div class="max-w-3xl mx-auto px-6 pt-10 pb-20">
    <div class="flex items-center justify-between mb-10">
      <button class={ui.btnGhostClass} onclick={goHome}>
        <span class="flex items-center gap-3">
          <span aria-hidden="true">←</span>
          <span>back</span>
        </span>
      </button>
      <img src="/logo.svg" alt="Logo" class="h-10 opacity-90" />
    </div>

    <h1 class="font-protest text-5xl md:text-6xl tracking-tight mb-8">create game</h1>
    <p class="text-white/70 mb-10 max-w-prose">Spin up a new lobby, invite your chaotic crew, and let the worst ideas win. You’re the host—own it.</p>

    <div class="space-y-6">
      <label class="block">
        <span class="text-white/80 mb-2 font-poppins block">nickname</span>
        <input class={ui.inputClass} placeholder="e.g. primate overlord" bind:value={nickname} />
      </label>

      <label class="block">
        <span class="text-white/80 mb-2 font-poppins block">rounds</span>
        <input class={ui.inputClass} type="number" min="3" max="20" bind:value={rounds} />
      </label>

      <div class="pt-4">
        <button class={ui.btnClass} onclick={createGame}>
          <span class="flex items-center gap-4">
            <span>launch lobby</span>
            <span aria-hidden="true" class="transition-transform duration-200 ease-out translate-x-0 group-hover:translate-x-1">➜</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</div>
