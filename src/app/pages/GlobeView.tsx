import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { useEvents } from "../store";
import { Compass, Sparkles, Navigation, ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router";

export function GlobeView() {
    const { events } = useEvents();
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredEvent, setHoveredEvent] = useState<typeof events[0] | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    
    // Store latest values in refs to access in onRender without stale closure
    const mouseRef = useRef({ x: 0, y: 0, mx: 0, my: 0 });
    const hoveredRef = useRef<typeof events[0] | null>(null);

    useEffect(() => {
        let phi = 0;
        let theta = 0.3;
        let currentPhi = 0;
        let currentTheta = 0;
        
        let isPointerDown = false;
        let startX = 0;
        let startY = 0;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const onPointerDown = (e: PointerEvent) => {
            isPointerDown = true;
            startX = e.clientX;
            startY = e.clientY;
            canvas.style.cursor = 'grabbing';
        };

        const onPointerUp = (e: PointerEvent) => {
            isPointerDown = false;
            canvas.style.cursor = 'grab';
        };

        const onPointerMove = (e: PointerEvent) => {
            if (isPointerDown) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                phi += deltaX * 0.005;
                theta += deltaY * 0.005;
                theta = Math.max(-0.8, Math.min(0.8, theta));
                startX = e.clientX;
                startY = e.clientY;
            }

            const rect = canvas.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            
            mouseRef.current = {
                x: e.clientX,
                y: e.clientY,
                mx: (e.clientX - cx) / (rect.width / 2),
                my: (e.clientY - cy) / (rect.height / 2)
            };
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        const onClick = () => {
            const { mx, my } = mouseRef.current;
            if (mx === undefined) return;
            let found: typeof events[0] | null = null;
            for (const ev of events) {
                const rLat = ev.lat * Math.PI / 180;
                const rLng = ev.lng * Math.PI / 180;
                const x = Math.cos(rLat) * Math.sin(rLng + currentPhi);
                const y = Math.sin(rLat) * Math.cos(currentTheta) - Math.cos(rLat) * Math.cos(rLng + currentPhi) * Math.sin(currentTheta);
                const z = Math.cos(rLat) * Math.cos(rLng + currentPhi) * Math.cos(currentTheta) + Math.sin(rLat) * Math.sin(currentTheta);
                if (z > 0.1) {
                    const d = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
                    if (d < 0.07) { found = ev; break; }
                }
            }
            if (found) {
                navigate(`/events/${found.id}`);
            }
        };

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("click", onClick);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointermove", onPointerMove);

        const markers = events.map(e => ({
            location: [e.lat, e.lng] as [number, number],
            size: e.featured ? 0.08 : 0.05
        }));

        const globe = createGlobe(canvas, {
            devicePixelRatio: 2,
            width: 1000 * 2,
            height: 1000 * 2,
            phi: 0,
            theta: 0.3,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 25000,
            mapBrightness: 4,
            baseColor: [0.15, 0.05, 0.02],
            markerColor: [0.976, 0.451, 0.086],
            glowColor: [0.976, 0.451, 0.086],
            markers: markers,
            onRender: (state) => {
                if (!isPointerDown) {
                    phi += 0.002;
                }
                currentPhi += (phi - currentPhi) * 0.1;
                currentTheta += (theta - currentTheta) * 0.1;
                state.phi = currentPhi;
                state.theta = currentTheta;

                // Sync hit detection with rotation
                let found: typeof events[0] | null = null;
                const { mx, my } = mouseRef.current;
                
                // Only check for hits if mouse is roughly over the globe area
                if (Math.sqrt(mx**2 + my**2) < 1.1) {
                    for (const ev of events) {
                        const rLat = ev.lat * Math.PI / 180;
                        const rLng = ev.lng * Math.PI / 180;
                        
                        // Correct spherical to 2D projection for Cobe
                        const x = Math.cos(rLat) * Math.sin(rLng + currentPhi);
                        const y = Math.sin(rLat) * Math.cos(currentTheta) - Math.cos(rLat) * Math.cos(rLng + currentPhi) * Math.sin(currentTheta);
                        const z = Math.cos(rLat) * Math.cos(rLng + currentPhi) * Math.cos(currentTheta) + Math.sin(rLat) * Math.sin(currentTheta);
                        
                        if (z > 0.1) { // Marker is clearly on the visible side
                            const d = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
                            if (d < 0.07) { // Hit threshold
                                found = ev;
                                break;
                            }
                        }
                    }
                }

                if (found !== hoveredRef.current) {
                    hoveredRef.current = found;
                    setHoveredEvent(found);
                    if (found) canvas.style.cursor = 'pointer';
                    else if (isPointerDown) canvas.style.cursor = 'grabbing';
                    else canvas.style.cursor = 'grab';
                }
            }
        });

        return () => {
            globe.destroy();
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("click", onClick);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointermove", onPointerMove);
        };
    }, [events, navigate]);

    return (
        <div className="relative min-h-screen pt-[64px] overflow-hidden bg-[#0a0500]">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 50%, rgba(249,115,22,0.12) 0%, transparent 70%)" }} />
            
            <div className="absolute top-[10%] left-8 md:left-16 z-20 max-w-sm pointer-events-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.25)", backdropFilter: "blur(8px)" }}>
                    <Compass size={12} />
                    Global Interactive View
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-4" style={{ fontFamily: "'Outfit',sans-serif", color: "#fff", lineHeight: 1.1 }}>
                    Click a dot to
                    <br />
                    <span style={{ color: "#f97316" }}>See Event</span>
                </h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                    Rotate the world and click on any glowing marker to explore that event's details. Featured events are larger and brighter.
                </p>
                
                <div className="mt-8 flex flex-col gap-3 pointer-events-auto">
                    {events.filter(e => e.featured).slice(0, 1).map((e) => (
                        <Link key={e.id} to={`/events/${e.id}`} className="group flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-[rgba(255,255,255,0.05)]" style={{ border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
                            <img src={e.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                            <div>
                                <p className="text-xs font-bold" style={{ color: "#f97316" }}>FEATURED IN {e.city.toUpperCase()}</p>
                                <p className="text-base font-black text-white leading-tight group-hover:underline">{e.title}</p>
                                <span className="text-[10px] text-white/50 flex items-center gap-1 mt-1"><ArrowUpRight size={10} /> View Details</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Hover Tooltip/Card */}
            {hoveredEvent && (
                <div 
                    className="fixed z-50 pointer-events-none p-3 rounded-xl shadow-2xl anim-pop-in"
                    style={{ 
                        left: mousePos.x + 20, 
                        top: mousePos.y + 20,
                        background: "rgba(26,10,0,0.95)",
                        border: "1px solid rgba(249,115,22,0.4)",
                        backdropFilter: "blur(12px)",
                        minWidth: 180
                    }}
                >
                    <p className="text-[10px] font-bold text-orange-500 mb-0.5">{hoveredEvent.city.toUpperCase()}</p>
                    <p className="text-sm font-bold text-white mb-2 leading-tight">{hoveredEvent.title}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/60">{hoveredEvent.date}</span>
                        <span className="text-xs font-black text-orange-400">${Math.min(...hoveredEvent.tiers.map(t => t.price))}</span>
                    </div>
                </div>
            )}

            {/* Globe Canvas Container */}
            <div className="absolute inset-x-0 bottom-[-20%] md:bottom-[-40%] flex justify-center items-center pointer-events-auto" style={{ height: "100vh" }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        width: "1000px",
                        height: "1000px",
                        maxWidth: "100%",
                        aspectRatio: "1",
                        cursor: "grab",
                        opacity: 0.95,
                        filter: "drop-shadow(0 0 50px rgba(249,115,22,0.25))"
                    }}
                />
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                <p className="text-xs tracking-widest uppercase font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Tap a marker to view details
                </p>
            </div>
        </div>
    );
}


