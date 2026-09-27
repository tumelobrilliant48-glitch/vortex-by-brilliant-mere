// engine/vortex.js - VORTEX Eyes Engine
// By Brilliant Tumelo Mere
// Small eyes 32x24, tap=open Create, double tap=open Messages
// Hey VORTEX wake 2min, light up with sound, awareness, face/fingerprint

export class VortexEyes {
  constructor(selector = '#vortex-eyes') {
    this.el = document.querySelector(selector);
    this.by = document.getElementById('by');
    this.logo = document.getElementById('logo');
    if (!this.el) return;
    this.isAwake = false;
    this.taps = 0;
    this.tapTimer = null;
    this.wakeTimer = null;
    this.audioCtx = null;
    this.bind();
    this.eyeFollowMouse();
  }

  bind() {
    // TAP SYSTEM
    this.el.addEventListener('click', () => {
      this.taps++;
      clearTimeout(this.tapTimer);
      this.tapTimer = setTimeout(() => {
        if (this.taps === 1) {
          this.onSingleTap(); // open create
        } else if (this.taps >= 2) {
          this.onDoubleTap(); // open messages
        }
        this.taps = 0;
      }, 320);
    });

    // LONG PRESS = VAULT
    let pressTimer;
    this.el.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => this.openVault(), 800);
    });
    this.el.addEventListener('touchend', () => clearTimeout(pressTimer));
  }

  onSingleTap() {
    this.wake();
    if (window.Router) Router.go('create');
    this.speak('Create');
  }

  onDoubleTap() {
    this.wake();
    if (window.Router) Router.go('messages');
    this.speak('Messages');
  }

  openVault() {
    this.wake();
    if (window.Router) Router.go('vault');
    this.speak('Vault locked');
  }

  wake() {
    if (this.isAwake) return;
    this.isAwake = true;
    this.el.classList.add('awake');
    if (this.by) this.by.innerText = 'Listening... Say Hey VORTEX (2min)';
    if (this.logo) this.logo.style.filter = 'drop-shadow(0 0 24px #fff)';

    // Sound reactive - light up with sound
    this.startSoundGlow();

    // Hey VORTEX voice - 2 min
    this.startVoice();

    // Auto sleep after 2 min
    clearTimeout(this.wakeTimer);
    this.wakeTimer = setTimeout(() => this.sleep(), 120000);
  }

  sleep() {
    this.isAwake = false;
    this.el.classList.remove('awake', 'sound-glow');
    if (this.by) this.by.innerText = 'By Brilliant Tumelo Mere';
    if (this.logo) this.logo.style.filter = 'drop-shadow(0 0 18px var(--cyan))';
    this.stopSoundGlow();
  }

  // SOUND GLOW - light up with sound
  async startSoundGlow() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = this.audioCtx.createAnalyser();
      const src = this.audioCtx.createMediaStreamSource(stream);
      src.connect(analyser);
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);

      this.soundInterval = setInterval(() => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 28) {
          this.el.classList.add('sound-glow');
        } else {
          this.el.classList.remove('sound-glow');
        }
      }, 90);

      // stop after 2min
      setTimeout(() => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(this.soundInterval);
      }, 120000);
    } catch {}
  }

  stopSoundGlow() {
    clearInterval(this.soundInterval);
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
    }
  }

  // HEY VORTEX VOICE + EYES TYPE WHILE YOU SPEAK
  startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
      const input = document.getElementById('msgInput') || document.getElementById('aiPrompt');

      // Awareness - people claiming to use someone account
      if (transcript.includes('hey vortex')) {
        this.by.innerText = 'Yes? Command: Create / Messages / Vault / Search?';
        this.speak('Yes');
      } else if (transcript.includes('create')) {
        Router.go('create');
      } else if (transcript.includes('message')) {
        Router.go('messages');
      } else if (transcript.includes('vault')) {
        Router.go('vault');
      } else if (transcript.includes('search')) {
        Router.go('search');
      } else {
        // Eyes can type while you speak
        if (input) {
          input.value += transcript + ' ';
          input.focus();
        }
      }
    };

    try { r.start(); } catch {}
    setTimeout(() => { try { r.stop(); } catch {} }, 120000);
  }

  speak(text) {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.volume = 0.7; u.rate = 1.1;
      speechSynthesis.speak(u);
    }
  }

  // Eye follow mouse/touch - awareness
  eyeFollowMouse() {
    document.addEventListener('mousemove', (e) => {
      const pupils = document.querySelectorAll('.pupil');
      pupils.forEach(p => {
        const rect = p.parentElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
        p.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      });
    });
  }
}
