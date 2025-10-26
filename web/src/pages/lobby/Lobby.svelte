<script>
    import LobbyHost from "./LobbyHost.svelte";
    import LobbyPlayer from "./LobbyPlayer.svelte";

    const isHost = true;
</script>

{#if isHost}
    <LobbyHost />
{:else}
    <LobbyPlayer />
{/if}