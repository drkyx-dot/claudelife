"use strict";
/* =====================================================================
   ui/sound.js — SoundManager 100% procedural (Web Audio API).
   Nenhum arquivo externo: cada efeito é sintetizado com osciladores e
   ruído filtrado, então funciona offline e nunca "quebra" por falta de
   asset. O AudioContext só é criado no primeiro gesto do usuário
   (política de autoplay dos navegadores). Mudo/volume em SETTINGS.
   ===================================================================== */
const Sound = (() => {
  let ctx = null, master = null, noiseBuf = null, muted = false, unlocked = false;
  function ensure(){
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    if (!ctx){
      ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    }
    master.gain.setTargetAtTime(SETTINGS.sound ? SETTINGS.volume : 0, ctx.currentTime, 0.01);
    if (ctx.state !== "running" && ctx.state !== "closed") ctx.resume().catch(()=>{}); // "suspended" ou "interrupted" (iOS)
    return ctx;
  }
  /* tom com envelope ADSR simplificado e glissando opcional */
  function tone({ f = 440, f2, t = 0, d = 0.12, type = "sine", g = 0.22, a = 0.006 }){
    const t0 = ctx.currentTime + t, o = ctx.createOscillator(), v = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + a); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(v); v.connect(master); o.start(t0); o.stop(t0 + d + 0.05);
  }
  /* ruído filtrado (whoosh, caixa registradora, impacto) */
  function noise({ t = 0, d = 0.3, g = 0.15, f = 1200, f2, q = 0.8 }){
    const t0 = ctx.currentTime + t, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), v = ctx.createGain();
    s.buffer = noiseBuf; bp.type = "bandpass"; bp.Q.value = q; bp.frequency.setValueAtTime(f, t0); if (f2) bp.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    s.connect(bp); bp.connect(v); v.connect(master); s.start(t0); s.stop(t0 + d + 0.05);
  }
  const arp = (notes, step, opts) => notes.forEach((f,i) => tone({ f, t: i*step, ...opts }));
  const SFX = {
    click:       () => tone({ f:1200, f2:900, d:0.035, type:"triangle", g:0.08 }),
    bubble:      () => tone({ f:520, f2:1100, d:0.07, type:"sine", g:0.1 }),
    year:        () => { noise({ d:0.45, f:400, f2:2400, g:0.08, q:0.6 }); arp([659, 988], 0.12, { d:0.35, type:"triangle", g:0.13, t:0.18 }); },
    money:       () => { arp([1319, 1568, 2093], 0.06, { d:0.16, type:"square", g:0.05 }); tone({ f:2637, t:0.2, d:0.3, g:0.04 }); },
    loss:        () => arp([392, 311, 233], 0.11, { d:0.22, type:"sawtooth", g:0.06 }),
    buy:         () => { noise({ d:0.06, f:3000, g:0.12, q:2 }); arp([1047, 1568], 0.08, { d:0.25, type:"triangle", g:0.12, t:0.05 }); },
    alert:       () => { arp([740, 554], 0.13, { d:0.12, type:"triangle", g:0.12 }); },
    siren:       () => { for (let i=0;i<3;i++){ tone({ f:620, f2:950, t:i*0.42, d:0.21, type:"sawtooth", g:0.05 }); tone({ f:950, f2:620, t:i*0.42+0.21, d:0.21, type:"sawtooth", g:0.05 }); } },
    achievement: () => arp([523, 659, 784, 1047], 0.09, { d:0.4, type:"triangle", g:0.12 }),
    death:       () => { [196, 233, 294].forEach(f => tone({ f, d:2.2, a:0.3, type:"sine", g:0.1 })); noise({ d:1.8, f:300, g:0.02, q:0.4 }); },
    error:       () => arp([196, 147], 0.08, { d:0.12, type:"square", g:0.05 }),
    travel:      () => { noise({ d:1.0, f:200, f2:1800, g:0.06, q:0.5 }); arp([523, 784, 1047], 0.15, { d:0.3, t:0.4, type:"sine", g:0.1 }); },
    // combate
    punch:       () => { noise({ d:0.11, f:200, g:0.4, q:0.7 }); tone({ f:120, f2:55, d:0.13, g:0.28 }); },
    hurt:        () => { noise({ d:0.14, f:350, g:0.3, q:0.9 }); tone({ f:260, f2:140, d:0.16, type:"sawtooth", g:0.06 }); },
    miss:        () => noise({ d:0.18, f:700, f2:2600, g:0.07, q:0.6 }),
    bell:        () => { [880, 1320, 2200].forEach((f,i) => tone({ f, d:1.4 - i*0.3, a:0.003, type:"sine", g:0.09 - i*0.02 })); },
    ko:          () => { noise({ d:0.35, f:120, g:0.45, q:0.5 }); arp([330, 247, 165], 0.12, { d:0.3, type:"triangle", g:0.09, t:0.12 }); },
    win:         () => arp([523, 659, 784, 1047, 1319], 0.08, { d:0.35, type:"triangle", g:0.11 }),
    // fuga
    step:        () => tone({ f:260, f2:200, d:0.04, type:"triangle", g:0.06 }),
    pickup:      () => arp([1175, 1568, 2093], 0.05, { d:0.14, type:"square", g:0.04 }),
    stage:       () => arp([659, 880, 1175], 0.09, { d:0.25, type:"triangle", g:0.1 }),
    caught:      () => { for (let i=0;i<2;i++) tone({ f:880, f2:440, t:i*0.3, d:0.26, type:"square", g:0.06 }); noise({ d:0.4, f:150, g:0.3, q:0.5, t:0.6 }); },
    escape:      () => { noise({ d:0.8, f:300, f2:2400, g:0.05, q:0.5 }); arp([523, 659, 784, 1047, 1568], 0.1, { d:0.45, t:0.3, type:"triangle", g:0.11 }); },
    // carregamento
    tick:        () => tone({ f:1600, d:0.025, type:"sine", g:0.025 }),
    ready:       () => { [523, 659, 784].forEach((f,i) => tone({ f, t:i*0.04, d:0.9, a:0.02, type:"sine", g:0.06 })); tone({ f:1047, t:0.18, d:0.7, type:"triangle", g:0.05 }); },
  };
  return {
    play(name){ if (muted || !SETTINGS.sound) return; try { if (!ensure()) return; SFX[name]?.(); } catch(e){} },
    setVolume(v){ SETTINGS.volume = Math.max(0, Math.min(1, v)); saveSettings(); if (ctx) ensure(); },
    toggle(){ SETTINGS.sound = !SETTINGS.sound; saveSettings(); if (ctx) ensure(); if (SETTINGS.sound){ this.unlock(); this.play("click"); } return SETTINGS.sound; },
    mute(m){ muted = !!m; }, // usado pelo selftest
    /* iOS/Android: o contexto só "acorda" dentro de um gesto. Tocar um buffer
       mudo de 1 amostra no primeiro toque destrava o áudio da página toda.
       Respeita o mudo: com som desligado, nada é criado. */
    unlock(){
      if (muted || !SETTINGS.sound) return;
      try {
        const c = ensure(); if (!c) return;
        if (!unlocked){ const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0); unlocked = true; }
        if (c.state !== "running") c.resume().catch(()=>{});
      } catch(e){}
    },
    suspend(){ try { if (ctx && ctx.state === "running") ctx.suspend(); } catch(e){} }, // app em segundo plano
  };
})();
/* A simulação emite eventos; o áudio escuta (desacoplado via core/bus.js). */
on("achievement", () => Sound.play("achievement"));
on("promotion",   () => Sound.play("achievement"));
on("siren",       () => Sound.play("siren"));
on("buy",         () => Sound.play("buy"));
on("loss",        () => Sound.play("loss"));
on("death",       () => Sound.play("death"));
on("economy",     () => Sound.play("alert"));
on("travel",      () => Sound.play("travel"));
on("crime",       () => Sound.play("money"));
on("hit",        () => Sound.play("punch"));
on("hurt",       () => Sound.play("hurt"));
on("miss",       () => Sound.play("miss"));
on("fightStart", () => Sound.play(S && S.fight && S.fight.kind === "tournament" ? "bell" : "alert"));
on("fightWin",   () => Sound.play(S && S.fight && ["ko","grave","coma","death"].includes(S.fight.oppOutcome) ? "ko" : "win"));
on("fightLose",  () => Sound.play("ko"));
on("step",       () => Sound.play("step"));
on("pickup",     () => Sound.play("pickup"));
on("stage",      () => Sound.play("stage"));
on("caught",     () => Sound.play("caught"));
on("escape",     () => Sound.play("escape"));
