<script lang="ts">

</script>

<div class="bg-[#090909] min-h-screen w-full overflow-hidden select-none flex items-center p-[150px]">
    <img src="/illustrations/login_monster.png" alt="Login Monster" class="absolute bottom-0 right-[100px] pointer-events-none" />

    <div class="bg-[#141414] rotate-[-5deg] w-[65vw] h-[60vh] flex flex-row justify-between items-start p-[80px]">
        <div class="flex flex-col items-start justify-between h-full">
            <h1 class="font-medium text-[64px] text-white font-poppins">login or register</h1>
            <div class="flex flex-col gap-[10px]">
                <input type="text" placeholder="username" class="bg-[#1E1E1E] font-poppins w-[500px] px-[40px] py-[20px] text-white text-[32px] focus:outline-none" />
                <input type="password" placeholder="password" class="bg-[#1E1E1E] font-poppins w-[500px] px-[40px] py-[20px] text-white text-[32px] focus:outline-none" />
            </div>
        </div>

        <div class="flex flex-col gap-[10px] items-end justify-end h-full">
            <button class="bg-[#E1FF00] px-[100px] py-[20px] cursor-pointer hover:rounded-full text-black font-poppins text-[64px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out">
                login
            </button>
            <button class="bg-[#F2CE32] px-[100px] py-[20px] cursor-pointer hover:rounded-full text-black font-poppins text-[64px] flex items-center justify-center tracking-wide select-none active:scale-[0.98] ease-in-out">
                register
            </button>
        </div>
    </div>
</div>