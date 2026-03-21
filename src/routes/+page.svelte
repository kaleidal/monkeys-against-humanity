<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { getSessionSnapshot, signIn } from '$lib/auth';

    type Piece = {
        id: string
        src: string
        x: number
        y: number
        w: number
        h: number
        vx: number
        vy: number
        dragging: boolean
        pointerId?: number
        lastX?: number
        lastY?: number
        lastMoveAt?: number
        el?: HTMLElement
    }

    let containerEl: HTMLDivElement;
    let loading = $state(true);

    let pieces = $state<Piece[]>([
        { id: 'MONKEYS', src: '/logo_split/MONKEYS.svg', x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, dragging: false },
        { id: 'AGAINST', src: '/logo_split/against.svg', x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, dragging: false },
        { id: 'HUMANITY', src: '/logo_split/HUMANITY.svg', x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, dragging: false },
    ])

    let raf = 0;
    let lastTime = 0;
    let obstacles: DOMRect[] = [];

    function rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }

    function clamp(n: number, min: number, max: number) {
        return Math.max(min, Math.min(max, n))
    }

    function preload(srcs: string[]) {
        return Promise.all(
            srcs.map(
                (src) =>
                    new Promise<void>((resolve, reject) => {
                        const img = new Image()
                        img.onload = () => resolve()
                        img.onerror = () => reject(new Error(`Failed to load ${src}`))
                        img.src = src
                    })
            )
        )
    }

    function collectObstacles() {
        if (!containerEl) return
        const cr = containerEl.getBoundingClientRect()
        obstacles = []

        const els = containerEl.querySelectorAll<HTMLElement>('[data-obstacle]')
        els.forEach((el) => {
            if (el.dataset.piece) return
            const r = el.getBoundingClientRect()
            obstacles.push(new DOMRect(r.left - cr.left, r.top - cr.top, r.width, r.height))
        })
    }

    function measurePieces() {
        if (!containerEl) return
        const cw = containerEl.clientWidth
        const ch = containerEl.clientHeight
        const cr = containerEl.getBoundingClientRect()

        pieces.forEach((p) => {
            const el = containerEl.querySelector<HTMLElement>(`[data-piece="${p.id}"]`)
            if (!el) return
            p.el = el
            const r = el.getBoundingClientRect()
            p.w = r.width
            p.h = r.height

            if (p.x === 0 && p.y === 0) {
                p.x = Math.random() * Math.max(1, cw - p.w)
                p.y = Math.random() * Math.max(1, ch - p.h)
                const speed = 20 + Math.random() * 40
                const angle = Math.random() * Math.PI * 2
                p.vx = Math.cos(angle) * speed
                p.vy = Math.sin(angle) * speed
            } else {
                const rr = el.getBoundingClientRect()
                p.x = clamp(rr.left - cr.left, 0, Math.max(0, cw - p.w))
                p.y = clamp(rr.top - cr.top, 0, Math.max(0, ch - p.h))
            }
        })
    }

    function resolveObstacleOverlap(p: Piece) {
        for (const o of obstacles) {
            if (!rectsOverlap(p.x, p.y, p.w, p.h, o.x, o.y, o.width, o.height)) continue
            const dxLeft = (p.x + p.w) - o.x
            const dxRight = (o.x + o.width) - p.x
            const dyTop = (p.y + p.h) - o.y
            const dyBottom = (o.y + o.height) - p.y
            const minXPen = Math.min(dxLeft, dxRight)
            const minYPen = Math.min(dyTop, dyBottom)

            if (minXPen < minYPen) {
                if (dxLeft < dxRight) {
                    p.x = o.x - p.w
                    p.vx = -Math.abs(p.vx)
                } else {
                    p.x = o.x + o.width
                    p.vx = Math.abs(p.vx)
                }
            } else {
                if (dyTop < dyBottom) {
                    p.y = o.y - p.h
                    p.vy = -Math.abs(p.vy)
                } else {
                    p.y = o.y + o.height
                    p.vy = Math.abs(p.vy)
                }
            }
        }
    }

    function update(dt: number) {
        if (!containerEl) return
        const cw = containerEl.clientWidth
        const ch = containerEl.clientHeight

        for (const p of pieces) {
            if (p.dragging) continue

            p.x += p.vx * dt
            p.y += p.vy * dt

            if (p.x < 0) {
                p.x = 0
                p.vx = Math.abs(p.vx)
            }
            if (p.y < 0) {
                p.y = 0
                p.vy = Math.abs(p.vy)
            }
            if (p.x + p.w > cw) {
                p.x = Math.max(0, cw - p.w)
                p.vx = -Math.abs(p.vx)
            }
            if (p.y + p.h > ch) {
                p.y = Math.max(0, ch - p.h)
                p.vy = -Math.abs(p.vy)
            }

            resolveObstacleOverlap(p)

            p.vx *= 0.999
            p.vy *= 0.999
        }
    }

    function loop(t: number) {
        const dt = lastTime ? (t - lastTime) / 1000 : 0
        lastTime = t
        update(dt)
        raf = requestAnimationFrame(loop)
    }

    function startLoop() {
        stopLoop()
        lastTime = 0
        raf = requestAnimationFrame(loop)
    }

    function stopLoop() {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
    }

    function onPointerDown(p: Piece, e: PointerEvent) {
        p.dragging = true
        p.pointerId = e.pointerId
        p.lastX = e.clientX
        p.lastY = e.clientY
        p.lastMoveAt = performance.now()
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        e.preventDefault()
    }

    function onPointerMove(p: Piece, e: PointerEvent) {
        if (!p.dragging || p.pointerId !== e.pointerId || !containerEl) return
        const now = performance.now()
        const dtMs = Math.max(1, now - (p.lastMoveAt ?? now))
        const dx = e.clientX - (p.lastX ?? e.clientX)
        const dy = e.clientY - (p.lastY ?? e.clientY)

        p.lastX = e.clientX
        p.lastY = e.clientY
        p.lastMoveAt = now

        p.x += dx
        p.y += dy

        const cw = containerEl.clientWidth
        const ch = containerEl.clientHeight
        p.x = clamp(p.x, 0, Math.max(0, cw - p.w))
        p.y = clamp(p.y, 0, Math.max(0, ch - p.h))

        resolveObstacleOverlap(p)

        const dt = dtMs / 1000
        if (dt > 0) {
            const vx = dx / dt
            const vy = dy / dt
            p.vx = p.vx * 0.2 + vx * 0.8
            p.vy = p.vy * 0.2 + vy * 0.8
        }
    }

    function onPointerUp(p: Piece, e: PointerEvent) {
        if (p.pointerId !== e.pointerId) return
        p.dragging = false
        p.pointerId = undefined
        try {
            ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
        } catch {}
    }

    function handleResize() {
        queueMicrotask(async () => {
            await tick()
            measurePieces()
            collectObstacles()
        })
    }

    onMount(() => {
        let alive = true

        ;(async () => {
            const start = performance.now()
            try {
                await preload(pieces.map((p) => p.src))
            } catch (e) {
                console.error('Error preloading images:', e)
            }

            const minMs = 800
            const elapsed = performance.now() - start
            if (elapsed < minMs) await new Promise((r) => setTimeout(r, minMs - elapsed))

            if (!alive) return
            loading = false
            await tick()
            measurePieces()
            collectObstacles()
            startLoop()
        })()

        return () => {
            alive = false
            stopLoop()
        }
    })

    async function handleNewGame() {
        if (getSessionSnapshot()) {
            window.location.href = '/lobby/create'
            return
        }

        await signIn('/lobby/create')
    }
</script>

<svelte:window onresize={handleResize} />

<div bind:this={containerEl} class="relative bg-[#090909] min-h-screen w-full overflow-hidden select-none">
    {#if loading}
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-6" data-obstacle>
            <img src="/logo.svg" alt="Logo" class="w-[min(72vw,640px)] max-w-[90%]" />
            <div class="flex items-center gap-3 text-neutral-300">
                <div class="h-6 w-6 rounded-full border-2 border-neutral-600 border-t-white animate-spin"></div>
                <span class="text-sm tracking-wide">Loading assets...</span>
            </div>
        </div>
    {:else}
        <div class="flex flex-col bottom-[100px] left-[100px] absolute gap-[12px]" data-obstacle>
            <button
                type="button"
                class="bg-[#E1FF00] px-[80px] py-[40px] min-w-[230px] cursor-pointer hover:rounded-full text-black font-poppins text-[64px] leading-none flex items-center justify-center tracking-normal select-none active:scale-[0.98] ease-in-out"
                onclick={handleNewGame}
            >
                <span class="flex items-center gap-4">
                  <span>new game</span>
                </span>
            </button>
            <button
                type="button"
                class="bg-[#E1FF00] px-[80px] py-[20px] min-w-[230px] cursor-pointer hover:rounded-full text-black font-poppins text-[64px] leading-none flex items-center justify-center tracking-normal select-none active:scale-[0.98] ease-in-out"
                onclick={() => { window.location.href = "/lobby/join" }}
            >
                <span class="flex items-center gap-4 text-center">
                  <span>join</span>
                </span>
            </button>
        </div>

        {#each pieces as p (p.id)}
            <img
                data-piece={p.id}
                src={p.src}
                alt={p.id}
                class="absolute will-change-transform touch-none cursor-grab active:cursor-grabbing drop-shadow-[0_0_18px_rgba(255,255,255,0.05)]"
                style={`transform: translate3d(${p.x}px, ${p.y}px, 0); width: clamp(160px, 28vw, 520px);`}
                onpointerdown={(e) => onPointerDown(p, e)}
                onpointermove={(e) => onPointerMove(p, e)}
                onpointerup={(e) => onPointerUp(p, e)}
                onpointercancel={(e) => onPointerUp(p, e)}
                onlostpointercapture={(e) => onPointerUp(p, e)}
            />
        {/each}
    {/if}
</div>
