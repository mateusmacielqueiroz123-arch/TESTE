import React, { createContext, useContext, useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, interpolate, spring, Easing, delayRender, continueRender } from "remotion";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/cormorant-garamond/600.css";

export const FPS = 30;
export const TOTAL = 32;

// identidade Instituto CS, aplicada ao estilo da referência (claro x preto, uma cor de destaque)
const C = {
  navy: "#05070d", cream: "#f8f4ec", ink: "#14161b", inkSoft: "#8b8f97",
  blueDeep: "#123a6b", blueMid: "#1b4f91", blue: "#3e7bfa", blueInk: "#1f5fe0",
  gold: "#e8c77a", goldSoft: "#f2e2b8", goldDim: "#a4894f", ribbon: "#d9d3c7",
};
const INTER = "Inter, sans-serif";
const SERIF = "'Cormorant Garamond', serif";
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

const useT = () => useCurrentFrame() / FPS;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (t: number, a: number, b: number, from = 0, to = 1, ease: (n: number) => number = EXPO) =>
  interpolate(t, [a, b], [from, to], { ...cl, easing: ease });
const sp = (t: number, at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: (t - at) * FPS, fps: FPS, config: { damping: 18, stiffness: 120, mass: 0.7, ...cfg } });

const Dark = createContext(false);

// palavra: entra em foco suave, uma por vez; "hi" = palavra de destaque
const K: React.FC<{ at: number; children: React.ReactNode; hi?: boolean; size?: number; last?: boolean; style?: React.CSSProperties }> = ({ at, children, hi, size, last, style }) => {
  const t = useT(); const dark = useContext(Dark);
  const p = ramp(t, at, at + 0.5);
  const ov = hi ? sp(t, at, { damping: 9, stiffness: 150, mass: 0.6 }) : p;
  const ca = hi ? (1 - ramp(t, at, at + 0.55)) * 14 : 0;
  const base = dark ? "#ffffff" : C.ink, accent = dark ? C.gold : C.blueInk;
  return (
    <span style={{
      display: "inline-block", whiteSpace: "nowrap", marginRight: last ? 0 : "0.2em",
      fontFamily: INTER, fontWeight: hi ? 800 : 500, fontSize: size ?? (hi ? 128 : 62), letterSpacing: hi ? "-0.055em" : "-0.045em",
      color: hi ? accent : base, opacity: ramp(t, at, at + 0.3, 0, 1, Easing.linear),
      transform: `translateY(${(1 - p) * 18}px) scale(${hi ? 0.8 + 0.2 * ov : 0.94 + 0.06 * p}) skewX(${hi ? (1 - ov) * -8 : 0}deg)`, filter: `blur(${(1 - p) * 14}px)`,
      textShadow: (dark ? (hi ? "0 0 46px rgba(232,199,122,.85), 0 0 120px rgba(232,199,122,.45)" : "0 0 30px rgba(255,255,255,.45)") : "0 0 0 transparent")
        + (ca > 0.2 ? `, ${ca}px 0 rgba(255,40,90,.55), ${-ca}px 0 rgba(0,200,255,.55)` : ""),
      ...style,
    }}>{children}</span>
  );
};
const L: React.FC<{ children: React.ReactNode; indent?: number; mt?: number }> = ({ children, indent = 0, mt = 0 }) => (
  <div style={{ display: "flex", alignItems: "baseline", marginLeft: indent, marginTop: mt, lineHeight: 1 }}>{children}</div>
);

// cena: corte seco, zoom lento contínuo; opcionalmente abre em círculo (como na referência)
const Scene: React.FC<{ from: number; to: number; dark?: boolean; wipe?: [number, number]; tilt?: number; children: React.ReactNode }> = ({ from, to, dark = false, wipe, tilt = 0, children }) => {
  const t = useT();
  if (t < from || t >= to) return null;
  const z = 1 + 0.07 * ((t - from) / (to - from));
  const r = wipe ? ramp(t, from, from + 0.55, 0, 2300, Easing.inOut(Easing.cubic)) : 0;
  return (
    <Dark.Provider value={dark}>
      <AbsoluteFill style={{ background: dark ? "#000" : C.cream, clipPath: wipe ? `circle(${r}px at ${wipe[0]}px ${wipe[1]}px)` : undefined, overflow: "hidden" }}>
        {dark ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 900px 900px at 50% 45%, rgba(27,79,145,.34), transparent 70%)" }} /> : null}
        {dark ? <AbsoluteFill style={{ background: `radial-gradient(ellipse 700px 1200px at ${-10 + ((t - from) / (to - from)) * 40}% 20%, rgba(232,199,122,.16), transparent 70%)`, mixBlendMode: "screen" }} /> : null}
        <AbsoluteFill style={{ transform: `translate(${Math.sin(t * 1.1) * 7 + Math.sin(t * 2.7) * 3}px, ${Math.cos(t * 0.9) * 8 + Math.sin(t * 3.1) * 2}px) scale(${z}) rotate(${tilt * ((t - from) / (to - from) - 0.5) + Math.sin(t * 0.8) * 0.25}deg)` }}>{children}</AbsoluteFill>
        {dark ? <Img src={staticFile(`tex/dust${Math.floor(t * 8) % 3}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5, mixBlendMode: "screen" }} />
          : <><Img src={staticFile("tex/paper.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55, mixBlendMode: "multiply" }} />
              <Img src={staticFile(`tex/dust${Math.floor(t * 8) % 3}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35, filter: "invert(1)", mixBlendMode: "multiply" }} />
              <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(120,95,50,.12) 100%)" }} /></>}
      </AbsoluteFill>
    </Dark.Provider>
  );
};

// detalhes gráficos da referência
const Grid: React.FC<{ x: number; y: number; at: number; n?: number }> = ({ x, y, at, n = 6 }) => {
  const t = useT(); const dark = useContext(Dark); const s = 96, o = ramp(t, at, at + 0.8) * (dark ? 0.2 : 0.16), col = dark ? "#fff" : "#000";
  return (
    <svg width={s * n} height={s * n} style={{ position: "absolute", left: x, top: y, opacity: o, WebkitMaskImage: "radial-gradient(circle, #000 35%, transparent 72%)", maskImage: "radial-gradient(circle, #000 35%, transparent 72%)" }}>
      {new Array(n + 1).fill(0).map((_, i) => <g key={i}><line x1={i * s} y1={0} x2={i * s} y2={s * n} stroke={col} strokeWidth={1.5} /><line x1={0} y1={i * s} x2={s * n} y2={i * s} stroke={col} strokeWidth={1.5} /></g>)}
      {new Array((n + 1) * (n + 1)).fill(0).map((_, i) => <circle key={i} cx={(i % (n + 1)) * s} cy={Math.floor(i / (n + 1)) * s} r={4} fill={col} />)}
    </svg>
  );
};
const Barcode: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const t = useT(); const dark = useContext(Dark);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: ramp(t, at, at + 0.5), filter: `blur(${(1 - ramp(t, at, at + 0.5)) * 8}px)` }}>
      <div style={{ display: "flex", gap: 3, height: 62 }}>{[5, 2, 3, 6, 2, 2, 4, 7, 2, 3, 5, 2, 6, 3, 2, 4, 2, 6].map((w, i) => <div key={i} style={{ width: w, background: dark ? "#fff" : C.ink }} />)}</div>
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 13, letterSpacing: "0.2em", color: dark ? "#fff" : C.ink, marginTop: 8 }}>CS-2026-0001</div>
    </div>
  );
};
const Meta: React.FC<{ x: number; y: number; at: number; text?: string }> = ({ x, y, at, text = "INSTITUTO CS  ·  EDUCAÇÃO E SAÚDE" }) => {
  const t = useT(); const dark = useContext(Dark); const col = dark ? "rgba(255,255,255,.75)" : C.ink;
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12, opacity: ramp(t, at, at + 0.6), fontFamily: INTER, fontWeight: 700, fontSize: 15, letterSpacing: "0.2em", color: col }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: `conic-gradient(${col} 0 25%, transparent 0 50%, ${col} 0 75%, transparent 0)`, border: `2px solid ${col}` }} />
      <div style={{ padding: "3px 8px", borderRadius: 5, background: col, color: dark ? "#000" : C.cream }}>CS</div>{text}
    </div>
  );
};
const Ribbon: React.FC<{ d: string; at: number }> = ({ d, at }) => {
  const t = useT();
  return <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}><path d={d} fill="none" stroke={C.ribbon} strokeWidth={150} strokeLinecap="butt" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ramp(t, at, at + 0.9)} /></svg>;
};

// foto como objeto: recorte arredondado com sombra suave (claro) ou círculo com brilho e retícula (preto)
const Obj: React.FC<{ src: string; x: number; y: number; w: number; h: number; at: number; rot?: number; round?: boolean; gray?: boolean; pos?: string }> = ({ src, x, y, w, h, at, rot = 0, round, gray, pos = "50% 30%" }) => {
  const t = useT(); const dark = useContext(Dark);
  const p = sp(t, at); const drift = Math.sin((t - at) * 0.9) * 6;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h, opacity: ramp(t, at, at + 0.3, 0, 1, Easing.linear),
      transform: `translateY(${(1 - p) * 60 + drift}px) rotate(${rot + (1 - p) * 6}deg) scale(${0.82 + 0.18 * p})`, filter: `blur(${(1 - ramp(t, at, at + 0.45)) * 16}px)`,
    }}>
     <div style={{ position: "absolute", inset: 0, borderRadius: round ? "50%" : 10, overflow: "hidden", border: dark ? "none" : "16px solid #fdfbf6",
      boxShadow: dark ? "0 0 90px rgba(255,255,255,.28), 0 0 0 3px rgba(255,255,255,.9)" : "0 60px 80px -30px rgba(20,22,27,.5), 0 20px 30px -10px rgba(20,22,27,.22)" }}>
      <Img src={staticFile(`img/${src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${1.16 - 0.1 * ramp(t, at, at + 5, 0, 1, Easing.linear)})`, filter: gray || dark ? "grayscale(1) contrast(1.25) brightness(1.05)" : "saturate(.92) contrast(1.04)" }} />
      {dark ? <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,0,0,.55) 32%, transparent 34%)", backgroundSize: "9px 9px", mixBlendMode: "multiply" }} /> : null}
      {!dark ? <Img src={staticFile("tex/paper.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5, mixBlendMode: "multiply" }} /> : null}
     </div>
      {dark ? <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: -34, width: w + 68, height: h + 68, transform: `rotate(${(t - at) * 40}deg)` }}>
        <circle cx="50" cy="50" r="48.5" fill="none" stroke={C.gold} strokeWidth="0.7" strokeDasharray={`${ramp(t, at, at + 1) * 70} 400`} strokeLinecap="round" />
        <circle cx="50" cy="50" r="46.6" fill="none" stroke={C.blue} strokeWidth="0.5" strokeDasharray="2 5" opacity={0.7 * ramp(t, at + 0.2, at + 1)} /></svg>
        : <><div style={{ position: "absolute", left: "34%", top: -26, width: 190, height: 54, background: "rgba(232,199,122,.62)", transform: "rotate(-5deg)", boxShadow: "0 3px 6px rgba(0,0,0,.14)", opacity: ramp(t, at + 0.25, at + 0.45) }} />
            <div style={{ position: "absolute", right: 30, bottom: 26, fontFamily: INTER, fontWeight: 700, fontSize: 13, letterSpacing: "0.18em", color: "#fdfbf6", opacity: 0.85 }}>CS · {src.toUpperCase()}</div></>}
    </div>
  );
};

// linha de batimento (ECG): assinatura visual de saúde. "flat" = sem pulso
const Ecg: React.FC<{ y: number; at: number; flat?: boolean; speed?: number }> = ({ y, at, flat, speed = 0.55 }) => {
  const t = useT(); const beat = "l 96 0 l 12 -10 l 12 10 l 16 0 l 10 22 l 14 -120 l 14 150 l 12 -52 l 22 0 l 16 -16 l 18 16 l 28 0 ";
  const d = flat ? "M -20 0 L 1100 0" : "M -20 0 " + beat.repeat(5);
  const pr = ((t - at) * speed) % 1.25;
  return (
    <svg width={1080} height={320} style={{ position: "absolute", left: 0, top: y - 160, overflow: "visible", opacity: 0.8 * ramp(t, at, at + 0.4), filter: `drop-shadow(0 0 14px ${C.gold})` }}>
      <path d={d} transform="translate(0 160)" fill="none" stroke="rgba(232,199,122,.18)" strokeWidth={2.5} />
      <path d={d} transform="translate(0 160)" fill="none" stroke={C.gold} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="0.22 2" strokeDashoffset={0.22 - pr} />
    </svg>
  );
};
// traço desenhado (trim path) e faíscas ao redor da palavra de destaque
const Swoosh: React.FC<{ x: number; y: number; w: number; at: number; color?: string }> = ({ x, y, w, at, color }) => {
  const t = useT(); const dark = useContext(Dark);
  return (
    <svg width={w} height={50} viewBox="0 0 400 50" preserveAspectRatio="none" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <path d="M 6 30 C 90 8 180 44 260 22 C 310 9 360 26 394 16" fill="none" stroke={color ?? (dark ? C.gold : C.blueInk)} strokeWidth={dark ? 5 : 7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ramp(t, at, at + 0.55)} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};
const Burst: React.FC<{ x: number; y: number; at: number; n?: number }> = ({ x, y, at, n = 7 }) => {
  const t = useT(); const dark = useContext(Dark); const p = ramp(t, at, at + 0.55);
  if (t < at || p >= 1) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {new Array(n).fill(0).map((_, i) => { const a = -150 + (i * 120) / (n - 1); return (
        <div key={i} style={{ position: "absolute", width: 5, height: 34 * (1 - p) + 6, borderRadius: 5, background: dark ? C.gold : C.blueInk, opacity: 1 - p,
          transform: `rotate(${a + 90}deg) translateY(${-(40 + p * 80)}px)`, transformOrigin: "50% 0" }} />); })}
    </div>
  );
};

// cartão preso com alfinete + lista (como o cartão "Value" da referência)
const PinCard: React.FC<{ x: number; y: number; w: number; at: number; title: string; note: string; items: [string, number, boolean][] }> = ({ x, y, w, at, title, note, items }) => {
  const t = useT(); const p = sp(t, at, { damping: 13, stiffness: 110 });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transformOrigin: "50% 0", transform: `rotate(${(1 - p) * -14 + Math.sin((t - at) * 1.6) * 1.2 * Math.exp(-(t - at) * 0.5)}deg) scale(${0.7 + 0.3 * p})`, opacity: ramp(t, at, at + 0.25, 0, 1, Easing.linear), filter: `blur(${(1 - ramp(t, at, at + 0.4)) * 12}px)` }}>
      <div style={{ position: "relative", background: `linear-gradient(160deg, #16233f, ${C.navy})`, padding: "74px 56px 60px", boxShadow: "0 50px 70px -25px rgba(20,22,27,.55), 14px 18px 0 rgba(20,22,27,.08)" }}>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 104, letterSpacing: "-0.05em", color: "#fff", lineHeight: 1 }}>{title}</div>
        <div style={{ height: 6, background: C.gold, margin: "26px 0 34px", width: `${ramp(t, at + 0.2, at + 0.8) * 100}%` }} />
        {items.map(([label, when, ok], i) => {
          const q = ramp(t, when, when + 0.45);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 26, opacity: ramp(t, when, when + 0.25, 0, 1, Easing.linear), transform: `translateY(${(1 - q) * 16}px)`, filter: `blur(${(1 - q) * 10}px)` }}>
              <svg width="62" height="62" viewBox="0 0 62 62"><circle cx="31" cy="31" r="28" fill={ok ? C.gold : "none"} stroke={ok ? C.gold : "rgba(255,255,255,.75)"} strokeWidth="5" />
                {ok ? <path d="M18 32 L28 42 L45 22" fill="none" stroke={C.navy} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ramp(t, when + 0.1, when + 0.45)} />
                  : <path d="M20 20 L42 42 M42 20 L20 42" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="6" strokeLinecap="round" />}</svg>
              <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 60, letterSpacing: "-0.045em", color: "#fff" }}>{label}</div>
            </div>
          );
        })}
        <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 15, letterSpacing: "0.2em", color: "rgba(255,255,255,.4)", marginTop: 18 }}>{note}</div>
        <Img src={staticFile("tex/paper.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35, mixBlendMode: "overlay" }} />
      </div>
      <div style={{ position: "absolute", left: "50%", top: -34, marginLeft: -36, width: 72, height: 72, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff6da, ${C.gold} 45%, ${C.goldDim})`, boxShadow: "8px 14px 16px rgba(0,0,0,.35)" }} />
    </div>
  );
};

// ---------- logo Instituto CS ----------
const Logo: React.FC<{ size: number; lt: number }> = ({ size, lt }) => {
  const bg = sp(lt, 0, { damping: 12, stiffness: 110, mass: 0.9 });
  const ring1 = ramp(lt, 0.15, 1.0), ring2 = ramp(lt, 0.3, 1.2);
  const cs = sp(lt, 0.45, { damping: 11, stiffness: 120 });
  const arc = ramp(lt, 0.7, 1.4);
  const lines = ramp(lt, 0.95, 1.5);
  const sub = ramp(lt, 1.15, 1.7);
  const shine = ramp(lt, 1.6, 2.5, -1, 2, Easing.inOut(Easing.cubic));
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <div style={{
        position: "absolute", inset: -size * 0.045, borderRadius: "50%", opacity: bg,
        background: `conic-gradient(from ${220 + lt * 70}deg, ${C.blue}, ${C.gold} 35%, ${C.blueDeep} 65%, ${C.blue})`,
        filter: `blur(${size * 0.004}px)`, transform: `scale(${bg})`,
      }} />
      <div style={{ position: "absolute", inset: -size * 0.02, borderRadius: "50%", background: C.navy, transform: `scale(${bg})` }} />
      <svg viewBox="0 0 220 220" width={size} height={size} style={{ position: "absolute", inset: 0, transform: `scale(${bg}) rotate(${(1 - bg) * -90}deg)` }}>
        <defs>
          <radialGradient id="badgeBg" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#2a5fa8" /><stop offset="55%" stopColor="#1b4f91" /><stop offset="100%" stopColor="#0d2547" />
          </radialGradient>
          <path id="arcTop" d="M 36 118 A 74 74 0 1 1 184 118" fill="none" />
          <clipPath id="badgeClip"><circle cx="110" cy="110" r="108" /></clipPath>
        </defs>
        <circle cx="110" cy="110" r="108" fill="url(#badgeBg)" />
        <circle cx="110" cy="110" r="99" fill="none" stroke={C.gold} strokeWidth="1.2" opacity="0.85" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring1} transform="rotate(-90 110 110)" />
        <circle cx="110" cy="110" r="93" fill="none" stroke={C.gold} strokeWidth="0.6" opacity="0.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring2} transform="rotate(90 110 110)" />
        <text fontFamily={INTER} fontSize="10.5" fontWeight="700" letterSpacing={3 + (1 - arc) * 6} fill={C.goldSoft} opacity={arc}>
          <textPath href="#arcTop" startOffset="50%" textAnchor="middle">INSTITUTO CS</textPath>
        </text>
        <g transform={`translate(110 110) scale(${0.3 + 0.7 * cs}) translate(-110 -110)`} opacity={Math.min(1, cs * 1.4)}>
          <text x="110" y="128" textAnchor="middle" fontFamily={SERIF} fontSize="54" fontWeight="600" fill={C.goldSoft}>CS</text>
        </g>
        <line x1={94 - 24 * lines} y1="140" x2="94" y2="140" stroke={C.gold} strokeWidth="1" opacity="0.7" />
        <line x1="126" y1="140" x2={126 + 24 * lines} y2="140" stroke={C.gold} strokeWidth="1" opacity="0.7" />
        <text x="110" y="152" textAnchor="middle" fontFamily={INTER} fontSize="7.5" letterSpacing={2 + (1 - sub) * 3} fill="#c9d3de" opacity={sub}>EDUCAÇÃO E SAÚDE</text>
        <g clipPath="url(#badgeClip)">
          <rect x={shine * 220 - 40} y="-20" width="46" height="260" fill="rgba(255,255,255,.28)" transform="skewX(-20)" />
        </g>
      </svg>
    </div>
  );
};

// ---------- cenas ----------
const S1: React.FC = () => (
  <>
    <Grid x={420} y={560} at={0.1} />
    <Obj src="diploma" x={-190} y={470} w={560} h={820} at={0} rot={-7} pos="60% 60%" />
    <Barcode x={770} y={390} at={0.2} />
    <div style={{ position: "absolute", left: 420, top: 760 }}>
      <L><K at={0.0}>Você</K><K at={0.14} last>passou</K></L>
      <L indent={40} mt={-6}><K at={0.46} hi>anos</K><K at={0.84} last>na</K></L>
      <L indent={-20} mt={-14}><K at={1.02} hi last>faculdade</K></L>
    </div>
    <Swoosh x={410} y={1045} w={560} at={1.15} />
    <Burst x={900} y={860} at={0.5} />
    <Meta x={420} y={1240} at={0.5} />
  </>
);
const S2: React.FC = () => (
  <>
    <Ecg y={1330} at={1.7} speed={0.8} />
    <Obj src="estudo" x={330} y={420} w={420} h={420} at={1.6} round pos="55% 35%" />
    <Burst x={930} y={1010} at={2.75} />
    <Grid x={250} y={760} at={1.7} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 910, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <L><K at={1.6}>e</K><K at={1.98}>ainda</K><K at={2.24}>se</K><K at={2.42} last>sente</K></L>
      <L mt={-4}><K at={2.7} hi size={132} last>despreparado</K></L>
      <L mt={6}><K at={3.48}>para</K><K at={3.64}>atuar</K><K at={3.9}>na</K><K at={4.06}>sua</K><K at={4.28} last style={{ fontWeight: 700 }}>área?</K></L>
    </div>
  </>
);
const S3: React.FC = () => (
  <>
    <Ribbon d="M 420 -100 C 760 300 300 900 620 1300 C 800 1560 900 1800 1000 2100" at={4.72} />
    <PinCard x={230} y={420} w={620} at={4.76} title="Diploma" note="VÁLIDO SÓ NO PAPEL  ·  Nº 0000" items={[["Sem prática", 5.28, false], ["Sem segurança", 5.62, false], ["Sem pacientes", 5.9, false]]} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1240, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <L><K at={4.74}>O</K><K at={4.84}>diploma</K><K at={5.28}>não</K><K at={5.62} last>é</K></L>
      <L mt={-6}><K at={5.8} hi last>suficiente.</K></L>
    </div>
  </>
);
const S4: React.FC = () => (
  <>
    <Ecg y={1330} at={6.9} flat />
    <Obj src="estudo2" x={350} y={470} w={380} h={380} at={6.84} round pos="50% 40%" />
    <Clock x={742} y={470} at={7.1} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 930, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <L><K at={6.84}>Enquanto</K><K at={7.38} last>uns</K></L>
      <L mt={-4}><K at={7.62} hi last>esperam</K></L>
      <L mt={4}><K at={8.12}>a</K><K at={8.2} last>oportunidade,</K></L>
    </div>
  </>
);
const S5: React.FC = () => (
  <>
    <Ribbon d="M 1180 200 C 700 500 900 1000 500 1300 C 300 1460 200 1700 100 2100" at={9.34} />
    <Obj src="medico" x={560} y={360} w={470} h={600} at={9.4} rot={5} pos="50% 20%" />
    <Grid x={40} y={820} at={9.5} />
    <div style={{ position: "absolute", left: 90, top: 1010, transform: "rotate(-4deg)" }}>
      <L><K at={9.34}>outros</K><K at={9.6} last>já</K></L>
      <L indent={30} mt={-8}><K at={9.84} hi size={150}>saem</K></L>
      <L indent={90} mt={-18}><K at={10.22} hi size={150}>na</K><K at={10.32} hi size={150} last>frente.</K></L>
    </div>
    <Burst x={610} y={1120} at={9.9} />
    <Meta x={120} y={1500} at={9.9} text="EM MOVIMENTO  ·  8°01′S 50°01′W" />
  </>
);
const S6: React.FC = () => (
  <>
    <Ecg y={1330} at={10.95} speed={1.1} />
    <Obj src="enfermeiro" x={320} y={400} w={440} h={440} at={10.92} round pos="50% 15%" />
    <Burst x={800} y={1000} at={11.6} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 920, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <L><K at={10.9}>E</K><K at={10.98}>se</K><K at={11.04} last>existisse</K></L>
      <L mt={-4}><K at={11.58} hi>um</K><K at={11.72} hi last>jeito</K></L>
      <L mt={8}><K at={11.92}>de</K><K at={12.16}>sair</K><K at={12.46}>da</K><K at={12.64} last>faculdade</K></L>
    </div>
  </>
);
const S7: React.FC = () => {
  const t = useT();
  return (
    <>
      <Grid x={470} y={520} at={13.2} />
      <Obj src="medico2" x={-150} y={430} w={540} h={860} at={13.12} rot={-6} pos="50% 20%" />
      <Barcode x={790} y={390} at={13.3} />
      <Burst x={860} y={800} at={13.35} />
      <div style={{ position: "absolute", left: 440, top: 760 }}>
        <L><K at={13.12} hi size={150}>já</K></L>
        <L indent={-10} mt={-22}><K at={13.32} hi size={150} last>pronto</K></L>
        <L indent={20} mt={2}><K at={13.62}>pra</K><K at={13.84} last>atuar,</K></L>
        <L indent={0} mt={26}><K at={14.42} size={50}>sem</K><K at={14.66} size={50}>depender</K><K at={15.06} size={50}>de</K>
          <span style={{ position: "relative" }}><K at={15.28} size={50} last style={{ fontWeight: 700 }}>sorte?</K>
            <span style={{ position: "absolute", left: -4, top: "56%", height: 5, width: `${ramp(t, 15.45, 15.75) * 106}%`, background: C.blueInk, borderRadius: 5 }} /></span></L>
      </div>
    </>
  );
};
// relógio que anda rápido enquanto "uns esperam"
const Clock: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const t = useT(); const p = sp(t, at, { damping: 11 });
  return (
    <svg width={120} height={120} viewBox="0 0 100 100" style={{ position: "absolute", left: x, top: y, transform: `scale(${p})`, filter: "drop-shadow(0 0 16px rgba(255,255,255,.5))" }}>
      <circle cx="50" cy="50" r="45" fill="#000" stroke="#fff" strokeWidth="4" />
      {new Array(12).fill(0).map((_, i) => <line key={i} x1="50" y1="9" x2="50" y2={i % 3 ? 13 : 17} stroke="#fff" strokeWidth="2.5" transform={`rotate(${i * 30} 50 50)`} />)}
      <line x1="50" y1="50" x2="50" y2="26" stroke="#fff" strokeWidth="5" strokeLinecap="round" transform={`rotate(${(t - at) * 40} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="16" stroke={C.gold} strokeWidth="3" strokeLinecap="round" transform={`rotate(${(t - at) * 480} 50 50)`} />
      <circle cx="50" cy="50" r="4" fill={C.gold} />
    </svg>
  );
};
const AREAS: [string, string][] = [["odonto", "Odonto"], ["fisio", "Fisio"], ["enfermeira", "Enfermagem"], ["estetica", "Estética"], ["biomed", "Biomedicina"]];
const S8: React.FC = () => {
  const t = useT();
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", filter: "drop-shadow(0 0 60px rgba(62,123,250,.7))" }}><Logo size={230} lt={(t - 15.9) * 1.5} /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <L><K at={15.88}>Está</K><K at={16.06} last>chegando</K></L>
        <L mt={-6}><K at={16.5} hi size={156}>algo</K><K at={16.72} hi size={156} last>novo</K></L>
      </div>
      <Ecg y={1560} at={16.0} speed={1.0} />
      <Burst x={860} y={720} at={16.55} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 990, display: "flex", justifyContent: "space-between" }}>
        {AREAS.map(([src, label], i) => {
          const at = 17.05 + i * 0.16, p = sp(t, at);
          return (
            <div key={i} style={{ width: 176, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: ramp(t, at, at + 0.25, 0, 1, Easing.linear), transform: `translateY(${(1 - p) * 50 + (i % 2 ? 46 : 0)}px) scale(${0.7 + 0.3 * p})`, filter: `blur(${(1 - ramp(t, at, at + 0.4)) * 12}px)` }}>
              <div style={{ width: 176, height: 176, borderRadius: "50%", overflow: "hidden", boxShadow: "0 0 50px rgba(255,255,255,.22), 0 0 0 3px rgba(255,255,255,.9)" }}>
                <Img src={staticFile(`img/${src}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.2)" }} />
              </div>
              <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 25, letterSpacing: "-0.02em", color: "#fff", textShadow: "0 0 20px rgba(255,255,255,.5)" }}>{label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1350, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <L><K at={17.1} size={52}>pra</K><K at={17.42} size={52}>quem</K><K at={17.58} size={52}>quer</K><K at={17.76} size={52}>sair</K><K at={18.06} size={52}>na</K><K at={18.2} size={52} last>frente</K></L>
        <L mt={-2}><K at={18.5} hi size={110}>na</K><K at={18.68} hi size={110} last>saúde.</K></L>
      </div>
    </>
  );
};
const S9: React.FC = () => (
  <>
    <Ribbon d="M 300 -100 C 640 300 240 820 560 1250 C 760 1520 860 1800 980 2100" at={19.38} />
    <PinCard x={190} y={470} w={700} at={19.4} title="Instituto CS" note="CURSOS RÁPIDOS  ·  LOTE 01/2026" items={[["Prático", 19.4, true], ["Rápido", 20.36, true], ["Com resultado", 21.16, true]]} />
    <Meta x={330} y={1440} at={19.8} />
  </>
);
const S10: React.FC = () => {
  const t = useT();
  const pressT = 24.92, followed = t >= pressT;
  const rise = sp(t, 22.3, { damping: 17, stiffness: 90 });
  const cur = ramp(t, 24.15, 24.85, 0, 1, Easing.inOut(Easing.cubic));
  const press = followed ? 1 : ramp(t, pressT - 0.1, pressT, 1, 0.93);
  const rip = ramp(t, pressT, pressT + 0.6);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <L><K at={22.08} hi>Em</K><K at={22.24} hi last>breve,</K></L>
        <L mt={2}><K at={22.88} size={56}>tudo</K><K at={23.02} size={56}>isso</K><K at={23.46} size={56}>vai</K><K at={23.64} size={56}>estar</K><K at={23.84} size={56} last style={{ fontWeight: 700 }}>aqui.</K></L>
      </div>
      <div style={{ position: "absolute", left: 130, top: 640, width: 820, borderRadius: 44, background: "#fff", padding: 46, boxShadow: "0 70px 90px -30px rgba(20,22,27,.4), 0 20px 30px -10px rgba(20,22,27,.14)",
        opacity: ramp(t, 22.3, 22.6, 0, 1, Easing.linear), transform: `translateY(${(1 - rise) * 120}px) scale(${0.9 + 0.1 * rise})`, filter: `blur(${(1 - ramp(t, 22.3, 22.8)) * 14}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <Logo size={170} lt={t - 22.4} />
          <div>
            <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 46, letterSpacing: "-0.04em", color: C.ink }}>institutocs.edu</div>
            <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 30, letterSpacing: "-0.02em", color: C.inkSoft, marginTop: 6 }}>Instituto CS | Educação e Saúde</div>
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 24, color: followed ? C.blueInk : C.inkSoft, marginTop: 8 }}>{followed ? "46 seguidores  (+1: você)" : "45 seguidores"}</div>
          </div>
        </div>
        <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 31, lineHeight: 1.5, letterSpacing: "-0.02em", color: C.ink, marginTop: 30 }}>Cursos rápidos na área da saúde<br /><span style={{ color: C.inkSoft }}>Odontologia · Fisioterapia · Enfermagem · Estética · Biomedicina</span></div>
        <div style={{ position: "relative", marginTop: 34, padding: "26px 0", borderRadius: 20, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: 40, letterSpacing: "-0.03em",
          color: followed ? C.ink : "#fff", background: followed ? "#eceae5" : C.blueInk, transform: `scale(${press})` }}>{followed ? "Seguindo ✓" : "Seguir"}</div>
        <div style={{ position: "absolute", left: 410 - rip * 260, top: 468 - rip * 260, width: rip * 520, height: rip * 520, borderRadius: "50%", background: "rgba(31,95,224,.22)", border: `5px solid ${C.blueInk}`, opacity: followed ? 1 - rip : 0 }} />
        <div style={{ position: "absolute", left: 640 - cur * 265, top: 640 - cur * 205, width: 70, height: 70, borderRadius: "50%", background: "rgba(20,22,27,.16)", border: `4px solid ${C.ink}`, opacity: ramp(t, 24.05, 24.2) * (1 - ramp(t, 25.0, 25.2)), transform: `scale(${followed ? 0.8 : 1})` }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1250, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <L><K at={24.68} hi size={150}>Segue</K><K at={24.92} hi size={150} last>agora</K></L>
        <L mt={6}><K at={25.28} size={54}>pra</K><K at={25.64} size={54}>não</K><K at={25.86} size={54}>perder</K><K at={26.18} size={54} last style={{ fontWeight: 700 }}>o lançamento</K></L>
      </div>
    </>
  );
};
const S11: React.FC = () => {
  const t = useT(); const lt = t - 27.25;
  const name = ramp(lt, 1.2, 2.0), tag = ramp(lt, 1.6, 2.4), pill = ramp(lt, 2.1, 2.8), cta = ramp(lt, 2.6, 3.3);
  const soft = (p: number): React.CSSProperties => ({ opacity: p, transform: `translateY(${(1 - p) * 18}px)`, filter: `blur(${(1 - p) * 14}px)` });
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(circle 700px at 50% 37%, rgba(62,123,250,${0.34 * ramp(lt, 0, 1.5)}), transparent 70%)` }} />
      {[0, 1].map((i) => { const r = ramp(lt, 0.2 + i * 0.35, 2.2 + i * 0.35, 0, 1, Easing.out(Easing.cubic)); return <div key={i} style={{ position: "absolute", left: 540 - 250 - r * 380, top: 710 - 250 - r * 380, width: 500 + r * 760, height: 500 + r * 760, borderRadius: "50%", border: `1.5px solid ${C.gold}`, opacity: (1 - r) * 0.55 }} />; })}
      <div style={{ position: "absolute", left: 290, top: 460, filter: "drop-shadow(0 0 80px rgba(62,123,250,.6))" }}><Logo size={500} lt={lt} /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 104, letterSpacing: "-0.055em", color: "#fff", textShadow: "0 0 40px rgba(255,255,255,.4)", ...soft(name) }}>Instituto CS</div>
        <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, letterSpacing: "0.34em", color: C.goldSoft, marginTop: 10, ...soft(tag) }}>EDUCAÇÃO E SAÚDE</div>
        <div style={{ marginTop: 70, padding: "22px 52px", borderRadius: 999, background: C.gold, fontFamily: INTER, fontWeight: 700, fontSize: 48, letterSpacing: "-0.03em", color: C.navy, boxShadow: "0 0 80px rgba(232,199,122,.5)", ...soft(pill) }}>@institutocs.edu</div>
        <div style={{ marginTop: 40, fontFamily: INTER, fontWeight: 500, fontSize: 40, letterSpacing: "-0.03em", color: "rgba(255,255,255,.7)", ...soft(cta) }}>Siga. O lançamento está chegando.</div>
        <div style={{ marginTop: 150, fontFamily: INTER, fontWeight: 600, fontSize: 15, letterSpacing: "0.3em", color: "rgba(255,255,255,.3)", ...soft(cta) }}>MOTION POR QIROIZ  ·  REDENÇÃO, PA</div>
      </div>
    </>
  );
};

const LABELS: [number, string][] = [[0, "01 — GANCHO"], [4.72, "02 — DOR"], [10.9, "03 — VIRADA"], [15.88, "04 — REVELAÇÃO"], [22.06, "05 — CHAMADA"], [27.25, "FIM — EM BREVE"]];
const Hud: React.FC = () => {
  const t = useT(); const f = Math.floor(t * FPS);
  const tc = `00:00:${String(Math.floor(t)).padStart(2, "0")}:${String(f % FPS).padStart(2, "0")}`;
  let li = 0; LABELS.forEach(([s], i) => { if (t >= s) li = i; });
  const lp = ramp(t, LABELS[li][0], LABELS[li][0] + 0.5);
  const mark = (x: number, y: number) => <g key={`${x}${y}`} stroke="#fff" strokeWidth="2"><line x1={x - 14} y1={y} x2={x + 14} y2={y} /><line x1={x} y1={y - 14} x2={x} y2={y + 14} /><circle cx={x} cy={y} r="7" fill="none" /></g>;
  return (
    <AbsoluteFill style={{ mixBlendMode: "difference", opacity: 0.7 }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>{[[64, 110], [64, 1600], [1016, 1600]].map(([x, y]) => mark(x, y))}</svg>
      <div style={{ position: "absolute", left: 100, top: 96, fontFamily: INTER, fontWeight: 600, fontSize: 17, letterSpacing: "0.18em", color: "#fff", lineHeight: 1.7 }}>
        <div>CS_SOBRE-OS-CURSOS  ·  {tc}</div>
        <div style={{ opacity: lp, transform: `translateX(${(1 - lp) * -20}px)` }}>{LABELS[li][1]}</div>
      </div>
      <svg width={150} height={150} viewBox="0 0 150 150" style={{ position: "absolute", left: 880, top: 60, transform: `rotate(${t * 22}deg)` }}>
        <defs><path id="seal" d="M 75 75 m -56 0 a 56 56 0 1 1 112 0 a 56 56 0 1 1 -112 0" /></defs>
        <text fontFamily={INTER} fontWeight="700" fontSize="13.5" letterSpacing="3.1" fill="#fff"><textPath href="#seal">INSTITUTO CS • EDUCAÇÃO E SAÚDE • EM BREVE • </textPath></text>
        <text x="75" y="88" textAnchor="middle" fontFamily={SERIF} fontWeight="600" fontSize="38" fill="#fff" transform={`rotate(${-t * 22} 75 75)`}>CS</text>
      </svg>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const t = useT();
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const fams = ["400 60px Inter", "500 60px Inter", "600 60px Inter", "700 60px Inter", "800 60px Inter", "600 60px 'Cormorant Garamond'"];
    Promise.all(fams.map((f) => document.fonts.load(f, "ÁÉãç"))).then(() => document.fonts.ready).then(() => continueRender(h));
  }, [h]);
  return (
    <AbsoluteFill style={{ background: "#000", opacity: ramp(t, TOTAL - 0.5, TOTAL, 1, 0, Easing.linear) }}>
      <Scene from={0} to={1.6}><S1 /></Scene>
      <Scene from={1.6} to={4.72} dark><S2 /></Scene>
      <Scene from={4.72} to={6.82}><S3 /></Scene>
      <Scene from={6.82} to={9.95} dark><S4 /></Scene>
      <Scene from={9.34} to={10.9} wipe={[540, 660]} tilt={2}><S5 /></Scene>
      <Scene from={10.9} to={13.12} dark><S6 /></Scene>
      <Scene from={13.12} to={15.88}><S7 /></Scene>
      <Scene from={15.88} to={19.38} dark><S8 /></Scene>
      <Scene from={19.38} to={22.06}><S9 /></Scene>
      <Scene from={22.06} to={27.9}><S10 /></Scene>
      <Scene from={27.0} to={TOTAL + 1} dark wipe={[540, 1108]}><S11 /></Scene>
      <Hud />
      <Img src={staticFile(`tex/grain${Math.floor(t * 12) % 4}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.16, mixBlendMode: "overlay" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, transparent 60%, rgba(0,0,0,.28) 100%)" }} />
      <Audio src={staticFile("audio/voz.wav")} />
      <Audio src={staticFile("audio/trilha.wav")} volume={(f) => interpolate(f / FPS, [0, 26.6, 27.2], [0.26, 0.26, 0.8], cl)} />
    </AbsoluteFill>
  );
};
