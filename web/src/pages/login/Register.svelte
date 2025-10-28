<script lang="ts">
    import { supabase } from '../../util/supabase';

    let username = '';
    let email = '';
    let password = '';
    let loading = false;
    let errorMsg = '';

    async function handleRegister() {
        loading = true;
        errorMsg = '';

        // Register via Supabase
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            errorMsg = error.message;
            loading = false;
            return;
        }

        const uid = data.user?.id;
        let profileErr;
        if (uid) {
            // Insert username
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{ id: uid, username, email: email }]);
            if (insertError) profileErr = insertError.message;
        }

        loading = false;
        if (profileErr) errorMsg = profileErr;
        else window.location.href = '/#/login';
    }
</script>

<div class="bg-[#090909] min-h-screen w-full overflow-hidden select-none flex items-center p-[150px]">
    <img src="/illustrations/login_monster.png" alt="Login Monster" class="absolute bottom-0 right-[100px] pointer-events-none" />

    <div class="bg-[#141414] rotate-[-5deg] w-[65vw] h-[60vh] flex flex-row justify-between items-start p-[80px]">
        <div class="flex flex-col items-start justify-between h-full">
            <h1 class="font-medium text-[64px] text-white font-poppins">register</h1>
            <div class="flex flex-col gap-[10px]">
                <input
                        type="text"
                        placeholder="username"
                        bind:value={username}
                        class="bg-[#1E1E1E] font-poppins w-[500px] px-[40px] py-[20px] text-white text-[32px] focus:outline-none"
                />
                <input
                        type="email"
                        placeholder="email"
                        bind:value={email}
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
                    class="bg-[#F2CE32] px-[100px] py-[20px] cursor-pointer hover:rounded-full text-black font-poppins text-[64px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out"
                    on:click={handleRegister}
                    disabled={loading}
            >
                {loading ? '...' : 'register'}
            </button>
        </div>
    </div>
</div>