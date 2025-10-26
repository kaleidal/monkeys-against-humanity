<script lang="ts">
  import Home from "./pages/Home.svelte";
  import Login from "./pages/login/Login.svelte";
  import Router from "svelte-spa-router";
  import Lobby from "./pages/lobby/Lobby.svelte";
  import JoinLobby from "./pages/lobby/JoinLobby.svelte";

  const Routes = {
      "/": Home,
      "/login": Login,
      "/lobby": Lobby,
      "/lobby/join": JoinLobby
  }
</script>

<div class="relative bg-[#090909] min-h-screen w-full overflow-hidden select-none">
    <Router routes={Routes} />
</div>