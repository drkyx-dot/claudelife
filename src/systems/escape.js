"use strict";
/* =====================================================================
   systems/escape.js — FUGA DA PRISÃO (minigame tático em grade) e vida
   de foragido(a).

   Regras do puzzle (por etapa):
   • Grade com paredes; você começa na cela (🧍) e precisa chegar à saída (🚪).
   • Guardas patrulham em linha reta, indo e voltando; olham para onde andam.
     Câmeras giram entre direções a cada 2 turnos. A visão é uma linha de
     N casas que para em paredes.
   • A cada turno você anda 1 casa (ou espera). Você é pego se entrar numa
     casa vigiada AGORA (vermelho) ou no PRÓXIMO turno (laranja).
   • Limite de turnos = melhor solução + folga. Em dificuldade alta, a saída
     exige o cartão-chave (🔑) e há mais etapas (celas → pátio → muralha).
   • Toda etapa é gerada e VERIFICADA por busca em largura (BFS) no espaço
     posição × tempo × chave: nunca existe puzzle impossível.

   Dificuldade d = segurança (mínima 0 · média 2 · máxima 4)
                   + tentativas frustradas + fugas anteriores (máx. 8).
   ===================================================================== */
const ESC_DIRS = { N:[0,-1], S:[0,1], E:[1,0], W:[-1,0] };
const ESC_TMAX = 70;

function escapeDifficulty(){
  const sec = { "mínima":0, "média":2, "máxima":4 }[S.prison?.security] ?? 1;
  return Math.min(8, sec + num(S.prison?.escAttempts) + num(S.stats.escapes));
}
function escapeParams(d){
  return { size: Math.min(10, 7 + Math.floor(d/2)), guards: Math.min(6, 2 + Math.floor(d*0.5)), cams: Math.min(3, Math.floor((d+1)/2)),
           range: d >= 5 ? 4 : 3, slack: Math.max(2, 8 - d), stages: d <= 1 ? 1 : d <= 4 ? 2 : 3, keyFrom: d >= 6 ? 0 : d >= 3 ? 99 : 999 };
}

/* ---------- Geometria e visão (puras: dependem só da etapa e do tempo) ---------- */
const escCell = (st, x, y) => (x < 0 || y < 0 || x >= st.w || y >= st.h) ? "#" : st.grid[y][x];
const escFloor = (st, x, y) => escCell(st, x, y) !== "#";
function guardAt(g, t){
  const n = g.path.length; if (n === 1) return { x:g.path[0][0], y:g.path[0][1], dir:g.dir };
  const per = 2*(n-1), k = (t + g.off) % per, i = k < n ? k : per - k;
  const k2 = (t + 1 + g.off) % per, j = k2 < n ? k2 : per - k2;
  const [x, y] = g.path[i], [x2, y2] = g.path[j];
  const dir = Object.keys(ESC_DIRS).find(d => ESC_DIRS[d][0] === Math.sign(x2-x) && ESC_DIRS[d][1] === Math.sign(y2-y)) || g.dir;
  return { x, y, dir };
}
const camDir = (c, t) => c.dirs[Math.floor((t + c.off) / 2) % c.dirs.length];
function rayCells(st, x, y, dir, range, out){
  const [dx, dy] = ESC_DIRS[dir];
  for (let k = 1; k <= range; k++){ const nx = x + dx*k, ny = y + dy*k; if (!escFloor(st, nx, ny)) break; out.add(nx + "," + ny); }
}
function visionAt(st, t){
  const v = new Set();
  for (const g of st.guards){ const p = guardAt(g, t); v.add(p.x + "," + p.y); rayCells(st, p.x, p.y, p.dir, st.range, v); }
  for (const c of st.cams) rayCells(st, c.x, c.y, camDir(c, t), st.range, v);
  return v;
}

/* ---------- Solucionador (BFS em posição × tempo × chave) ---------- */
function solveStage(st){
  const needKey = !!st.key, seen = new Set(), q = [[st.start[0], st.start[1], needKey ? 0 : 1, 0, null]];
  const vis = []; const V = t => vis[t] || (vis[t] = visionAt(st, t));
  if (V(0).has(st.start.join(","))) return null;
  seen.add(`${st.start[0]},${st.start[1]},${needKey?0:1},0`);
  for (let h = 0; h < q.length; h++){
    const [x, y, k, t] = q[h];
    if (x === st.exit[0] && y === st.exit[1]) { const path = []; for (let n = q[h]; n; n = n[4]) path.unshift([n[0], n[1]]); return { len: t, path }; }
    if (t >= ESC_TMAX) continue;
    for (const [dx, dy] of [[0,-1],[0,1],[1,0],[-1,0],[0,0]]){
      const nx = x + dx, ny = y + dy; if (!escFloor(st, nx, ny)) continue;
      if (nx === st.exit[0] && ny === st.exit[1] && !k) continue;
      const key = nx + "," + ny; if (V(t).has(key) || V(t+1).has(key)) continue;
      const nk = k || (st.key && nx === st.key[0] && ny === st.key[1]) ? 1 : 0;
      const sk = `${nx},${ny},${nk},${t+1}`; if (seen.has(sk)) continue; seen.add(sk);
      q.push([nx, ny, nk, t+1, q[h]]);
    }
  }
  return null;
}

/* ---------- Gerador ---------- */
function genStage(d, idx, total){
  const P0 = escapeParams(d), W = P0.size, H = P0.size;
  for (let attempt = 0; attempt < 60; attempt++){
    const g = Array.from({ length:H }, (_, y) => Array.from({ length:W }, (_, x) => (x === 0 || y === 0 || x === W-1 || y === H-1) ? "#" : "."));
    // blocos de parede e segmentos (corredores)
    for (let i = 0; i < Math.floor(W*H*0.07); i++){
      const x = rint(2, W-3), y = rint(2, H-3), horiz = chance(0.5), len = rint(1, 3);
      for (let k = 0; k < len; k++){ const xx = horiz ? x+k : x, yy = horiz ? y : y+k; if (xx < W-1 && yy < H-1) g[yy][xx] = "#"; }
    }
    const start = [1, H-2], exit = [W-2, 0];
    g[H-2][1] = "."; g[H-2][2] = "."; g[H-3][1] = "."; g[1][W-2] = "."; g[1][W-3] = ".";
    const st = { w:W, h:H, grid: g.map(r => r.join("")), start, exit, key:null, guards:[], cams:[], range:P0.range, name: DATA.escapeStages[Math.min(idx, 2)] };
    st.grid[0] = st.grid[0].slice(0, exit[0]) + "X" + st.grid[0].slice(exit[0]+1);
    // distâncias a partir da cela (sem guardas) — garante conectividade
    const dist = {}, bq = [start]; dist[start.join(",")] = 0;
    for (let h = 0; h < bq.length; h++){ const [x,y] = bq[h]; for (const [dx,dy] of Object.values(ESC_DIRS)){ const nx=x+dx, ny=y+dy, k=nx+","+ny; if (escFloor(st,nx,ny) && dist[k] === undefined){ dist[k] = dist[x+","+y]+1; bq.push([nx,ny]); } } }
    if (dist[exit.join(",")] === undefined) continue;
    const floors = Object.keys(dist).map(k => k.split(",").map(Number)).filter(([x,y]) => y > 0);
    // cartão-chave: longe da cela e fora do caminho direto
    const needKey = P0.keyFrom === 0 || (idx === total-1 && P0.keyFrom <= 99);
    if (needKey){ const far = floors.filter(([x,y]) => dist[x+","+y] >= W/2 && Math.abs(x-exit[0]) + Math.abs(y-exit[1]) >= 3); if (!far.length) continue; st.key = pick(far); }
    // guardas: patrulha em linha reta, longe da cela
    const busy = new Set([start.join(","), exit.join(","), st.key?.join(",")]);
    for (let i = 0; i < P0.guards; i++){
      const cand = floors.filter(([x,y]) => dist[x+","+y] >= 3 && !busy.has(x+","+y));
      if (!cand.length) break;
      const [x, y] = pick(cand), horiz = chance(0.5), [dx, dy] = horiz ? [1,0] : [0,1], path = [[x,y]], want = rint(3, 5);
      for (let k = 1; path.length < want && escFloor(st, x+dx*k, y+dy*k) && y+dy*k > 0; k++) path.push([x+dx*k, y+dy*k]);
      for (let k = 1; path.length < want && escFloor(st, x-dx*k, y-dy*k) && y-dy*k > 0; k++) path.unshift([x-dx*k, y-dy*k]);
      if (path.length < 2) continue;
      if (path.some(([px,py]) => Math.abs(px-start[0]) + Math.abs(py-start[1]) <= 1)) continue;
      path.forEach(p => busy.add(p.join(",")));
      st.guards.push({ path, off: rint(0, 2*(path.length-1)-1), dir: horiz ? "E" : "S" });
    }
    // câmeras: presas a paredes, varrendo os corredores vizinhos
    for (let i = 0; i < P0.cams; i++){
      const walls = [];
      for (let y = 1; y < H-1; y++) for (let x = 1; x < W-1; x++) if (st.grid[y][x] === "#"){ const dirs = Object.keys(ESC_DIRS).filter(dn => escFloor(st, x+ESC_DIRS[dn][0], y+ESC_DIRS[dn][1]) && st.grid[y+ESC_DIRS[dn][1]][x+ESC_DIRS[dn][0]] !== "X"); if (dirs.length >= 2) walls.push({ x, y, dirs }); }
      if (!walls.length) break;
      const w = pick(walls); if (st.cams.some(c => c.x === w.x && c.y === w.y)) continue;
      st.cams.push({ x:w.x, y:w.y, dirs: w.dirs.slice(0, 2 + (d >= 6 ? 1 : 0)), off: rint(0, 3) });
    }
    if (st.guards.length < Math.min(2, P0.guards)) continue;
    const sol = solveStage(st);
    if (!sol || sol.len < Math.max(6, W - 2)) continue;
    st.opt = sol.len; st.limit = sol.len + P0.slack;
    return st;
  }
  // fallback garantido: sem guardas (nunca deve acontecer, mas jamais trava o jogo)
  const W2 = 7, g2 = Array.from({ length:W2 }, (_, y) => (y === 0 ? "#####X#" : y === W2-1 ? "#######" : "#.....#"));
  const st = { w:W2, h:W2, grid:g2, start:[1,W2-2], exit:[5,0], key:null, guards:[], cams:[], range:3, name:DATA.escapeStages[0] };
  st.opt = solveStage(st).len; st.limit = st.opt + 6; return st;
}

/* ---------- Ciclo do minigame ---------- */
function escapeBlock(){
  if (!S.prison) return "Você não está preso(a).";
  if (num(S.prison.escBlock) > 0) return `Vigilância reforçada sobre você: espere ${S.prison.escBlock} ano(s).`;
  if (S.prison.escTriedAge === P().age) return "Você já tentou fugir este ano.";
  if (P().stats.health < 15) return "Fraco(a) demais para tentar.";
  return null;
}
function startEscape(bonus = 0){
  const why = escapeBlock(); if (why) return R(false, why);
  const d = Math.max(0, escapeDifficulty() - bonus), P0 = escapeParams(d), stages = [];
  for (let i = 0; i < P0.stages; i++) stages.push(genStage(d, i, P0.stages));
  S.prison.escTriedAge = P().age;
  S.escape = { d, stages, stage:0, t:0, pos:[...stages[0].start], key:!stages[0].key, over:false, result:null, msg:"" };
  return R(true, `Plano de fuga em ${P0.stages} etapa(s). Dificuldade ${d}/8.`);
}
const escStage = () => S.escape.stages[S.escape.stage];
/* dir: N | S | E | W | wait. Retorna texto curto para a UI. */
function escapeMove(dir){
  const E = S.escape; if (!E || E.over) return "";
  const st = escStage(), [dx, dy] = dir === "wait" ? [0,0] : ESC_DIRS[dir];
  const nx = E.pos[0] + dx, ny = E.pos[1] + dy;
  if (!escFloor(st, nx, ny)) return "🧱 Parede.";
  if (nx === st.exit[0] && ny === st.exit[1] && !E.key) return "🔒 A porta exige o cartão-chave.";
  const k = nx + "," + ny;
  if (visionAt(st, E.t).has(k) || visionAt(st, E.t + 1).has(k)){ E.pos = [nx, ny]; return failEscape("👮 Um guarda te viu!"); }
  E.pos = [nx, ny]; E.t++;
  emit("step");
  if (st.key && nx === st.key[0] && ny === st.key[1] && !E.key){ E.key = true; emit("pickup"); }
  if (nx === st.exit[0] && ny === st.exit[1]){
    if (E.stage + 1 < E.stages.length){ E.stage++; E.t = 0; E.pos = [...escStage().start]; E.key = !escStage().key; emit("stage"); return `✅ ${st.name} superado! Próxima etapa: ${escStage().name}.`; }
    return succeedEscape();
  }
  if (E.t >= st.limit) return failEscape("⏰ A contagem de presos começou — sua cela estava vazia.");
  return dir === "wait" ? "⏳ Esperei imóvel nas sombras." : "";
}
function abortEscape(){ const E = S.escape; if (!E || E.stage || E.t) return false; S.escape = null; if (S.prison) S.prison.escTriedAge = null; return true; }

function succeedEscape(){
  const E = S.escape, pr = S.prison; E.over = true; E.result = "ok";
  S.wanted = { since:P().age, remaining: pr.years, crime: pr.crime, fakeId:false, country:P().country, years:0, security: pr.security };
  S.prison = null; S.stats.escapes = num(S.stats.escapes) + 1;
  addNoto(40); addStat("happiness", 15); addStress(10);
  if (S.org) S.org.respect = clamp(S.org.respect + 12);
  log(`🏃 FUGI DA PRISÃO (${pr.security}) e agora sou foragido(a) da Justiça. 🚨`, "milestone", ["crime"]);
  achieve("escape", "Fuga da prisão");
  emit("escape");
  return E.msg = "🏃 Você está livre! A partir de agora, é foragido(a): a polícia vai te procurar.";
}
function failEscape(why){
  const E = S.escape, pr = S.prison; E.over = true; E.result = "fail";
  const add = rint(2, 4), hurt = rint(10, 20);
  pr.years += add; pr.escBlock = 2; pr.escAttempts = num(pr.escAttempts) + 1;
  if (pr.security === "mínima") pr.security = "média"; else if (pr.security === "média" && chance(0.5)) pr.security = "máxima";
  const seq = injure(hurt, "O espancamento após a fuga frustrada", 0.3);
  addStat("happiness", -10); addStress(12);
  log(`🚨 Tentativa de fuga frustrada: +${add} anos de pena, solitária e surra dos agentes.`, "bad", ["crime"]);
  emit("caught");
  return E.msg = `${why} Fuga frustrada: +${add} anos de pena, ${hurt} de saúde perdidos na surra, 2 anos sob vigilância reforçada. Agora em segurança ${pr.security}.${seq}`;
}
function closeEscape(){ const E = S.escape; if (!E) return ""; const m = E.msg; S.escape = null; return m; }
/* Bots e saves recarregados: resolve sem UI (chance cai com a dificuldade). */
function autoEscape(){
  const E = S.escape; if (!E) return;
  if (!E.over){ if (chance(0.62 - E.d*0.06)) succeedEscape(); else failEscape("👮 Pego(a) no corredor."); }
  closeEscape();
}

/* ---------- Foragido(a) ---------- */
function recaptureChance(){
  const W = S.wanted; if (!W) return 0;
  return Math.min(0.9, 0.22 * (P().country !== W.country ? 0.35 : 1) * (W.fakeId ? 0.45 : 1) * (S.org ? 0.8 : 1) * (1 + P().notoriety/200));
}
function fugitiveYear(){
  const W = S.wanted; if (!W || inPrison()) return;
  W.years = num(W.years) + 1; addStress(5);
  if (chance(recaptureChance())){
    const y = W.remaining + rint(2, 5), crime = W.crime; S.wanted = null;
    log("🚔 Fui recapturado(a) depois de anos foragido(a).", "bad");
    sendToPrison(y, `fuga da prisão (${crime})`, "máxima");
    return;
  }
  if (W.years >= 15){ S.wanted = null; log("📁 Meu caso de foragido(a) esfriou e saiu da lista de prioridades.", "good"); return; }
  if (chance(0.45)) enqueue("ev_fugitive");
}
function buyFakeId(){
  const W = S.wanted; if (!W) return R(false, "Você não precisa disso.");
  if (W.fakeId) return R(false, "Você já tem identidade falsa.");
  const cost = priceOf(9000);
  if (S.dirty >= cost) S.dirty -= cost; else if (canAfford(cost)) addMoney(-cost); else return R(false, `Um documento bom custa ${fmt(cost)}.`);
  if (chance(0.15)){ addNoto(10); return R(false, "O falsário era informante. Perdi o dinheiro e a polícia sabe meu novo nome."); }
  W.fakeId = true; log("🪪 Comprei uma identidade falsa.", "bad");
  return R(true, "Nova identidade. Empregos comuns voltam a ser possíveis (concursos, não).");
}
