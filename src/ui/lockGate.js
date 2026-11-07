/**
 * 🔒 Lock Gate (Plan Round 13b) — a front-door passcode for the birthday universe.
 * The code is Ming's birthday (4/9/53). We never store the digits themselves —
 * only SHA-256 hashes of the accepted formats, verified via WebCrypto.
 * QA/dev flows (qa, debug, skipintro, cinema, fx, ratio params) bypass the gate.
 */

const LOCKED_CODE_HASHES = new Set([
  '15d1a6f1bba4a43853d946c69b1e414d0daf63701ce68fab73c73cde8d20fd82', // 040953
  '3beb9fb620b34c5d9a3b7fed7b9aa21192ac16d725659742c162f646a9f52a0d', // 40953
  'f0b48f80d727675726cc2734cd16273c36814c5850c7f539f74ec743a6462f23', // 4953
  'fd9617a7b8096a17c1ca69e2180726ba2d0db2efbd2443a1902303ff702b5f65', // 04092553
  '00b503b451adacc66ae5d90ec5ec48d1a6c266563a27d2eb1a5da6c46d8c0e18', // 4092553
  '6243520f288f83308a459f177f3f36e12c0d85b9b76063824d2e7491077a2ffa', // 492553
  '25a13741612772052e6ab63370d3f79ed8e1ce27113e062cc4d2466fef2529b1', // 040910
  'fab1ac8e7623dae4325b3f332f82f017da495fa2e2211e954a8c09d84f671b83', // 40910
  '0a38b4739f62ff43b1039f63641c1cd522c80d67f6218db8551f4cd2a8e1187c', // 4910
  'beae6da149d4aad8cca89a031dac2010bfddda19dc64a0262cea6afaaf65b5df', // 04092010
  '1d2bdc7ec207901fb492c7fd12da462b1c90f4edb75ab417189b78a804c1a958', // 4092010
  '5d9731d6034e98443280987e158a03735ed82a898c896e90997f57d88ce98450'  // 492010
]);

const UNLOCK_STORAGE_KEY = 'kh_lock_ok';

function shouldBypassLock() {
  const params = new URLSearchParams(window.location.search);
  return ['qa', 'debug', 'skipintro', 'cinema', 'fx', 'ratio'].some((key) => params.has(key))
    || window.sessionStorage.getItem(UNLOCK_STORAGE_KEY) === '1';
}

function normalizeCode(rawText) {
  const thaiDigits = '๐๑๒๓๔๕๖๗๘๙';
  const digits = String(rawText || '')
    .split('')
    .map((ch) => {
      const thaiIndex = thaiDigits.indexOf(ch);
      return thaiIndex >= 0 ? String(thaiIndex) : ch;
    })
    .filter((ch) => ch >= '0' && ch <= '9')
    .join('');
  return digits;
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function initLockGate() {
  if (shouldBypassLock()) return;
  if (!window.crypto?.subtle) return; // Very old browsers: fail open rather than block the gift

  document.body.style.overflow = 'hidden';

  const gate = document.createElement('div');
  gate.id = 'lock-gate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.setAttribute('aria-label', 'ปลดล็อกจักรวาลด้วยรหัสลับ');
  gate.innerHTML = `
    <div class="lock-gate-stars"></div>
    <form class="lock-gate-card" autocomplete="off">
      <div class="lock-gate-heart"></div>
      <h1 class="lock-gate-title">จักรวาลดวงนี้เปิดให้คนพิเศษเท่านั้น</h1>
      <p class="lock-gate-sub">ใส่ <strong>วันเกิดของคนที่ส่งลิงก์นี้มาให้คุณ</strong><br><span class="lock-gate-hint">(ตัวเลขวัน/เดือน/ปี เช่น 010142 หรือ 1/1/42)</span></p>
      <input id="lock-gate-input" class="lock-gate-input" inputmode="numeric" autocomplete="off"
        placeholder="เช่น 010142" aria-label="รหัสลับปลดล็อก" maxlength="12" />
      <button type="submit" class="lock-gate-btn">ปลดล็อกจักรวาล</button>
      <p class="lock-gate-error" id="lock-gate-error" role="alert"></p>
    </form>
  `;
  document.body.appendChild(gate);

  const style = document.createElement('style');
  style.textContent = `
    #lock-gate {
      position: fixed; inset: 0; z-index: 2147483000;
      display: flex; align-items: center; justify-content: center;
      padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
      background:
        radial-gradient(ellipse 120% 90% at 50% -10%, rgba(88, 28, 135, .55), transparent 60%),
        radial-gradient(ellipse 100% 70% at 50% 110%, rgba(157, 23, 77, .38), transparent 55%),
        linear-gradient(180deg, #07031a 0%, #10042e 55%, #1b0533 100%);
      font-family: 'Prompt', 'Noto Sans Thai', sans-serif;
      transition: opacity .7s ease;
    }
    #lock-gate.lock-gate-out { opacity: 0; pointer-events: none; }
    .lock-gate-stars {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        radial-gradient(1.4px 1.4px at 12% 22%, rgba(255,255,255,.9), transparent 55%),
        radial-gradient(1.1px 1.1px at 78% 14%, rgba(216,180,254,.85), transparent 55%),
        radial-gradient(1.6px 1.6px at 30% 78%, rgba(244,114,182,.8), transparent 55%),
        radial-gradient(1.2px 1.2px at 88% 62%, rgba(255,255,255,.75), transparent 55%),
        radial-gradient(1.3px 1.3px at 62% 38%, rgba(192,132,252,.8), transparent 55%),
        radial-gradient(1px 1px at 44% 12%, rgba(255,255,255,.7), transparent 55%),
        radial-gradient(1.5px 1.5px at 8% 58%, rgba(254,240,251,.7), transparent 55%),
        radial-gradient(1.2px 1.2px at 70% 88%, rgba(216,180,254,.75), transparent 55%);
    }
    .lock-gate-card {
      position: relative; width: min(420px, 92vw);
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      padding: clamp(24px, 5vw, 38px);
      border-radius: 26px;
      background: rgba(24, 10, 48, .62);
      border: 1px solid rgba(192, 132, 252, .35);
      box-shadow: 0 24px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      text-align: center;
    }
    .lock-gate-heart { font-size: clamp(40px, 9vw, 54px); line-height: 1; filter: drop-shadow(0 0 18px rgba(244,114,182,.65)); }
    .lock-gate-title {
      margin: 0; font-size: clamp(20px, 4.6vw, 26px); font-weight: 700; color: #fff4fd;
      letter-spacing: .2px; text-shadow: 0 0 24px rgba(168,85,247,.55);
    }
    .lock-gate-sub { margin: 0; font-size: clamp(14px, 3.4vw, 16px); color: #e6d5f7; line-height: 1.65; }
    .lock-gate-hint { font-size: .86em; color: #c0a5e8; }
    .lock-gate-input {
      width: 100%; box-sizing: border-box; min-height: 56px;
      padding: 14px 18px; border-radius: 16px;
      border: 2px solid rgba(192,132,252,.45);
      background: rgba(12, 5, 28, .75); color: #ffe9fb;
      font-family: inherit; font-size: 22px; font-weight: 600; letter-spacing: .22em;
      text-align: center; outline: none;
    }
    .lock-gate-input:focus { border-color: rgba(244,114,182,.95); box-shadow: 0 0 0 4px rgba(244,114,182,.18); }
    .lock-gate-btn {
      width: 100%; min-height: 52px; border: none; border-radius: 16px; cursor: pointer;
      font-family: inherit; font-size: 17px; font-weight: 700; color: #2b0a3d;
      background: linear-gradient(135deg, #f9a8d4, #c084fc 55%, #f472b6);
      box-shadow: 0 10px 30px rgba(216, 84, 204, .38);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .lock-gate-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(216, 84, 204, .5); }
    .lock-gate-btn:active { transform: translateY(0); }
    .lock-gate-error { margin: 0; min-height: 1.4em; font-size: 14px; color: #fda4af; font-weight: 600; }
    .lock-gate-card.lock-gate-shake { animation: lock-gate-shake .45s ease; }
    @keyframes lock-gate-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-10px); } 40% { transform: translateX(9px); }
      60% { transform: translateX(-6px); } 80% { transform: translateX(4px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .lock-gate-card.lock-gate-shake { animation: none; }
      #lock-gate { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const form = gate.querySelector('.lock-gate-card');
  const input = gate.querySelector('#lock-gate-input');
  const errorEl = gate.querySelector('#lock-gate-error');

  let checking = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (checking) return;
    const code = normalizeCode(input.value);
    if (!code) {
      errorEl.textContent = 'ใส่รหัสเป็นตัวเลขนะ';
      return;
    }
    checking = true;
    errorEl.textContent = '';
    const hash = await sha256Hex(code);
    if (LOCKED_CODE_HASHES.has(hash)) {
      window.sessionStorage.setItem(UNLOCK_STORAGE_KEY, '1');
      gate.classList.add('lock-gate-out');
      document.body.style.overflow = '';
      window.setTimeout(() => {
        gate.remove();
        style.remove();
      }, 750);
    } else {
      form.classList.remove('lock-gate-shake');
      void form.offsetWidth; // restart the shake animation
      form.classList.add('lock-gate-shake');
      errorEl.textContent = 'ยังไม่ใช่จ้าา… ลองนึกวันเกิดของเขาดีๆ';
      input.select();
      checking = false;
    }
  });

  input.focus();
  // Wait until the gate is unlocked — the birthday universe stays hidden behind it
  await new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.body.contains(gate)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true });
  });
}
