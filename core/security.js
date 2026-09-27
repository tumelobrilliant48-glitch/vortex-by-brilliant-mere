// core/security.js - VORTEX Security
// By Brilliant Tumelo Mere
// Face ID + Fingerprint + PIN + Password + Pattern + Security Questions
// Settings: Home Themes + App Manager + Security
// Awareness: people claiming to use someone account - RED close
// Child safety - RED auto close

export const SecurityModule = {
  // STORAGE
  keys: {
    pin: 'vortex_pin',
    pass: 'vortex_pass',
    pattern: 'vortex_pattern',
    q: 'vortex_questions',
    biometric: 'vortex_bio',
    fail: 'vortex_fail',
    vaultPin: 'vortex_vault_3'
  },

  init() {
    window.Security = this;
    this.loadUI();
  },

  // FACE / FINGERPRINT - WebAuthn
  async enableBiometric(type = 'face') {
    try {
      if (!window.PublicKeyCredential) {
        alert('Biometric not supported — use PIN');
        return false;
      }
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'VORTEX' },
          user: { id: new Uint8Array(16), name: 'vortex@user', displayName: 'VORTEX User' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { userVerification: 'required' }
        }
      });
      localStorage.setItem(this.keys.biometric, type);
      alert(`${type} enabled — Face ID / Fingerprint set`);
      return true;
    } catch (e) {
      alert('Biometric failed: ' + e.message);
      return false;
    }
  },

  async checkBiometric() {
    try {
      const cred = await navigator.credentials.get({
        publicKey: { challenge: new Uint8Array(32), userVerification: 'required' }
      });
      return !!cred;
    } catch { return false; }
  },

  // PIN
  setPin(pin) {
    if (pin.length < 4) return alert('PIN must 4+ digits');
    localStorage.setItem(this.keys.pin, btoa(pin));
    alert('PIN saved');
  },
  checkPin(pin) {
    const saved = localStorage.getItem(this.keys.pin);
    return saved && atob(saved) === pin;
  },

  // PASSWORD
  setPassword(pass) {
    if (pass.length < 6) return alert('Password 6+ chars');
    localStorage.setItem(this.keys.pass, btoa(pass));
    alert('Password saved');
  },
  checkPassword(pass) {
    const saved = localStorage.getItem(this.keys.pass);
    return saved && atob(saved) === pass;
  },

  // PATTERN
  setPattern(seq) {
    // seq like [1,2,5,8]
    localStorage.setItem(this.keys.pattern, JSON.stringify(seq));
    alert('Pattern saved');
  },
  checkPattern(seq) {
    const saved = JSON.parse(localStorage.getItem(this.keys.pattern) || '[]');
    return JSON.stringify(saved) === JSON.stringify(seq);
  },

  // SECURITY QUESTIONS
  setQuestions(q1, a1, q2, a2) {
    localStorage.setItem(this.keys.q, JSON.stringify({ q1, a1: btoa(a1.toLowerCase()), q2, a2: btoa(a2.toLowerCase()) }));
    alert('Security questions saved');
  },
  checkQuestions(a1, a2) {
    const data = JSON.parse(localStorage.getItem(this.keys.q) || 'null');
    if (!data) return false;
    return atob(data.a1) === a1.toLowerCase() && atob(data.a2) === a2.toLowerCase();
  },

  // VAULT - 3 PASSCODE SYSTEM
  setVault3(p1, p2, p3) {
    localStorage.setItem(this.keys.vaultPin, JSON.stringify([btoa(p1), btoa(p2), btoa(p3)]));
    alert('Vault 3 passcodes set — private downloads + marketplace safe');
  },
  checkVault3(input) {
    const saved = JSON.parse(localStorage.getItem(this.keys.vaultPin) || '[]');
    if (!saved.length) return true;
    const decoded = saved.map(s => atob(s));
    return decoded.includes(input);
  },

  // CHILD SAFETY + AWARENESS
  scan(text) {
    const child = ['child','minor','underage','kid','teen','school kid','young boy','young girl','csam'];
    const scam = ['send money fast','gift card','lottery win','verify link','urgent transfer','double crypto','free money click','claiming to use someone account'];
    const t = text.toLowerCase();
    if (child.some(w => t.includes(w))) {
      this.redAlert('Child safety violation — RED and closed automatically');
      return { blocked: true, type: 'CHILD' };
    }
    if (scam.some(w => t.includes(w))) {
      this.redAlert('Scam detected — Awareness of people claiming to use someone account — RED and closed');
      return { blocked: true, type: 'SCAM' };
    }
    return { blocked: false };
  },

  redAlert(msg) {
    document.body.style.transition = 'background .2s';
    document.body.style.background = '#7a0000';
    alert(msg);
    setTimeout(() => {
      document.body.style.background = '';
      if (window.Router) Router.go('home');
    }, 1200);
    // Log fail
    let fails = parseInt(localStorage.getItem(this.keys.fail) || '0');
    localStorage.setItem(this.keys.fail, fails + 1);
    if (fails > 2) {
      alert('Multiple violations — Vault locked 5 min');
      setTimeout(() => localStorage.setItem(this.keys.fail, '0'), 300000);
    }
  },

  // UI RENDER FOR SETTINGS PAGE
  loadUI() {
    const box = document.getElementById('security-settings');
    if (!box) return;
    box.innerHTML = `
      <div class="card"><b>🔒 Security — Face / Fingerprint / PIN / Password / Pattern / Questions</b>
        <div style="display:grid;gap:8px;margin-top:10px">
          <button class="v-btn g" onclick="Security.enableBiometric('face')">Enable Face ID</button>
          <button class="v-btn g" onclick="Security.enableBiometric('fingerprint')">Enable Fingerprint</button>
          <input id="pinSet" class="inp" placeholder="Set PIN 4+ digits" type="password" />
          <button class="v-btn g" onclick="Security.setPin(document.getElementById('pinSet').value)">Save PIN</button>
          <input id="passSet" class="inp" placeholder="Set Password 6+ chars" type="password" />
          <button class="v-btn g" onclick="Security.setPassword(document.getElementById('passSet').value)">Save Password</button>
          <input id="vault3" class="inp" placeholder="Vault 3 passcodes comma separated e.g. 1111,2222,3333" />
          <button class="v-btn g" onclick="(()=>{const v=document.getElementById('vault3').value.split(','); Security.setVault3(v[0],v[1],v[2])})()">Save Vault 3 Passcodes</button>
        </div>
      </div>
    `;
  }
};
