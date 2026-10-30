import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Eye, EyeOff, Sparkles, KeyRound, Lock } from "lucide-react";
import { CORRECT_PASSWORDS, WRONG_MESSAGES } from "../data/content";

export default function SecretEntry({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [show, setShow] = useState(false);
  const [opening, setOpening] = useState(false);
  const [tries, setTries] = useState(0);

  const submit = () => {
    if (opening) return;
    const clean = pw.trim().toLowerCase();
    if (CORRECT_PASSWORDS.includes(clean)) {
      setErr(""); setOpening(true);
      confetti({ particleCount: 130, spread: 100, origin: { y: 0.45 }, colors: ["#f3d894", "#ff8fb2", "#fff3cf", "#c9a35c"] });
      setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors: ["#ff8fb2", "#f3d894"] }), 400);
      setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors: ["#ff8fb2", "#f3d894"] }), 600);
      setTimeout(onUnlock, 2300);
    } else {
      setTries((t) => t + 1);
      setErr(WRONG_MESSAGES[tries % WRONG_MESSAGES.length]);
      setShakeKey((k) => k + 1);
    }
  };

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* candle glows */}
      <div className="pointer-events-none absolute bottom-[-60px] left-[-60px] h-[320px] w-[320px] rounded-full opacity-70" style={{ background: "radial-gradient(circle, rgba(255,170,80,.22), transparent 65%)", animation: "twinkle 3.4s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute bottom-[-40px] right-[-70px] h-[360px] w-[360px] rounded-full opacity-70" style={{ background: "radial-gradient(circle, rgba(255,120,150,.2), transparent 65%)", animation: "twinkle 4.2s ease-in-out infinite 1s" }} />
      <div className="spotlight pointer-events-none absolute inset-x-0 top-0 mx-auto h-[62vh] w-[min(760px,94vw)]" />

      {/* falling petals */}
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="pointer-events-none absolute top-[-30px] text-[14px]" style={{
          left: `${(i * 83) % 100}%`, animation: `petalFall ${6 + (i % 5)}s linear ${i * 0.9}s infinite`,
          color: i % 3 === 0 ? "#ffb3c8" : i % 3 === 1 ? "#f3d894" : "#ff7ba0", opacity: .8,
        }}>{i % 2 ? "❀" : "♥"}</span>
      ))}

      {/* corner flourishes */}
      <svg className="pointer-events-none absolute left-3 top-3 h-24 w-24 text-[#c9a35c]/40 sm:left-6 sm:top-6" viewBox="0 0 100 100" fill="none">
        <path d="M4 60 C4 20 20 4 60 4 M4 40 C10 16 16 10 40 4 M8 96 C6 70 10 50 22 38" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="62" cy="4" r="2.4" fill="currentColor" /><circle cx="4" cy="62" r="2.4" fill="currentColor" />
      </svg>
      <svg className="pointer-events-none absolute bottom-3 right-3 h-24 w-24 rotate-180 text-[#c9a35c]/40 sm:bottom-6 sm:right-6" viewBox="0 0 100 100" fill="none">
        <path d="M4 60 C4 20 20 4 60 4 M4 40 C10 16 16 10 40 4 M8 96 C6 70 10 50 22 38" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="62" cy="4" r="2.4" fill="currentColor" /><circle cx="4" cy="62" r="2.4" fill="currentColor" />
      </svg>

      <div className="relative z-10 w-full max-w-[480px]">
        {/* header */}
        <div className="mb-5 flex items-center justify-between">
          <motion.span initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}
            className="-rotate-3 rounded border-2 border-dashed border-[#e8a07a]/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8a07a]">
            Confidential
          </motion.span>
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4 }} className="flex items-center gap-2">
            <span className="flex h-11 w-11 rotate-6 items-center justify-center rounded-full border-2 border-dashed border-white/25 text-center text-[7px] font-bold uppercase leading-[1.2] tracking-widest text-white/45">3am<br />only ♥</span>
            <span className="rotate-2 rounded border border-[#c9a35c]/40 bg-[#c9a35c]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3d894]">par avion</span>
          </motion.div>
        </div>

        <div className="text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.4em] text-[#c9a35c]">sealed with love • open only if you're her</p>
          <h1 className="font-display text-[38px] font-bold leading-[1.08] sm:text-[46px]">
            <span className="gold-text">Confirm for Uhh</span>
            <motion.span animate={{ rotate: [0, -14, 10, -6, 0], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 3.4, repeatDelay: 1.4 }}
              className="ml-2 inline-block text-[34px] sm:text-[40px]">💌</motion.span>
          </h1>
          <p className="mt-2 font-serif2 text-[17px] italic text-white/65">ek chhota sa universe — sirf tumhare liye banaya hai</p>
        </div>

        {/* ===== THE ENVELOPE ===== */}
        <motion.div key={shakeKey} animate={err && !opening ? { x: [0, -12, 10, -7, 5, 0], rotate: [0, -2, 2, -1, 0] } : { x: 0, rotate: 0 }} transition={{ duration: .55 }}
          className="relative mx-auto mt-6 w-full max-w-[380px]" style={{ perspective: "1100px" }}>
          <motion.div animate={{ y: [0, -9, 0] }} transition={{ repeat: Infinity, duration: 4.4, ease: "easeInOut" }} className="relative">
            {/* shadow */}
            <div className="absolute -bottom-7 left-1/2 h-6 w-[76%] -translate-x-1/2 rounded-[100%] bg-black/70 blur-lg" />

            <div className="relative h-[230px] w-full sm:h-[250px]">
              {/* back */}
              <div className="absolute inset-0 rounded-[14px]" style={{ background: "linear-gradient(160deg, #6e1128 0%, #4a0c1e 55%, #2a0410 100%)", boxShadow: "0 30px 70px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.14)" }} />
              {/* inner lining peek */}
              <div className="absolute inset-[7px] rounded-[10px]" style={{ background: "repeating-linear-gradient(45deg, #38081a 0 10px, #2a0410 10px 20px)" }} />

              {/* letter inside */}
              <motion.div animate={opening ? { y: "-62%", rotate: -2 } : { y: "4%", rotate: 0 }} transition={{ duration: 1.1, delay: .55, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute left-1/2 top-1/2 z-[1] h-[82%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-[10px] px-5 py-4"
                style={{ background: "linear-gradient(175deg, #fdf6e3, #f1e0b8)", boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
                <div className="paper-lines h-full w-full opacity-70">
                  <p className="font-script pt-2 text-center text-[30px] leading-tight text-[#7a1029]">you found it…</p>
                  <p className="text-center font-serif2 text-[13px] italic text-[#6e4211]">ab andar aao, my love ♥</p>
                  <div className="mx-auto mt-2 flex w-fit gap-1">{[0, 1, 2].map((i) => (<motion.span key={i} animate={opening ? { scale: [0, 1.4, 1] } : {}} transition={{ delay: 1.2 + i * .18 }} className="text-[16px] text-[#a41236]">♥</motion.span>))}</div>
                </div>
              </motion.div>

              {/* front pocket */}
              <div className="absolute inset-0 z-[2] rounded-[14px]" style={{ clipPath: "polygon(0% 100%, 0% 30%, 50% 66%, 100% 30%, 100% 100%)", background: "linear-gradient(180deg, #82152f 0%, #5c0d20 45%, #38081a 100%)", boxShadow: "inset 0 8px 20px rgba(255,150,175,.1), inset 0 -14px 30px rgba(0,0,0,.5)" }} />
              {/* pocket gold edge */}
              <div className="absolute inset-0 z-[2]" style={{ clipPath: "polygon(0% 30%, 50% 66%, 100% 30%, 100% 32.5%, 50% 68.5%, 0% 32.5%)", background: "linear-gradient(90deg, #9a6b1f, #f3d894, #9a6b1f)", opacity: .8 }} />
              {/* side folds */}
              <div className="absolute inset-0 z-[2] rounded-[14px] opacity-50" style={{ clipPath: "polygon(0% 30%, 0% 100%, 30% 100%)", background: "linear-gradient(120deg, rgba(0,0,0,.55), transparent)" }} />
              <div className="absolute inset-0 z-[2] rounded-[14px] opacity-50" style={{ clipPath: "polygon(100% 30%, 70% 100%, 100% 100%)", background: "linear-gradient(240deg, rgba(0,0,0,.55), transparent)" }} />

              {/* address */}
              <div className="absolute bottom-5 left-1/2 z-[3] w-[70%] -translate-x-1/2 text-center">
                <p className="font-script text-[24px] leading-none text-[#f9e7b2]">To — Uhh, the birthday girl</p>
                <div className="mx-auto mt-1 h-px w-3/4 bg-gradient-to-r from-transparent via-[#c9a35c]/70 to-transparent" />
                <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-[#e8c476]/70">from — the one who loves you most</p>
              </div>

              {/* flap */}
              <motion.div animate={opening ? { rotateX: 178, zIndex: 0 } : { rotateX: 0, zIndex: 4 }}
                transition={{ duration: .95, delay: .1, ease: [0.6, 0, 0.3, 1] }}
                className="absolute inset-x-0 top-0 z-[4] h-[62%] origin-top rounded-t-[14px]"
                style={{ clipPath: "polygon(0% 0%, 100% 0%, 50% 96%)", background: "linear-gradient(180deg, #8a1834 0%, #6e1128 50%, #4a0c1e 100%)", boxShadow: "0 12px 26px rgba(0,0,0,.5)", backfaceVisibility: "hidden" }}>
                <div className="absolute inset-0" style={{ clipPath: "polygon(0% 0%, 100% 0%, 50% 96%)", background: "radial-gradient(90% 60% at 50% 0%, rgba(255,180,200,.16), transparent 60%)" }} />
                {/* gold trim on flap edge */}
                <div className="absolute inset-0" style={{ clipPath: "polygon(48.6% 90%, 51.4% 90%, 50% 96%)", background: "#f3d894" }} />
              </motion.div>

              {/* wax seal */}
              <motion.div animate={opening ? { scale: [1, 1.3, 0], rotate: [0, 24, 60], opacity: [1, 1, 0] } : pw ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={opening ? { duration: .7 } : { duration: .5, repeat: pw ? Infinity : 0, repeatDelay: 1.2 }}
                className="absolute left-1/2 top-[52%] z-[5] flex h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                style={{ background: "radial-gradient(circle at 34% 28%, #e85d80 0%, #b01d42 42%, #7a1029 78%, #4a0818 100%)", boxShadow: "0 6px 18px rgba(0,0,0,.6), inset 0 2px 5px rgba(255,255,255,.35), inset 0 -4px 8px rgba(0,0,0,.45), 0 0 26px rgba(255,110,150,.4)" }}>
                <span className="absolute inset-[7px] rounded-full border border-[#f3d894]/45" />
                <span className="font-script text-[26px] leading-none text-[#f9e7b2] drop-shadow-[0_1px_2px_rgba(0,0,0,.6)]">U♥</span>
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="absolute h-2 w-2 rounded-full" style={{ background: "#7a1029", left: `${[6, 88, -4, 96, 40, 55][i]}%`, top: `${[30, 26, 78, 70, -6, 98][i]}%`, boxShadow: "inset 0 1px 2px rgba(255,255,255,.3)" }} />
                ))}
              </motion.div>

              {/* orbiting hearts */}
              {!opening && [0, 1, 2].map((i) => (
                <motion.span key={i} className="absolute left-1/2 top-1/2 z-[6] text-[13px] text-pink-300"
                  animate={{ x: [Math.cos(i * 2.1) * 120, Math.cos(i * 2.1 + Math.PI) * 120, Math.cos(i * 2.1) * 120], y: [Math.sin(i * 2.1) * 62, Math.sin(i * 2.1 + Math.PI) * 62, Math.sin(i * 2.1) * 62], opacity: [0.2, 0.9, 0.2] }}
                  transition={{ repeat: Infinity, duration: 6 + i, ease: "easeInOut" }}>♥</motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ===== PASSWORD PANEL ===== */}
        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25, duration: .7 }}
          className="relative mt-9 rounded-[18px] border border-[#c9a35c]/30 bg-[#12070f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,.6)] backdrop-blur-md sm:p-6">
          {/* corner ticks */}
          {[["left-2 top-2 border-l border-t"], ["right-2 top-2 border-r border-t"], ["left-2 bottom-2 border-l border-b"], ["right-2 bottom-2 border-r border-b"]].map((c, i) => (
            <span key={i} className={`absolute h-3.5 w-3.5 border-[#c9a35c]/60 ${c[0]}`} />
          ))}

          <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-white/55">
            <KeyRound size={13} className="text-[#e8c476]" /> Secret password <span className="ml-auto flex items-center gap-1 text-[10px] normal-case tracking-normal text-white/30"><Lock size={10} /> encrypted with kisses</span>
          </label>
          <div className="gold-border overflow-hidden rounded-xl">
            <div className="flex items-center bg-[#0d050b]/95 px-4">
              <span className="font-script text-[22px] text-[#c9a35c]/80">❧</span>
              <input value={pw} onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                type={show ? "text" : "password"} placeholder="yahan dheere se bolo…"
                className="w-full bg-transparent px-3 py-3.5 text-[16px] tracking-[0.18em] text-[#fdf3d8] placeholder:tracking-normal placeholder:text-white/25 focus:outline-none" />
              <button onClick={() => setShow(!show)} className="text-white/40 transition-colors hover:text-white/85">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>

          <div className="mt-2.5 min-h-[26px]">
            <AnimatePresence mode="wait">
              {err ? (
                <motion.p key={err + tries} initial={{ opacity: 0, y: 8, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-center text-[14px] font-medium text-pink-300">{err}</motion.p>
              ) : (
                <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-center text-[12.5px] text-white/40">🌙 hint: wahi naam jo main tumhe raat ko 3am pe pyaar se bulata hu</motion.p>
              )}
            </AnimatePresence>
          </div>

          <button onClick={submit} disabled={opening}
            className="btn-gold mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold tracking-wide disabled:opacity-70">
            {opening ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1d0f04]/30 border-t-[#1d0f04]" /> seal khul raha hai…</>) : (<>Unlock my world <Sparkles size={16} /></>)}
          </button>
          <AnimatePresence>
            {opening && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                <p className="pt-3 text-center font-script text-[27px] text-pink-200 script-glow">haan… sach mein tum ho. andar aao, jaan.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-5 text-center text-[10px] uppercase tracking-[0.35em] text-white/25">handcrafted with love • chapter 01 of 11</p>
      </div>
    </div>
  );
}
