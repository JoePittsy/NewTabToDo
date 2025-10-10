import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    size: number;
}

export default function FireworkEffect({
    onDone,
    multiple = 1,
}: {
    trigger: boolean;
    onDone?: () => void;
    multiple?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const runningRef = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Always start animation for this instance
        runningRef.current = false;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        // Set canvas size to window and update on resize
        function resizeCanvas() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        // Create multiple firework bursts at random positions
        particlesRef.current = [];
        const burstCount = Math.max(1, multiple);
        for (let b = 0; b < burstCount; ++b) {
            // Spread bursts evenly horizontally
            const cx = window.innerWidth * (burstCount === 1 ? 0.5 : (b + 0.5) / burstCount);
            const cy = window.innerHeight * Math.random();
            const color = `hsl(${Math.floor(Math.random() * 360)},90%,60%)`;
            for (let i = 0; i < 32; ++i) {
                const angle = (Math.PI * 2 * i) / 32;
                const speed = 3 + Math.random() * 2;
                particlesRef.current.push({
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    color,
                    size: 2 + Math.random() * 2,
                });
            }
        }
        // Animate
        runningRef.current = true;
        function animate() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            for (const p of particlesRef.current) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.04; // gravity
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.alpha *= 0.97;
                if (p.alpha > 0.05) alive = true;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            if (alive && runningRef.current) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                runningRef.current = false;
                if (onDone) onDone();
            }
        }
        animate();
        return () => {
            runningRef.current = false;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            window.removeEventListener("resize", resizeCanvas);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiple]);

    // Fullscreen overlay, pointer-events none
    return <canvas ref={canvasRef} className="fixed left-0 top-0 w-screen h-screen pointer-events-none z-[99999]" />;
}
