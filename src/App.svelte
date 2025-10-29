<script lang="ts">
  import Home from "./pages/Home.svelte";
  import Login from "./pages/login/Login.svelte";
  import Router from "svelte-spa-router";
  import JoinLobby from "./pages/lobby/JoinLobby.svelte";
  import {supabase} from "./util/supabase";
  import {session} from "./util/session";
  import Register from "./pages/login/Register.svelte";
  import LobbyHost from "./pages/lobby/LobbyHost.svelte";
  import LobbyPlayer from "./pages/lobby/LobbyPlayer.svelte";
  import Game from "./pages/lobby/in_game/Game.svelte";

  const Routes = {
      "/": Home,
      "/login": Login,
      "/register": Register,
      "/lobby/new": LobbyHost,
      "/lobby/join": JoinLobby,
      "/lobby/:id": LobbyPlayer,
      "/game/:id": Game,
  }

  supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user || null;
      if (!user) {
          window.location.href = "/#/login";
      }

      session.set({ user });
  });
</script>

<div class="relative bg-[#090909] min-h-screen w-full overflow-hidden select-none">
    <Router routes={Routes} />
</div>