/* Green Room — senior SA interview practice. Everything runs in the browser.
   Only the question + transcript text is sent to the Anthropic API for scoring. */
(() => {
"use strict";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash";
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-pro-preview",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];
const GEMINI_URL = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
// Provider is auto-detected from the key prefix: sk-ant-… → Anthropic, AIza… → Gemini.
const detectProvider = (key) => key.startsWith("AIza") ? "gemini" : "anthropic";
const LS = {
  key: "gr_api_key",
  sessions: "gr_sessions",
  asked: "gr_asked_ids",
  geminiModel: "gr_gemini_model",
  interviewerVoice: "gr_interviewer_voice",
  realisticVoice: "gr_realistic_voice",
  kokoroVoice: "gr_kokoro_voice",
};

// In-browser neural TTS (Kokoro) — natural human interviewer voice, no server, no API key.
const KOKORO_CDN = "https://esm.sh/kokoro-js@1.2.1";
const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const KOKORO_VOICES = [
  { id: "af_heart", label: "Heart — American, warm (F)" },
  { id: "af_bella", label: "Bella — American, expressive (F)" },
  { id: "am_michael", label: "Michael — American (M)" },
  { id: "am_fenrir", label: "Fenrir — American, firm (M)" },
  { id: "bf_emma", label: "Emma — British (F)" },
  { id: "bm_george", label: "George — British (M)" },
];
const KOKORO_DEFAULT_VOICE = "af_heart";
const FILLERS = ["um","uh","er","ah","like","you know","sort of","kind of","basically","actually","literally","i mean","right?","stuff like that"];

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

function getGeminiModel() {
  const saved = localStorage.getItem(LS.geminiModel);
  return GEMINI_MODELS.includes(saved) ? saved : GEMINI_DEFAULT_MODEL;
}

function setGeminiModel(model) {
  const picked = GEMINI_MODELS.includes(model) ? model : GEMINI_DEFAULT_MODEL;
  localStorage.setItem(LS.geminiModel, picked);
}

// ───────────────────────── state ─────────────────────────
const state = {
  track: null,
  session: null,          // { id, date, track, difficulty, questions:[...], answers:[...] }
  qIndex: 0,
  answering: false,
  answered: false,        // current question answered & stopped
  timerStart: 0,
  timerInt: null,
  elapsed: 0,
  stream: null,
  recorder: null,
  chunks: [],
  recog: null,
  recogWanted: false,
  viewingSaved: false,    // report screen showing a historical session
  interviewerUtterance: null,
  kokoro: null,           // loaded KokoroTTS instance
  kokoroLoading: null,    // in-flight load promise
  audioCtx: null,
  voiceSource: null,      // active AudioBufferSourceNode
  mouthRAF: 0,            // requestAnimationFrame id for audio-driven mouth
  speakToken: 0,          // invalidates stale in-flight voice generations
};

function realisticVoiceEnabled() {
  return localStorage.getItem(LS.realisticVoice) === "1";
}
function setRealisticVoiceEnabled(enabled) {
  localStorage.setItem(LS.realisticVoice, enabled ? "1" : "0");
}
function getKokoroVoice() {
  const saved = localStorage.getItem(LS.kokoroVoice);
  return KOKORO_VOICES.some(v => v.id === saved) ? saved : KOKORO_DEFAULT_VOICE;
}
function setKokoroVoice(id) {
  const picked = KOKORO_VOICES.some(v => v.id === id) ? id : KOKORO_DEFAULT_VOICE;
  localStorage.setItem(LS.kokoroVoice, picked);
}
function getAudioCtx() {
  if (!state.audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) state.audioCtx = new Ctx();
  }
  return state.audioCtx;
}

function interviewerVoiceEnabled() {
  const saved = localStorage.getItem(LS.interviewerVoice);
  return saved == null ? true : saved !== "0";
}

function setInterviewerVoiceEnabled(enabled) {
  localStorage.setItem(LS.interviewerVoice, enabled ? "1" : "0");
}

function setAvatarStatus(text) {
  const s = $("avatarState");
  if (s) s.textContent = text;
}

function setAvatarTalking(talking) {
  const avatar = $("avatarFace");
  if (!avatar) return;
  avatar.classList.toggle("talking", !!talking);
  if (!talking) {
    // stop audio-driven mouth and reset
    if (state.mouthRAF) { cancelAnimationFrame(state.mouthRAF); state.mouthRAF = 0; }
    const mouth = avatar.querySelector(".avatar-mouth");
    if (mouth) mouth.style.height = "";
    avatar.classList.remove("speaking");
    setAvatarStatus("Interviewer is ready.");
  } else {
    setAvatarStatus("Interviewer is asking the question...");
  }
}

function stopInterviewerVoice() {
  // Invalidate any in-flight speech generation so it can't play late.
  state.speakToken = (state.speakToken || 0) + 1;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  state.interviewerUtterance = null;
  if (state.voiceSource) {
    try { state.voiceSource.onended = null; state.voiceSource.stop(); } catch {}
    state.voiceSource = null;
  }
  setAvatarTalking(false);
}

// Drive the avatar mouth from live audio amplitude for real lip movement.
function driveMouthFromAnalyser(analyser) {
  const avatar = $("avatarFace");
  const mouth = avatar && avatar.querySelector(".avatar-mouth");
  if (!mouth) return;
  avatar.classList.add("speaking");
  const data = new Uint8Array(analyser.frequencyBinCount);
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
    const rms = Math.sqrt(sum / data.length);          // 0..~0.5
    const open = Math.max(6, Math.min(30, 6 + rms * 120));
    mouth.style.height = `${open}px`;
    state.mouthRAF = requestAnimationFrame(tick);
  };
  state.mouthRAF = requestAnimationFrame(tick);
}

async function loadKokoro() {
  if (state.kokoro) return state.kokoro;
  if (state.kokoroLoading) return state.kokoroLoading;
  setAvatarStatus("Loading realistic interviewer voice (one-time download)...");
  state.kokoroLoading = (async () => {
    const { KokoroTTS } = await import(/* @vite-ignore */ KOKORO_CDN);
    const webgpu = typeof navigator !== "undefined" && "gpu" in navigator;
    const tts = await KokoroTTS.from_pretrained(KOKORO_MODEL, {
      dtype: webgpu ? "fp32" : "q8",
      device: webgpu ? "webgpu" : "wasm",
    });
    state.kokoro = tts;
    return tts;
  })();
  try {
    return await state.kokoroLoading;
  } finally {
    state.kokoroLoading = null;
  }
}

async function speakWithKokoro(text, token) {
  const ctx = getAudioCtx();
  if (!ctx) throw new Error("No AudioContext");
  if (ctx.state === "suspended") { try { await ctx.resume(); } catch {} }

  const tts = await loadKokoro();
  if (token !== state.speakToken) return;               // superseded while loading model

  setAvatarStatus("Generating realistic voice...");
  const raw = await tts.generate(text, { voice: getKokoroVoice() });
  if (token !== state.speakToken) return;               // superseded while generating

  let audioBuffer;
  if (raw && raw.audio && raw.sampling_rate) {
    audioBuffer = ctx.createBuffer(1, raw.audio.length, raw.sampling_rate);
    audioBuffer.copyToChannel(Float32Array.from(raw.audio), 0);
  } else {
    const blob = await raw.toBlob();
    audioBuffer = await ctx.decodeAudioData(await blob.arrayBuffer());
  }
  if (token !== state.speakToken) return;               // superseded while decoding

  if (ctx.state === "suspended") { try { await ctx.resume(); } catch {} }
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  state.voiceSource = source;
  setAvatarTalking(true);
  setAvatarStatus("Interviewer is speaking...");
  driveMouthFromAnalyser(analyser);
  source.onended = () => { if (state.voiceSource === source) { state.voiceSource = null; setAvatarTalking(false); } };
  source.start();
}

function speakWithWebSpeech(text) {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    setAvatarStatus("Interviewer voice is unavailable in this browser.");
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => /en-US/i.test(v.lang) && /Female|Samantha|Google US English/i.test(v.name))
    || voices.find(v => /en-US/i.test(v.lang))
    || voices[0];
  if (preferred) utter.voice = preferred;
  utter.rate = 0.95;
  utter.pitch = 1.0;
  utter.onstart = () => setAvatarTalking(true);
  utter.onend = () => setAvatarTalking(false);
  utter.onerror = () => setAvatarTalking(false);
  state.interviewerUtterance = utter;
  window.speechSynthesis.speak(utter);
}

function speakQuestion(questionText) {
  if (!interviewerVoiceEnabled()) return;
  stopInterviewerVoice();                 // bumps state.speakToken
  const token = state.speakToken;
  const text = `Let's begin. ${questionText}`;
  if (realisticVoiceEnabled()) {
    speakWithKokoro(text, token).catch((e) => {
      if (token !== state.speakToken) return;
      console.warn("Kokoro voice failed, falling back:", e);
      setAvatarStatus("Realistic voice unavailable — using standard voice.");
      speakWithWebSpeech(text);
    });
    return;
  }
  speakWithWebSpeech(text);
}

function syncInterviewerControls() {
  const chk = $("chkInterviewerVoice");
  if (chk) chk.checked = interviewerVoiceEnabled();
  const rchk = $("chkRealisticVoice");
  if (rchk) rchk.checked = realisticVoiceEnabled();
  const sel = $("selKokoroVoice");
  if (sel) {
    const selected = getKokoroVoice();
    sel.innerHTML = "";
    KOKORO_VOICES.forEach(v => {
      const opt = el("option", null, v.label);
      opt.value = v.id;
      if (v.id === selected) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.disabled = !realisticVoiceEnabled();
  }
}

// ───────────────────────── IndexedDB (recordings) ─────────────────────────
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("green-room", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("recordings");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbPut(key, blob) {
  try {
    const db = await idb();
    await new Promise((res, rej) => {
      const tx = db.transaction("recordings", "readwrite");
      tx.objectStore("recordings").put(blob, key);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch (e) { console.warn("recording not saved:", e); }
}
async function idbGet(key) {
  try {
    const db = await idb();
    return await new Promise((res, rej) => {
      const rq = db.transaction("recordings").objectStore("recordings").get(key);
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => rej(rq.error);
    });
  } catch { return null; }
}
async function idbDeletePrefix(prefix) {
  try {
    const db = await idb();
    const tx = db.transaction("recordings", "readwrite");
    const store = tx.objectStore("recordings");
    const rq = store.openCursor();
    rq.onsuccess = () => {
      const c = rq.result;
      if (c) { if (String(c.key).startsWith(prefix)) c.delete(); c.continue(); }
    };
  } catch {}
}

// ───────────────────────── storage helpers ─────────────────────────
const getSessions = () => { try { return JSON.parse(localStorage.getItem(LS.sessions)) || []; } catch { return []; } };
const saveSessions = (s) => localStorage.setItem(LS.sessions, JSON.stringify(s));
const getAsked = () => { try { return JSON.parse(localStorage.getItem(LS.asked)) || []; } catch { return []; } };
const rememberAsked = (ids) => {
  const merged = [...getAsked(), ...ids].slice(-80); // remember last 80 to prefer fresh questions
  localStorage.setItem(LS.asked, JSON.stringify(merged));
};

// ───────────────────────── screens ─────────────────────────
function show(screen) {
  ["screen-home","screen-session","screen-report"].forEach(id => $(id).classList.add("hidden"));
  $(screen).classList.remove("hidden");
  window.scrollTo(0, 0);
}

// ───────────────────────── home / setup ─────────────────────────
function renderHome() {
  const grid = $("trackGrid");
  grid.innerHTML = "";
  Object.entries(window.TRACKS).forEach(([key, t]) => {
    const n = QUESTION_BANK.filter(q => q.track === key).length;
    const card = el("div", "track-card" + (state.track === key ? " selected" : ""));
    card.appendChild(el("div", "t-label", t.label));
    card.appendChild(el("div", "t-hint", t.hint));
    card.appendChild(el("div", "t-count", `${n} questions`));
    card.onclick = () => { state.track = key; renderHome(); };
    grid.appendChild(card);
  });
  $("btnStart").disabled = !state.track;
  $("startHint").textContent = state.track ? `Track: ${window.TRACKS[state.track].label}. Difficulty ramps within the session.` : "Select a track to begin.";
  renderModelPicker();
  renderKeyStatus();
  renderHistory();
}

function renderModelPicker() {
  const sel = $("selGeminiModel");
  if (!sel) return;
  const selected = getGeminiModel();
  sel.innerHTML = "";
  GEMINI_MODELS.forEach((m) => {
    const opt = el("option", null, m);
    opt.value = m;
    if (m === selected) opt.selected = true;
    sel.appendChild(opt);
  });
}

function renderKeyStatus() {
  const key = localStorage.getItem(LS.key) || "";
  $("inpApiKey").value = key;
  $("keyStatus").textContent = key
    ? `Key saved in this browser. AI feedback via ${detectProvider(key) === "gemini" ? `Gemini (${getGeminiModel()})` : `Claude (${CLAUDE_MODEL})`}.`
    : "";
}

function renderHistory() {
  const sessions = getSessions();
  const wrap = $("historyList");
  wrap.innerHTML = "";
  if (!sessions.length) { $("progressSummary").textContent = "No sessions yet. Your scores will show up here."; return; }

  const scored = sessions.filter(s => s.avgOverall != null);
  const last = scored.slice(-10);
  let summary = `${sessions.length} session${sessions.length > 1 ? "s" : ""} completed.`;
  if (scored.length >= 2) {
    const first = scored[0].avgOverall, latest = scored[scored.length - 1].avgOverall;
    const d = (latest - first).toFixed(1);
    summary += ` Average score ${first.toFixed(1)} → ${latest.toFixed(1)} (${d >= 0 ? "+" : ""}${d}).`;
  } else if (scored.length === 1) {
    summary += ` Average score ${scored[0].avgOverall.toFixed(1)}.`;
  }
  $("progressSummary").textContent = summary;

  if (last.length >= 2) {
    const spark = el("div", "spark");
    last.forEach(s => {
      const bar = el("span");
      bar.style.height = `${Math.max(8, (s.avgOverall / 10) * 100)}%`;
      bar.title = `${s.date.slice(0,10)} — ${s.avgOverall.toFixed(1)}/10`;
      spark.appendChild(bar);
    });
    wrap.appendChild(spark);
  }

  sessions.slice().reverse().slice(0, 8).forEach(s => {
    const row = el("div", "history-item");
    const open = el("span", "h-open", `${s.date.slice(0,10)} · ${window.TRACKS[s.track]?.label || s.track} · ${s.answers.length}q`);
    open.onclick = () => openSavedReport(s.id);
    const score = el("span", "h-score", s.avgOverall != null ? `${s.avgOverall.toFixed(1)}` : "—");
    const del = el("span", "h-del", "✕");
    del.title = "Delete session (and its recordings)";
    del.onclick = (e) => { e.stopPropagation(); deleteSession(s.id); };
    row.append(open, score, del);
    wrap.appendChild(row);
  });
}

function deleteSession(id) {
  saveSessions(getSessions().filter(s => s.id !== id));
  idbDeletePrefix(id + ":");
  renderHistory();
}

// ───────────────────────── question selection ─────────────────────────
function pickQuestions(track, count, difficulty) {
  const mixes = {
    gentle:   { warmup: 0.4, core: 0.5, curveball: 0.1 },
    standard: { warmup: 0.2, core: 0.6, curveball: 0.2 },
    gauntlet: { warmup: 0.0, core: 0.4, curveball: 0.6 },
  };
  const mix = mixes[difficulty] || mixes.standard;
  let nWarm = Math.round(count * mix.warmup);
  let nCurve = Math.round(count * mix.curveball);
  if (difficulty === "standard") { nWarm = Math.max(1, nWarm); nCurve = Math.max(1, nCurve); }
  let nCore = count - nWarm - nCurve;
  if (nCore < 0) { nCore = 0; nCurve = count - nWarm; }

  const asked = new Set(getAsked());
  const pickTier = (tier, n) => {
    const pool = QUESTION_BANK.filter(q => q.track === track && q.tier === tier);
    const fresh = pool.filter(q => !asked.has(q.id));
    const source = fresh.length >= n ? fresh : pool;
    return source.sort(() => Math.random() - 0.5).slice(0, n);
  };
  // ramp order: warmups first, then core, curveballs last
  const qs = [...pickTier("warmup", nWarm), ...pickTier("core", nCore), ...pickTier("curveball", nCurve)];
  rememberAsked(qs.map(q => q.id));
  return qs;
}

// ───────────────────────── session flow ─────────────────────────
function startSession() {
  const count = parseInt($("selLength").value, 10);
  const difficulty = $("selDifficulty").value;
  const questions = pickQuestions(state.track, count, difficulty);
  if (!questions.length) { alert("No questions available for this track."); return; }
  state.session = {
    id: "s" + Date.now(),
    date: new Date().toISOString(),
    track: state.track,
    difficulty,
    questions,
    answers: [],
  };
  state.qIndex = 0;
  state.viewingSaved = false;
  show("screen-session");
  renderQuestion();
  if (!state.stream) tryEnableCamera(true); // quiet attempt; overlay stays if denied
}

function currentQ() { return state.session.questions[state.qIndex]; }
function targetFor(q) { return (window.TARGETS[q.track] || {})[q.tier] || [90, 180]; }

function renderQuestion() {
  const q = currentQ();
  $("qProgress").textContent = `Question ${state.qIndex + 1} of ${state.session.questions.length}`;
  const chip = $("qTier");
  chip.textContent = q.tier === "curveball" ? "curveball" : q.tier;
  chip.className = "tier-chip " + q.tier;
  $("qText").textContent = q.q;
  const [lo, hi] = targetFor(q);
  $("timerTarget").textContent = `target ${fmt(lo)}–${fmt(hi)}`;
  $("timer").textContent = "0:00";
  $("timer").className = "timer";
  $("transcript").value = "";
  $("interim").textContent = "";
  $("recState").textContent = "";
  state.answering = false; state.answered = false; state.elapsed = 0; state.chunks = [];
  $("btnAnswer").textContent = "● Start answer";
  $("btnAnswer").classList.remove("recording");
  $("btnAnswer").disabled = false;
  $("btnSubmit").disabled = true;
  $("feedbackPanel").classList.add("hidden");
  ["fbLoading","fbError","fbBody","btnNext","btnRetryEval"].forEach(id => $(id).classList.add("hidden"));
  syncInterviewerControls();
  setAvatarTalking(false);
  $("avatarState").textContent = "Interviewer is ready.";
  speakQuestion(q.q);
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function tickTimer() {
  state.elapsed = (Date.now() - state.timerStart) / 1000;
  const t = $("timer");
  t.textContent = fmt(state.elapsed);
  const [lo, hi] = targetFor(currentQ());
  t.className = "timer" + (state.elapsed > hi ? " over" : state.elapsed >= lo ? " in-range" : "");
}

// ───────────────────────── camera & mic ─────────────────────────
async function tryEnableCamera(quiet) {
  $("camError").textContent = "";
  if (!navigator.mediaDevices?.getUserMedia) {
    $("camError").textContent = "This browser doesn't support camera capture. You can still type answers.";
    return;
  }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 }, audio: true });
    $("preview").srcObject = state.stream;
    $("videoOverlay").classList.add("hidden");
  } catch (e) {
    const msgs = {
      NotAllowedError: "Camera/mic permission denied. Enable it in your browser's site settings, or continue without video.",
      NotFoundError: "No camera or microphone found. You can still type your answers.",
      NotReadableError: "Camera is in use by another app. Close it and try again.",
    };
    const msg = msgs[e.name] || `Couldn't start camera: ${e.message}`;
    if (!quiet) $("camError").textContent = msg; else $("camError").textContent = msg;
    console.warn("getUserMedia:", e.name, e.message);
  }
}

function startRecording() {
  state.chunks = [];
  if (!state.stream) return;
  try {
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
    state.recorder = new MediaRecorder(state.stream, { mimeType: mime });
    state.recorder.ondataavailable = (e) => { if (e.data.size) state.chunks.push(e.data); };
    state.recorder.start(1000);
  } catch (e) { console.warn("MediaRecorder:", e); state.recorder = null; }
}
function stopRecording() {
  return new Promise((res) => {
    if (!state.recorder || state.recorder.state === "inactive") return res(null);
    state.recorder.onstop = () => {
      const blob = state.chunks.length ? new Blob(state.chunks, { type: state.recorder.mimeType }) : null;
      res(blob);
    };
    state.recorder.stop();
  });
}

// ───────────────────────── speech recognition ─────────────────────────
function startSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    $("micNote").textContent = "Live transcription isn't supported in this browser (works in Chrome/Edge). Type your answer instead.";
    return;
  }
  $("micNote").textContent = "Live transcription on — uses your browser's speech service. Edit the text if it mishears you.";
  const r = new SR();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-US";
  r.onresult = (ev) => {
    let interim = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      if (res.isFinal) {
        const txt = res[0].transcript.trim();
        if (txt) {
          const ta = $("transcript");
          ta.value = (ta.value ? ta.value.trim() + " " : "") + txt;
          ta.scrollTop = ta.scrollHeight;
        }
      } else interim += res[0].transcript;
    }
    $("interim").textContent = interim;
  };
  r.onerror = (e) => {
    if (e.error === "not-allowed") $("micNote").textContent = "Microphone permission denied — transcription off. Type your answer.";
    else if (e.error !== "no-speech" && e.error !== "aborted") $("micNote").textContent = `Transcription hiccup (${e.error}) — keep talking or type.`;
  };
  r.onend = () => { if (state.recogWanted) { try { r.start(); } catch {} } }; // Chrome auto-stops on silence
  state.recog = r;
  state.recogWanted = true;
  try { r.start(); } catch {}
}
function stopSpeech() {
  state.recogWanted = false;
  if (state.recog) { try { state.recog.stop(); } catch {} state.recog = null; }
  $("interim").textContent = "";
}

// ───────────────────────── answer lifecycle ─────────────────────────
async function toggleAnswer() {
  if (!state.answering) {
    stopInterviewerVoice();
    state.answering = true;
    state.answered = false;
    state.timerStart = Date.now();
    state.timerInt = setInterval(tickTimer, 250);
    startRecording();
    startSpeech();
    $("btnAnswer").textContent = "■ Done answering";
    $("btnAnswer").classList.add("recording");
    $("recState").textContent = state.stream ? "● recording" : "";
    $("btnSubmit").disabled = true;
  } else {
    state.answering = false;
    state.answered = true;
    clearInterval(state.timerInt);
    stopSpeech();
    $("btnAnswer").textContent = "● Re-record answer";
    $("btnAnswer").classList.remove("recording");
    $("recState").textContent = "";
    $("btnSubmit").disabled = false;
    const blob = await stopRecording();
    if (blob) idbPut(`${state.session.id}:${state.qIndex}`, blob);
  }
}

// ───────────────────────── filler analysis ─────────────────────────
function fillerStats(text) {
  const clean = text.toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean).length;
  let fillers = 0;
  const found = {};
  for (const f of FILLERS) {
    const re = new RegExp(`\\b${f.replace("?", "\\?")}\\b`, "g");
    const c = (clean.match(re) || []).length;
    if (c) { fillers += c; found[f] = c; }
  }
  const per100 = words ? +((fillers / words) * 100).toFixed(1) : 0;
  return { words, fillers, per100, found };
}

// ───────────────────────── AI evaluation ─────────────────────────
const EVAL_SYSTEM = `You are a principal-level interviewer at a top-tier technology company — the bar-raiser in a Senior Solutions Architect loop. You have run hundreds of these loops for AWS, Azure, and data-platform-heavy roles. You are tough, precise, and fair. You are not a cheerleader; you are also not cruel. Your notes decide hire/no-hire.

CALIBRATION — hold the line:
- 1–2: no signal, or didn't answer the question asked.
- 3–4: below the senior bar — vague, generic, no ownership, no numbers.
- 5–6: borderline. Some substance but missing depth, structure, or consequences.
- 7: solid senior signal. Structured, specific, owns outcomes.
- 8: strong hire. Quantified impact, sharp trade-offs, scars and lessons.
- 9–10: exceptional and rare. Do not hand these out to merely good answers.
Most real answers land 4–6. A thin, short, or evasive transcript scores low — say so plainly.

RUBRIC (score each 1–10):
- structure: For behavioral/stakeholder questions: STAR — a concrete Situation, the candidate's own Task, Actions in first person singular, and a measurable Result. For technical/design questions: problem framing → stated assumptions → options considered → trade-offs → a committed recommendation. Answering with only a solution and no framing caps this at 5.
- specificity: Named technologies, real numbers (latency, cost, scale, team size, timelines), named failure modes, actual consequences. Platitudes that could appear in any answer cap this at 4.
- seniority_signal: Business impact, judgment under ambiguity, influence without authority, owning trade-offs and their fallout, lessons that changed later behavior. "We" without "I" is a red flag.
- conciseness: Front-loaded answer, no circling. Judge against the answer duration and target range provided. Rambling past the target without added substance costs points.

RULES:
- You MUST quote 2–6 word fragments from the candidate's transcript in your feedback ("you said '…'") so every point is anchored to what they actually said. Never give advice that could apply to any answer.
- If the answer dodges or reframes the question, call it out in the verdict.
- Use the provided filler-word stats and duration in the delivery notes: flag filler density above ~3 per 100 words, and rambling (long duration + low substance).
- If the transcript is gibberish, empty of content, or a test, score 1–2 across the board and say so.
- model_answer_outline: the shape of a genuinely strong senior SA answer to THIS question — bullets a candidate could rehearse from, not generic advice.
- followups: the 2 probing questions you would actually ask next, given what THIS candidate said.
Submit your evaluation only via the tool.`;

const EVAL_TOOL = {
  name: "submit_evaluation",
  description: "Submit the structured interview evaluation.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      scores: {
        type: "object",
        properties: {
          structure: { type: "integer", minimum: 1, maximum: 10 },
          specificity: { type: "integer", minimum: 1, maximum: 10 },
          seniority_signal: { type: "integer", minimum: 1, maximum: 10 },
          conciseness: { type: "integer", minimum: 1, maximum: 10 },
        },
        required: ["structure","specificity","seniority_signal","conciseness"],
        additionalProperties: false,
      },
      overall: { type: "integer", minimum: 1, maximum: 10 },
      verdict: { type: "string", description: "One blunt sentence, as written in interview notes." },
      strengths: { type: "array", items: { type: "string" }, description: "1-3 things that worked, each quoting the transcript." },
      gaps: { type: "array", items: { type: "string" }, description: "2-5 things a strong senior SA answer includes that this one missed." },
      model_answer_outline: { type: "array", items: { type: "string" }, description: "4-8 bullets: the shape of a strong answer to this question." },
      followups: { type: "array", items: { type: "string" }, description: "Exactly 2 probing follow-up questions." },
      delivery: { type: "array", items: { type: "string" }, description: "0-3 notes on filler words, rambling, pacing." },
    },
    required: ["scores","overall","verdict","strengths","gaps","model_answer_outline","followups","delivery"],
    additionalProperties: false,
  },
};

// Convert our Anthropic tool input_schema to Gemini's responseSchema dialect
// (drop additionalProperties / minimum / maximum, keep structure + descriptions).
function toGeminiSchema(node) {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (["additionalProperties","minimum","maximum"].includes(k)) continue;
      out[k] = toGeminiSchema(v);
    }
    return out;
  }
  return node;
}

async function callAnthropic(key, system, tool, userContent, maxTokens) {
  const resp = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens || 2000,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!resp.ok) {
    let detail = "";
    try { detail = (await resp.json()).error?.message || ""; } catch {}
    throw new Error(`API ${resp.status}: ${detail || resp.statusText}`);
  }
  const data = await resp.json();
  const block = data.content.find(b => b.type === "tool_use" && b.name === tool.name);
  if (!block) throw new Error("No structured evaluation returned.");
  return block.input;
}

async function callGemini(key, system, tool, userContent, maxTokens) {
  const model = getGeminiModel();
  const resp = await fetch(GEMINI_URL(model), {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(tool.input_schema),
        maxOutputTokens: maxTokens || 2000,
        thinkingConfig: { thinkingBudget: 0 },   // fast feedback > deliberation here
      },
    }),
  });
  if (!resp.ok) {
    let detail = "";
    try { detail = (await resp.json()).error?.message || ""; } catch {}
    throw new Error(`API ${resp.status}: ${detail || resp.statusText}`);
  }
  const data = await resp.json();
  const cand = data.candidates?.[0];
  const text = cand?.content?.parts?.map(p => p.text).join("") || "";
  if (!text) throw new Error(cand?.finishReason ? `Gemini returned no content (${cand.finishReason}).` : "Gemini returned no content.");
  try { return JSON.parse(text); }
  catch { throw new Error("Gemini returned malformed JSON — retry."); }
}

async function callAI(system, tool, userContent, maxTokens) {
  const key = localStorage.getItem(LS.key);
  if (!key) throw new Error("NO_KEY");
  return detectProvider(key) === "gemini"
    ? callGemini(key, system, tool, userContent, maxTokens)
    : callAnthropic(key, system, tool, userContent, maxTokens);
}

async function submitAnswer() {
  const transcript = $("transcript").value.trim();
  if (!transcript) { $("micNote").textContent = "Say or type something first — there's no answer to evaluate."; return; }
  const q = currentQ();
  const [lo, hi] = targetFor(q);
  const stats = fillerStats(transcript);
  const durationSec = Math.round(state.elapsed);

  $("btnSubmit").disabled = true;
  $("btnAnswer").disabled = true;
  $("feedbackPanel").classList.remove("hidden");
  $("fbError").classList.add("hidden");
  $("btnRetryEval").classList.add("hidden");

  const answer = {
    qid: q.id, q: q.q, tier: q.tier, transcript, durationSec,
    fillerPer100: stats.per100, words: stats.words, eval: null,
  };

  const hasKey = !!localStorage.getItem(LS.key);
  if (!hasKey) {
    // practice mode without AI
    state.session.answers.push(answer);
    $("fbBody").classList.add("hidden");
    $("fbError").textContent = "No API key set — AI feedback skipped. Your answer and recording were saved.";
    $("fbError").classList.remove("hidden");
    $("btnNext").classList.remove("hidden");
    renderNextLabel();
    return;
  }

  $("fbLoading").classList.remove("hidden");
  const trackKind = (q.track === "behavioral" || q.track === "presales") ? "behavioral/stakeholder" : "technical/design";
  const fillerList = Object.entries(stats.found).map(([w,c]) => `${w}×${c}`).join(", ") || "none detected";
  const userContent =
`INTERVIEW CONTEXT
Track: ${window.TRACKS[q.track].label} (${trackKind} rubric applies)
Question tier: ${q.tier}
Question: ${q.q}

ANSWER STATS
Duration: ${durationSec}s (target range ${lo}–${hi}s)
Word count: ${stats.words}
Filler words: ${stats.fillers} total, ${stats.per100} per 100 words (${fillerList})

CANDIDATE TRANSCRIPT (verbatim, from speech-to-text — minor mis-transcriptions possible):
"""
${transcript}
"""

Evaluate this answer against the rubric and submit via the tool.`;

  try {
    const ev = await callAI(EVAL_SYSTEM, EVAL_TOOL, userContent, 2500);
    answer.eval = ev;
    state.session.answers.push(answer);
    renderFeedback(ev);
  } catch (e) {
    $("fbLoading").classList.add("hidden");
    const msg = e.message === "NO_KEY" ? "No API key set." : e.message;
    $("fbError").textContent = `Evaluation failed — ${msg}`;
    $("fbError").classList.remove("hidden");
    $("btnRetryEval").classList.remove("hidden");
    $("btnSubmit").disabled = false;
    $("btnAnswer").disabled = false;
    $("btnNext").classList.remove("hidden");   // allow moving on without feedback
    renderNextLabel();
    // keep the answer if user moves on without retry
    state.pendingAnswer = answer;
  }
}

function renderFeedback(ev) {
  $("fbLoading").classList.add("hidden");
  $("fbBody").classList.remove("hidden");
  $("fbOverall").innerHTML = `${ev.overall}<small>overall</small>`;
  $("fbVerdict").textContent = `“${ev.verdict}”`;
  const dims = [["structure","Structure"],["specificity","Specificity"],["seniority_signal","Seniority"],["conciseness","Conciseness"]];
  const grid = $("fbScores");
  grid.innerHTML = "";
  dims.forEach(([k, label]) => {
    const v = ev.scores[k];
    const cell = el("div", "score-cell" + (v <= 4 ? " low" : v >= 8 ? " high" : ""));
    cell.appendChild(el("div", "s-name", label));
    cell.appendChild(el("div", "s-val", String(v)));
    const bar = el("div", "score-bar");
    const fill = el("i"); fill.style.width = `${v * 10}%`;
    bar.appendChild(fill); cell.appendChild(bar);
    grid.appendChild(cell);
  });
  const fill = (id, items) => { const u = $(id); u.innerHTML = ""; (items || []).forEach(t => u.appendChild(el("li", null, t))); };
  fill("fbGaps", ev.gaps);
  fill("fbStrengths", ev.strengths);
  fill("fbDelivery", ev.delivery.length ? ev.delivery : ["Clean delivery — no filler or rambling flags."]);
  fill("fbOutline", ev.model_answer_outline);
  fill("fbFollowups", ev.followups);
  $("btnNext").classList.remove("hidden");
  renderNextLabel();
}

function renderNextLabel() {
  const last = state.qIndex >= state.session.questions.length - 1;
  $("btnNext").textContent = last ? "Finish session →" : "Next question →";
}

function nextQuestion() {
  if (state.pendingAnswer) { state.session.answers.push(state.pendingAnswer); state.pendingAnswer = null; }
  if (state.qIndex >= state.session.questions.length - 1) return finishSession();
  state.qIndex++;
  renderQuestion();
}

function skipQuestion() {
  if (state.answering) toggleAnswer();
  if (state.qIndex >= state.session.questions.length - 1) return finishSession();
  state.qIndex++;
  renderQuestion();
}

async function endSessionEarly() {
  if (state.answering) await toggleAnswer();
  if (state.session.answers.length) finishSession();
  else { teardownMedia(); show("screen-home"); renderHome(); }
}

function teardownMedia() {
  stopInterviewerVoice();
  stopSpeech();
  if (state.recorder && state.recorder.state !== "inactive") try { state.recorder.stop(); } catch {}
  if (state.stream) { state.stream.getTracks().forEach(t => t.stop()); state.stream = null; }
  $("preview").srcObject = null;
  $("videoOverlay").classList.remove("hidden");
  clearInterval(state.timerInt);
}

// ───────────────────────── session report ─────────────────────────
const SUMMARY_TOOL = {
  name: "submit_session_report",
  description: "Submit the end-of-session coaching report.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      top_weaknesses: { type: "array", items: { type: "string" }, description: "Exactly 3 recurring weaknesses across the session, each with evidence from specific answers." },
      practice_plan: { type: "array", items: { type: "string" }, description: "3-5 prioritized, concrete drills for the next practice session." },
      coach_note: { type: "string", description: "2-3 sentences: the honest overall read on this candidate today." },
    },
    required: ["top_weaknesses","practice_plan","coach_note"],
    additionalProperties: false,
  },
};

async function finishSession() {
  teardownMedia();
  const s = state.session;
  const scored = s.answers.filter(a => a.eval);
  s.avgOverall = scored.length ? +(scored.reduce((t,a) => t + a.eval.overall, 0) / scored.length).toFixed(2) : null;
  state.viewingSaved = false;
  show("screen-report");
  renderReport(s, false);

  // AI session summary (needs key + at least 2 evaluated answers)
  if (localStorage.getItem(LS.key) && scored.length >= 2) {
    $("summaryLoading").classList.remove("hidden");
    try {
      const digest = scored.map((a,i) =>
        `Q${i+1} [${a.tier}] "${a.q}"
scores: structure ${a.eval.scores.structure}, specificity ${a.eval.scores.specificity}, seniority ${a.eval.scores.seniority_signal}, conciseness ${a.eval.scores.conciseness}, overall ${a.eval.overall}
verdict: ${a.eval.verdict}
gaps: ${a.eval.gaps.join(" | ")}
delivery: ${a.eval.delivery.join(" | ") || "clean"}`).join("\n\n");
      const sum = await callAI(
        EVAL_SYSTEM,
        SUMMARY_TOOL,
        `You just ran a full ${window.TRACKS[s.track].label} session with this candidate. Here are your per-question notes:\n\n${digest}\n\nWrite the end-of-session report: the 3 weaknesses that recur across answers (with evidence), a prioritized practice plan for their next session, and your honest coach's note. Submit via the tool.`,
        1500
      );
      s.summary = sum;
    } catch (e) {
      s.summary = null;
      console.warn("summary failed:", e.message);
    }
    $("summaryLoading").classList.add("hidden");
    renderSummary(s);
  }

  // persist
  const sessions = getSessions();
  sessions.push(s);
  saveSessions(sessions);
  renderHome(); // refresh history behind the scenes
}

function renderReport(s, isSaved) {
  $("reportTitle").textContent = `${window.TRACKS[s.track]?.label || s.track} — session report`;
  $("reportMeta").textContent = `${new Date(s.date).toLocaleString()} · ${s.answers.length} answered · difficulty: ${s.difficulty}`;

  // stat tiles
  const scored = s.answers.filter(a => a.eval);
  const stats = $("reportStats");
  stats.innerHTML = "";
  const tile = (val, label) => {
    const t = el("div", "stat-tile");
    t.appendChild(el("div", "st-val", val));
    t.appendChild(el("div", "st-label", label));
    stats.appendChild(t);
  };
  tile(s.avgOverall != null ? s.avgOverall.toFixed(1) : "—", "avg overall");
  if (scored.length) {
    const avg = (k) => (scored.reduce((t,a) => t + a.eval.scores[k], 0) / scored.length).toFixed(1);
    tile(avg("structure"), "structure");
    tile(avg("specificity"), "specificity");
    tile(avg("seniority_signal"), "seniority");
    tile(avg("conciseness"), "conciseness");
  }
  const avgFiller = s.answers.length ? (s.answers.reduce((t,a) => t + (a.fillerPer100 || 0), 0) / s.answers.length).toFixed(1) : "0";
  tile(avgFiller, "fillers /100 words");

  renderSummary(s);

  // per-question
  const wrap = $("reportQuestions");
  wrap.innerHTML = "";
  s.answers.forEach((a, i) => {
    const box = el("div", "rq");
    const head = el("div", "rq-head");
    head.appendChild(el("div", "rq-q", `Q${i+1} · ${a.q}`));
    head.appendChild(el("div", "rq-score", a.eval ? `${a.eval.overall}/10` : "—"));
    const body = el("div", "rq-body hidden");
    head.onclick = () => body.classList.toggle("hidden");

    // recording playback (lazy)
    const vidSlot = el("div");
    body.appendChild(vidSlot);
    let vidLoaded = false;
    head.addEventListener("click", async () => {
      if (vidLoaded || body.classList.contains("hidden")) return;
      vidLoaded = true;
      const blob = await idbGet(`${s.id}:${i}`);
      if (blob) {
        const v = document.createElement("video");
        v.controls = true;
        v.src = URL.createObjectURL(blob);
        vidSlot.appendChild(v);
      } else {
        vidSlot.appendChild(el("p", "small muted", "No recording for this answer."));
      }
    });

    if (a.eval) {
      const ev = a.eval;
      body.appendChild(el("p", null, `“${ev.verdict}”`)).style.fontStyle = "italic";
      const sc = el("p", "small muted",
        `structure ${ev.scores.structure} · specificity ${ev.scores.specificity} · seniority ${ev.scores.seniority_signal} · conciseness ${ev.scores.conciseness} · ${a.durationSec}s · ${a.fillerPer100} fillers/100w`);
      body.appendChild(sc);
      const mk = (title, items, ordered) => {
        if (!items || !items.length) return;
        body.appendChild(el("h4", null, title));
        const list = el(ordered ? "ol" : "ul");
        items.forEach(t => list.appendChild(el("li", null, t)));
        body.appendChild(list);
      };
      mk("What was missing", ev.gaps);
      mk("Strong answer shape", ev.model_answer_outline, true);
      mk("Follow-ups to prepare for", ev.followups);
      mk("Delivery", ev.delivery);
    } else {
      body.appendChild(el("p", "small muted", "Not evaluated (no API key or evaluation failed)."));
    }
    body.appendChild(el("div", "rq-transcript", a.transcript || "(no transcript)"));
    box.append(head, body);
    wrap.appendChild(box);
  });
}

function renderSummary(s) {
  const body = $("summaryBody");
  body.innerHTML = "";
  if (s.summary) {
    body.appendChild(el("p", null, s.summary.coach_note)).style.fontStyle = "italic";
    body.appendChild(el("h4", null, "Top 3 recurring weaknesses"));
    const w = el("ul", "weak-list");
    s.summary.top_weaknesses.forEach(t => w.appendChild(el("li", null, t)));
    body.appendChild(w);
    body.appendChild(el("h4", null, "Practice plan for next session"));
    const p = el("ol", "plan-list");
    s.summary.practice_plan.forEach(t => p.appendChild(el("li", null, t)));
    body.appendChild(p);
  } else {
    const scored = s.answers.filter(a => a.eval);
    if (scored.length) {
      // local fallback: weakest dimensions
      const dims = ["structure","specificity","seniority_signal","conciseness"];
      const avgs = dims.map(k => [k, scored.reduce((t,a) => t + a.eval.scores[k], 0) / scored.length]).sort((a,b) => a[1] - b[1]);
      body.appendChild(el("p", "small muted", `AI session summary unavailable. Weakest dimensions this session: ${avgs.slice(0,2).map(([k,v]) => `${k.replace("_"," ")} (${v.toFixed(1)})`).join(", ")}. Review the per-question gaps below.`));
    } else {
      body.appendChild(el("p", "small muted", "No evaluated answers this session — add an API key to get scored feedback."));
    }
  }
}

function openSavedReport(id) {
  const s = getSessions().find(x => x.id === id);
  if (!s) return;
  state.viewingSaved = true;
  show("screen-report");
  renderReport(s, true);
}

// ───────────────────────── keyboard shortcuts ─────────────────────────
document.addEventListener("keydown", (e) => {
  const onSession = !$("screen-session").classList.contains("hidden");
  const typing = document.activeElement && ["TEXTAREA","INPUT","SELECT"].includes(document.activeElement.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && onSession) {
    e.preventDefault();
    if (!$("btnSubmit").disabled) submitAnswer();
    return;
  }
  if (typing || !onSession || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "r" && !$("btnAnswer").disabled) { e.preventDefault(); toggleAnswer(); }
  else if (k === "q") { e.preventDefault(); speakQuestion(currentQ().q); }
  else if (k === "n" && !$("btnNext").classList.contains("hidden")) { e.preventDefault(); nextQuestion(); }
  else if (k === "s") { e.preventDefault(); skipQuestion(); }
});

// ───────────────────────── wiring ─────────────────────────
$("btnStart").onclick = startSession;
$("btnAnswer").onclick = toggleAnswer;
$("btnSubmit").onclick = submitAnswer;
$("btnSkip").onclick = skipQuestion;
$("btnNext").onclick = nextQuestion;
$("btnRetryEval").onclick = () => { state.pendingAnswer = null; submitAnswer(); };
$("btnEndSession").onclick = endSessionEarly;
$("btnEnableCam").onclick = () => tryEnableCamera(false);
$("chkInterviewerVoice").addEventListener("change", () => {
  const enabled = $("chkInterviewerVoice").checked;
  setInterviewerVoiceEnabled(enabled);
  if (!enabled) stopInterviewerVoice();
  else if (!$("screen-session").classList.contains("hidden")) speakQuestion(currentQ().q);
});
$("chkRealisticVoice").addEventListener("change", () => {
  const enabled = $("chkRealisticVoice").checked;
  setRealisticVoiceEnabled(enabled);
  syncInterviewerControls();
  if (enabled) {
    // warm up the model so the first question is ready
    loadKokoro().then(() => setAvatarStatus("Realistic interviewer voice ready.")).catch(() => {});
  }
});
$("selKokoroVoice").addEventListener("change", () => {
  setKokoroVoice($("selKokoroVoice").value);
});
$("btnReplayQuestion").onclick = () => speakQuestion(currentQ().q);
$("btnStopQuestionVoice").onclick = () => stopInterviewerVoice();
$("btnPrint").onclick = () => window.print();
$("btnHome").onclick = () => { show("screen-home"); renderHome(); };
$("brandHome").onclick = () => {
  if (!$("screen-session").classList.contains("hidden")) {
    if (!confirm("Leave the session? Answers so far will be lost unless you end the session properly.")) return;
    teardownMedia();
  }
  show("screen-home"); renderHome();
};
$("inpApiKey").addEventListener("change", () => {
  const v = $("inpApiKey").value.trim();
  if (v) localStorage.setItem(LS.key, v); else localStorage.removeItem(LS.key);
  renderKeyStatus();
});
$("selGeminiModel").addEventListener("change", () => {
  setGeminiModel($("selGeminiModel").value);
  renderKeyStatus();
});
$("btnToggleKey").onclick = () => {
  const i = $("inpApiKey");
  i.type = i.type === "password" ? "text" : "password";
};

renderHome();
})();
