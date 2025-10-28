<script lang="ts">
    import { supabase } from '../../util/supabase';
    import {onMount} from "svelte";

    let username = '';
    let password = '';
    let loading = false;
    let errorMsg = '';

    onMount(async () => {
        console.log('about to query');
        const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', "pussylicious")
            .single()
        console.log('done', data, fetchError);
    });


    async function handleLogin() {
        loading = true;
        errorMsg = '';

        // Find the profile for this username
        const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', username)
            .single()

        if (fetchError || !data?.email) {
            errorMsg = 'Username not found';
            loading = false;
            console.log(fetchError)
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password
        });

        loading = false;
        if (error) errorMsg = error.message;
        else window.location.href = '/#/';
    }
</script>

<div class="bg-[#090909] min-h-screen w-full overflow-hidden select-none flex items-center p-[150px]">
    <img src="/illustrations/login_monster.png" alt="Login Monster" class="absolute bottom-0 right-[100px] pointer-events-none" />

    <div class="bg-[#141414] rotate-[-5deg] w-[65vw] h-[60vh] flex flex-row justify-between items-start p-[80px]">
        <div class="flex flex-col items-start justify-between h-full">
            <h1 class="font-medium text-[64px] text-white font-poppins">login</h1>
            <div class="flex flex-col gap-[10px]">
                <input
                        type="text"
                        placeholder="username"
                        bind:value={username}
                        class="bg-[#1E1E1E] font-poppins w-[500px] px-[40px] py-[20px] text-white text-[32px] focus:outline-none"
                />
                <input
                        type="password"
                        placeholder="password"
                        bind:value={password}
                        class="bg-[#1E1E1E] font-poppins w-[500px] px-[40px] py-[20px] text-white text-[32px] focus:outline-none"
                />
            </div>
            {#if errorMsg}
                <span class="text-red-400 font-poppins mt-4 text-xl">{errorMsg}</span>
            {/if}
        </div>

        <div class="flex flex-col gap-[10px] items-end justify-end h-full">
            <button
                    class="bg-[#E1FF00] px-[100px] py-[20px] cursor-pointer hover:rounded-full text-black font-poppins text-[64px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out"
                    on:click={handleLogin}
                    disabled={loading}
            >
                {loading ? '...' : 'login'}
            </button>
            <a href="/#/register" class="font-poppins text-[#A0FF11] text-[24px] underline underline-offset-4 mt-4">don't have an account? register</a>
        </div>
    </div>
</div>