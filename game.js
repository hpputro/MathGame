(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ---------- Elemen ----------
  const screens = { menu: $("menu"), game: $("game"), result: $("result") };
  const startSel = $("startNum");
  const endSel = $("endNum");
  const speedSel = $("speed");
  const sky = $("sky");
  const balloon = $("balloon");
  const balloonBody = balloon.querySelector(".balloon-body");
  const questionEl = $("question");
  const answerBox = $("answerBox");
  const ground = $("ground");

  const COLORS = ["#ff6b6b", "#ff9f43", "#feca57", "#1dd1a1", "#54a0ff", "#5f27cd", "#ff6bcb", "#00d2d3"];
  const OP_SYMBOL = { "+": "+", "-": "−", "x": "×", "/": "÷" };

  // ---------- State ----------
  const state = {
    op: "+",
    start: 1,
    end: 9,
    speed: 5,          // detik sampai balon menyentuh tanah
    questions: [],
    index: 0,
    score: 0,
    input: "",
    running: false,
    locked: false,     // true saat animasi pecah/jatuh
    startTime: 0,
    rafId: 0,
  };

  // ---------- Menu ----------
  for (let i = 1; i <= 20; i++) {
    startSel.add(new Option(i, i));
    endSel.add(new Option(i, i));
  }
  startSel.value = "1";
  endSel.value = "9";

  document.querySelectorAll(".op-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".op-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.op = btn.dataset.op;
    });
  });

  $("startBtn").addEventListener("click", () => {
    const start = parseInt(startSel.value, 10);
    const end = parseInt(endSel.value, 10);
    if (start > end) {
      $("menuError").textContent = "Angka Awal tidak boleh lebih besar dari Angka Akhir.";
      return;
    }
    $("menuError").textContent = "";
    state.start = start;
    state.end = end;
    state.speed = parseFloat(speedSel.value);
    startGame();
  });

  $("retryBtn").addEventListener("click", startGame);
  $("menuBtn").addEventListener("click", () => showScreen("menu"));
  $("quitBtn").addEventListener("click", () => {
    stopLoop();
    state.running = false;
    showScreen("menu");
  });

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  // ---------- Pembuatan soal ----------
  // Urutan: a op b untuk a = awal..akhir, b = awal..akhir
  // Contoh + dari 1 s/d 9: 1+1, 1+2, ... 1+9, 2+1, ... 9+9
  // Pengurangan & pembagian dibuat agar hasilnya selalu bilangan bulat positif:
  //   pengurangan: (a+b) − a = b
  //   pembagian  : (a×b) ÷ a = b
  function buildQuestions(op, start, end) {
    const list = [];
    for (let a = start; a <= end; a++) {
      for (let b = start; b <= end; b++) {
        switch (op) {
          case "+": list.push({ text: `${a} + ${b}`, answer: a + b }); break;
          case "-": list.push({ text: `${a + b} − ${a}`, answer: b }); break;
          case "x": list.push({ text: `${a} × ${b}`, answer: a * b }); break;
          case "/": list.push({ text: `${a * b} ÷ ${a}`, answer: b }); break;
        }
      }
    }
    return list;
  }

  // ---------- Alur game ----------
  function startGame() {
    stopLoop();
    state.questions = buildQuestions(state.op, state.start, state.end);
    state.index = 0;
    state.score = 0;
    state.running = true;
    showScreen("game");
    nextQuestion();
  }

  function nextQuestion() {
    if (state.index >= state.questions.length) {
      endGame(true);
      return;
    }
    const q = state.questions[state.index];
    questionEl.textContent = q.text;
    fitQuestionText();

    const color = COLORS[state.index % COLORS.length];
    balloonBody.style.setProperty("--balloon-color", color);
    balloon.style.setProperty("--knot-color", color);
    balloon.classList.remove("pop", "crash");
    balloon.style.left = randomLeft();
    balloon.style.transform = `translateY(${-balloon.offsetHeight}px)`;

    setInput("");
    answerBox.classList.remove("wrong", "right");
    updateHud();

    state.locked = false;
    state.startTime = performance.now();
    stopLoop();
    state.rafId = requestAnimationFrame(tick);
  }

  function randomLeft() {
    const w = sky.clientWidth;
    const bw = balloon.offsetWidth;
    const margin = bw / 2 + 10;
    const x = margin + Math.random() * Math.max(0, w - margin * 2);
    return `${x}px`;
  }

  function fitQuestionText() {
    const len = questionEl.textContent.length;
    questionEl.style.fontSize = len > 9 ? "1.5rem" : len > 7 ? "1.8rem" : "";
  }

  // Posisi balon dihitung dari waktu, sehingga balon tepat menyentuh tanah setelah `speed` detik
  function tick(now) {
    if (!state.running || state.locked) return;
    const elapsed = (now - state.startTime) / 1000;
    const progress = Math.min(elapsed / state.speed, 1);

    const startY = -balloon.offsetHeight;
    const balloonBottomOffset = balloonBody.offsetHeight + 12; // badan + simpul
    const endY = sky.clientHeight - ground.offsetHeight - balloonBottomOffset;
    const y = startY + (endY - startY) * progress;
    balloon.style.transform = `translateY(${y}px)`;

    if (progress >= 1) {
      balloonHitsGround();
      return;
    }
    state.rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    cancelAnimationFrame(state.rafId);
  }

  function updateHud() {
    const total = state.questions.length;
    $("progressText").textContent = `Soal ${Math.min(state.index + 1, total)} / ${total}`;
    $("progressBar").style.width = `${(state.index / total) * 100}%`;
    $("scoreText").textContent = `⭐ ${state.score}`;
  }

  // ---------- Input jawaban ----------
  function setInput(val) {
    state.input = val;
    answerBox.innerHTML = val === "" ? "&nbsp;" : val;
  }

  function pressKey(key) {
    if (!state.running || state.locked) return;
    answerBox.classList.remove("wrong");
    if (key === "back") {
      setInput(state.input.slice(0, -1));
      return;
    }
    if (key === "clear") {
      setInput("");
      return;
    }
    if (key === "enter") {
      if (state.input !== "") checkAnswer(true);
      return;
    }
    if (!/^[0-9]$/.test(key) || state.input.length >= 4) return;
    setInput(state.input === "0" ? key : state.input + key);
    checkAnswer(false);
  }

  // Jawaban dicek otomatis: benar -> balon pecah.
  // Salah -> diberi tanda jika jumlah digit sudah sama dengan jawaban (atau tekan Enter).
  function checkAnswer(force) {
    const q = state.questions[state.index];
    const value = parseInt(state.input, 10);
    if (value === q.answer) {
      popBalloon();
    } else if (force || state.input.length >= String(q.answer).length) {
      answerBox.classList.remove("wrong");
      void answerBox.offsetWidth; // restart animasi
      answerBox.classList.add("wrong");
      playTone(180, 0.15, "square");
      setTimeout(() => {
        if (!state.locked) setInput("");
      }, 350);
    }
  }

  $("numpad").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn) pressKey(btn.dataset.key);
  });

  document.addEventListener("keydown", (e) => {
    if (!screens.game.classList.contains("active")) {
      if (e.key === "Enter" && screens.result.classList.contains("active")) startGame();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("back");
    else if (e.key === "Delete" || e.key === "Escape") pressKey("clear");
    else if (e.key === "Enter") pressKey("enter");
    else return;
    e.preventDefault();
  });

  // ---------- Pecah / Jatuh ----------
  function popBalloon() {
    state.locked = true;
    stopLoop();
    state.score++;
    answerBox.classList.add("right");
    balloon.classList.add("pop");
    spawnBurst();
    playPop();
    state.index++;
    updateHud();
    setTimeout(nextQuestion, 450);
  }

  function balloonHitsGround() {
    state.locked = true;
    stopLoop();
    balloon.classList.add("crash");
    playTone(120, 0.5, "sawtooth");
    setTimeout(() => endGame(false), 800);
  }

  function spawnBurst() {
    const rect = balloonBody.getBoundingClientRect();
    const skyRect = sky.getBoundingClientRect();
    const cx = rect.left - skyRect.left + rect.width / 2;
    const cy = rect.top - skyRect.top + rect.height / 2;
    const color = balloonBody.style.getPropertyValue("--balloon-color");
    for (let i = 0; i < 14; i++) {
      const p = document.createElement("div");
      p.className = "burst";
      const angle = (Math.PI * 2 * i) / 14;
      const dist = 70 + Math.random() * 40;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.background = i % 2 ? color : "#fff3a8";
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      sky.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
  }

  // ---------- Akhir game ----------
  function endGame(won) {
    state.running = false;
    stopLoop();
    const total = state.questions.length;
    const lastQ = state.questions[total - 1];
    if (won) {
      $("resultEmoji").textContent = "🏆";
      $("resultTitle").textContent = "Kamu Menang!";
      $("resultText").textContent =
        `Hebat! Kamu berhasil memecahkan semua ${total} balon sampai ${lastQ.text} = ${lastQ.answer}.`;
      launchConfetti();
      playWin();
    } else {
      const q = state.questions[state.index];
      $("resultEmoji").textContent = "😢";
      $("resultTitle").textContent = "Balon Menyentuh Tanah!";
      $("resultText").textContent =
        `Jawaban yang benar: ${q.text} = ${q.answer}. Kamu memecahkan ${state.score} dari ${total} balon. Ayo coba lagi!`;
    }
    showScreen("result");
  }

  function launchConfetti() {
    const box = $("confetti");
    for (let i = 0; i < 80; i++) {
      const c = document.createElement("div");
      c.className = "confetti-piece";
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = COLORS[i % COLORS.length];
      c.style.animationDuration = `${2 + Math.random() * 2}s`;
      c.style.animationDelay = `${Math.random() * 0.8}s`;
      box.appendChild(c);
      setTimeout(() => c.remove(), 5000);
    }
  }

  // ---------- Suara (Web Audio, tanpa file) ----------
  let audioCtx = null;
  function ctx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = "sine", delay = 0) {
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  function playPop() {
    const ac = ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  function playWin() {
    [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.25, "triangle", i * 0.15));
  }
})();
