// SW:FAIR — SINWOL × SOFTWARE  (React + htm, Firebase Firestore)
const root = document.getElementById('root');

// 설정 파일을 불러오다 실패하면 '로딩 중'에서 멈추지 않고 원인을 화면에 보여 줍니다.
let CFG;
try {
  CFG = await import('./firebase-config.js');
} catch (e) {
  console.error(e);
  root.innerHTML = '<div class="boot" style="text-align:center;line-height:1.8;padding:20px">firebase-config.js 파일에 오류가 있어요.<br>Firebase 콘솔의 예시 코드 중 <b>firebaseConfig 값만</b> 넣었는지 확인해 주세요.</div>';
  throw e;
}
const { firebaseConfig, ADMIN_EMAILS, SITE } = CFG;
if (!window.React || !window.ReactDOM || !window.htm) {
  root.innerHTML = '<div class="boot">화면을 불러오지 못했어요. 새로고침해 주세요.</div>';
  throw new Error('React/htm not loaded');
}
const { useState, useEffect, useMemo, useRef, useCallback } = React;
const html = htm.bind(React.createElement);

/* ================= backend bridge ================= */
// firebase-config.js에 projectId가 있으면 Firebase, 없으면 미리보기(Mock) 모드
const USE_FIREBASE = !!(firebaseConfig && firebaseConfig.projectId);
let Backend = null;
if (USE_FIREBASE) {
  try {
    const mod = await import('./backend.js');
    Backend = mod.createBackend(firebaseConfig, SITE, ADMIN_EMAILS);
  } catch (e) {
    console.error(e);
    root.innerHTML = '<div class="boot">Firebase에 연결하지 못했어요. 설정(firebase-config.js)과 인터넷 연결을 확인해 주세요.</div>';
    throw e;
  }
}
function call(fn, ...args) {
  if (Backend) return Backend[fn](...args);
  return new Promise((resolve, reject) => {
    setTimeout(() => { try { resolve(Mock[fn](...args)); } catch (e) { reject(e); } }, 250);
  });
}

/* ================= categories ================= */
const CATS = {
  GAME:      { ko: '게임',       c: '#8055FF', icon: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h10a5 5 0 0 1 4.9 6l-.5 2.3a2.6 2.6 0 0 1-4.4 1.2L15 15.4H9l-2 2.1a2.6 2.6 0 0 1-4.4-1.2L2.1 14A5 5 0 0 1 7 8z"/><path d="M7.5 10.5v3M6 12h3"/><path d="M15.5 11h.01M17.5 13h.01" stroke-width="2.6"/></svg>` },
  ANIMATION: { ko: '애니메이션', c: '#4C8DFF', icon: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M10 9.3v5.4l4.6-2.7z" fill="currentColor"/><path d="M3 9h2.5M3 15h2.5M18.5 9H21M18.5 15H21"/></svg>` },
  ART:       { ko: '아트',       c: '#FF6BD6', icon: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.9 2-1.9 0-1.4-1.1-1.6-1.1-2.9 0-1 .9-1.9 2-1.9h1.9A4.2 4.2 0 0 0 21 10.1C21 6.2 17 3 12 3z"/><path d="M7.5 11.5h.01M9.5 7.5h.01M14.5 7h.01" stroke-width="2.8"/></svg>` },
  EDUCATION: { ko: '교육',       c: '#1FCFB0', icon: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.2 12 4.5l10 4.7-10 4.7z"/><path d="M6 11.2v4.6c3.3 2.6 8.7 2.6 12 0v-4.6"/><path d="M22 9.2v5.3"/></svg>` },
  ETC:       { ko: '기타',       c: '#FFB547', icon: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.8l1.9 5.4 5.4 1.9-5.4 1.9L11 17.4l-1.9-5.4-5.4-1.9 5.4-1.9z"/><path d="M18.5 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z"/></svg>` },
};
const CAT_KEYS = Object.keys(CATS);
const catOf = k => CATS[k] || CATS.ETC;

/* ================= preview mock (firebase-config.js가 비어 있을 때) ================= */
const Mock = (() => {
  function thumb(a, b, c, label, shape) {
    const shapes = {
      game: `<rect x="250" y="190" width="140" height="22" rx="6" fill="${c}"/><circle cx="320" cy="150" r="28" fill="#fff"/><rect x="520" y="110" width="40" height="40" rx="8" fill="${c}" opacity=".9"/><rect x="90" y="90" width="30" height="30" rx="6" fill="#fff" opacity=".7"/>`,
      anim: `<circle cx="210" cy="180" r="70" fill="${c}" opacity=".9"/><circle cx="330" cy="180" r="70" fill="#fff" opacity=".5"/><circle cx="450" cy="180" r="70" fill="${c}" opacity=".35"/>`,
      art: `<path d="M60 260 C 180 80, 300 300, 420 120 S 600 200, 620 90" stroke="${c}" stroke-width="26" fill="none" stroke-linecap="round"/><circle cx="500" cy="250" r="40" fill="#fff" opacity=".8"/>`,
      edu: `<rect x="150" y="90" width="340" height="190" rx="18" fill="#fff" opacity=".92"/><rect x="185" y="125" width="180" height="16" rx="8" fill="${c}"/><rect x="185" y="160" width="260" height="12" rx="6" fill="${a}" opacity=".5"/><rect x="185" y="185" width="220" height="12" rx="6" fill="${a}" opacity=".5"/><rect x="185" y="225" width="90" height="30" rx="10" fill="${c}"/>`,
      etc: `<polygon points="320,60 360,160 470,170 385,235 410,330 320,275 230,330 255,235 170,170 280,160" fill="${c}"/>`,
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#fff" stroke-opacity=".08"/></pattern></defs><rect width="640" height="360" fill="url(#g)"/><rect width="640" height="360" fill="url(#p)"/>${shapes[shape]}<text x="32" y="330" font-family="monospace" font-size="22" font-weight="700" fill="#fff" fill-opacity=".85" letter-spacing="4">${label}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const seed = [
    ['우주 쓰레기 청소부', 'GAME', '#1B1460', '#5B2DD6', '#FF6BD6', 'SPACE CLEANER', 'game', 2, 3, '김하늘', '우주에 떠다니는 쓰레기 문제를 알리고 싶어서 만든 게임이에요.', '방향키로 우주선을 움직이고 스페이스바로 쓰레기를 수거해요. 60초 안에 많이 모으면 승리!'],
    ['신월 러너', 'GAME', '#0F2A6B', '#4C8DFF', '#FFD84D', 'SINWOL RUN', 'game', 1, 5, '박서준', '학교 복도를 달리며 장애물을 피하는 러닝 게임입니다.', '스페이스바로 점프! 시간이 지날수록 빨라져요.'],
    ['고양이의 하루', 'ANIMATION', '#2A1B6E', '#4C8DFF', '#FFC1EC', 'A CAT DAY', 'anim', 3, 1, '이도윤', '우리 집 고양이의 하루를 애니메이션으로 표현했어요.', '시작 버튼을 누르고 감상해 주세요. 장면이 자동으로 넘어가요.'],
    ['네온 드로잉 머신', 'ART', '#3B0F5C', '#FF6BD6', '#7CF8FF', 'NEON DRAW', 'art', 2, 7, '최지우', '마우스로 그리면 네온 효과가 나는 그림판을 만들고 싶었어요.', '마우스를 누른 채로 움직이면 그림이 그려지고, 숫자키로 색을 바꿔요.'],
    ['분리수거 마스터', 'EDUCATION', '#0A3D47', '#1FCFB0', '#FFB547', 'RECYCLE', 'edu', 1, 2, '정예린', '헷갈리는 분리수거 방법을 퀴즈로 배울 수 있게 했어요.', '화면에 나오는 물건을 알맞은 분리수거함으로 끌어다 놓으세요.'],
    ['구구단 배틀', 'EDUCATION', '#12305E', '#22B8E0', '#FFFFFF', 'MATH BATTLE', 'edu', 3, 4, '한유진', '동생이 구구단을 재미있게 외우도록 만들었어요.', '문제의 답을 입력하면 몬스터에게 공격! 틀리면 체력이 줄어요.'],
    ['오늘의 급식 룰렛', 'ETC', '#4A2A0A', '#FFB547', '#FF6BD6', 'LUNCH ROULETTE', 'etc', 2, 9, '오민재', '오늘 뭐 먹지? 고민을 줄여 주는 룰렛 프로그램입니다.', '시작 버튼을 누르면 룰렛이 돌아가고, 멈춘 칸의 메뉴를 추천해 줘요.'],
    ['픽셀 정원', 'ART', '#123B2A', '#56D68B', '#FF6BD6', 'PIXEL GARDEN', 'art', 1, 8, '서하린', '클릭할 때마다 꽃이 자라는 픽셀 아트 정원이에요.', '빈 칸을 클릭하면 씨앗이 심어지고, 시간이 지나면 꽃이 피어요.'],
  ];
  const KEY = 'swfair_demo_v2';
  let st = null;
  try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!st) st = {
    works: seed.map((s, i) => ({ id: 'D' + i, time: 1700000000000 + i * 1000, title: s[0], category: s[1], thumb: thumb(s[2], s[3], s[4], s[5], s[6]), grade: s[7], ban: s[8], num: i + 1, name: s[9], purpose: s[10], usage: s[11], link: 'https://playentry.org/', approved: true, demo: true })),
    votes: [],
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const key = s => s.grade + '-' + s.ban + '-' + s.num;
  const mineOf = s => st.works.find(w => !w.demo && w.grade == s.grade && w.ban == s.ban && w.num == s.num);
  return {
    getInit() {
      return { config: Object.assign({ categories: CAT_KEYS, uploadOpen: true, votingOpen: true, autoApprove: true, demo: true }, SITE),
        works: st.works.filter(w => w.approved), voteCount: st.votes.length };
    },
    getMyStatus(s) {
      const mine = mineOf(s), v = st.votes.find(v => v.key === key(s));
      return { myWork: mine ? { title: mine.title, approved: true } : null, voted: !!v,
        votedTitles: v ? v.picks.map(id => (st.works.find(w => w.id === id) || {}).title || '(삭제된 작품)') : [] };
    },
    submitWork(s, w) {
      if (!/^https:\/\/(www\.)?playentry\.org\/\S+$/.test(w.link)) throw new Error('엔트리 작품 링크(https://playentry.org/...)를 넣어 주세요.');
      const ex = mineOf(s);
      const row = Object.assign({ id: ex ? ex.id : 'U' + Date.now(), time: Date.now(), grade: +s.grade, ban: +s.ban, num: +s.num, name: s.name, approved: true }, w);
      if (ex) Object.assign(ex, row); else st.works.push(row);
      save(); return { ok: true, replaced: !!ex, approved: true };
    },
    submitVote(s, ids) {
      if (st.votes.some(v => v.key === key(s))) throw new Error(`${s.grade}학년 ${s.ban}반 ${s.num}번은 이미 투표했어요. 투표는 한 번만 할 수 있어요.`);
      st.votes.push({ key: key(s), picks: ids }); save(); return { ok: true };
    },
  };
})();

/* ================= helpers ================= */
const safeLink = u => /^https:\/\/(www\.)?playentry\.org\//.test(String(u || '')) ? u : null;
const safeImg = u => /^data:image\//.test(String(u || '')) ? u : null;
const gradeClass = w => `${w.grade}학년 ${w.ban}반`;
const TICK = 'SW:FAIR ✦ SINWOL × SOFTWARE ✦ 2026 ENTRY PROJECT EXHIBITION ✦ 신월중학교 SW 작품 전시회 ✦ PLAY · VOTE · SHARE ✦ ';
const DEFAULT_CONFIG = Object.assign({ categories: CAT_KEYS, uploadOpen: true, votingOpen: true, autoApprove: false }, SITE);

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\//.test(file.type)) return reject(new Error('이미지 파일만 올릴 수 있어요.'));
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('이미지를 읽지 못했어요.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지를 열지 못했어요.'));
      img.onload = () => {
        const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
        let sw = img.width, sh = img.height;           // 16:9로 가운데 자르기 (엔트리 실행 화면 비율)
        if (sw / sh > 16 / 9) sw = sh * 16 / 9; else sh = sw * 9 / 16;
        const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
        let W = 640, q = 0.82, out = '';
        for (let i = 0; i < 14; i++) {
          cv.width = W; cv.height = Math.round(W * 9 / 16);
          ctx.fillStyle = '#11112D'; ctx.fillRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
          out = cv.toDataURL('image/jpeg', q);
          if (out.length < 45000) return resolve(out);
          if (q > 0.5) q -= 0.08; else W = Math.round(W * 0.85);
        }
        resolve(out);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ================= small components ================= */
function Ticker() {
  return html`<div class="ticker" aria-hidden="true"><div>${TICK.repeat(8)}</div></div>`;
}
function Stage({ children, className = '', floor = true }) {
  return html`<section class=${'stage ' + className}>
    <div class="stars"></div>
    ${floor && html`<div class="floor"></div><div class="horizon"></div>`}
    ${children}
  </section>`;
}
function Thumb({ w }) {
  const src = safeImg(w.thumb);
  return src ? html`<img src=${src} alt=${w.title + ' 대표 이미지'} loading="lazy" />` : html`<div class="ph" style=${{ width: '100%', height: '100%' }}>NO IMAGE</div>`;
}
function Chip({ cat }) {
  const c = catOf(cat);
  return html`<span class="chip" style=${{ '--c': c.c }}>${c.icon}${cat}</span>`;
}

function WorkCard({ w, onOpen }) {
  const c = catOf(w.category), link = safeLink(w.link);
  const key = e => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(w); };
  return html`<article class="card" style=${{ '--c': c.c }} tabIndex="0" onClick=${() => onOpen(w)} onKeyDown=${key} aria-label=${w.title + ' 자세히 보기'}>
    <div class="thumb">
      <${Thumb} w=${w} />
      <${Chip} cat=${w.category} />
      ${link && html`<a class="run" href=${link} target="_blank" rel="noopener" onClick=${e => e.stopPropagation()}>▶ 작품 실행하기</a>`}
    </div>
    <div class="card-b">
      <h3>${w.title}</h3>
      <div class="meta"><span class="who">${w.name}</span><span class="sep"></span><span class="gc">${gradeClass(w)}</span></div>
    </div>
  </article>`;
}

function WorkModal({ w, onClose }) {
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  if (!w) return null;
  const c = catOf(w.category), link = safeLink(w.link);
  return html`<div class="modal" onClick=${e => { if (e.target === e.currentTarget) onClose(); }}>
    <div class="sheet" role="dialog" aria-modal="true" aria-label=${w.title}>
      <div class="thumb"><${Thumb} w=${w} /><${Chip} cat=${w.category} /></div>
      <div class="sb">
        <h3>${w.title}</h3>
        <div class="meta"><span class="who">${w.name}</span><span class="sep"></span><span class="gc">${gradeClass(w)}</span><span class="sep"></span><span style=${{ color: c.c, fontWeight: 700 }}>${c.ko}</span></div>
        <h4>PURPOSE · 작품의 목적</h4><p class="tx">${w.purpose}</p>
        <h4>HOW TO PLAY · 사용법</h4><p class="tx">${w.usage}</p>
        <div class="acts">
          ${link && html`<a class="neon" href=${link} target="_blank" rel="noopener">▶ 작품 실행하기</a>`}
          <button class="ghost light" type="button" onClick=${onClose}>닫기</button>
        </div>
      </div>
    </div>
  </div>`;
}

function CatMenu({ works, active, onPick }) {
  return html`<div class="cats">
    ${CAT_KEYS.map((k, i) => {
      const c = CATS[k], n = works.filter(w => w.category === k).length;
      return html`<button key=${k} type="button" class=${'cat' + (active === k ? ' on' : '')} style=${{ '--c': c.c }} onClick=${() => onPick(k)}>
        <span class="idx">0${i + 1} / 05</span>
        <span class="ic">${c.icon}</span>
        <span class="nm">${k === 'ETC' ? 'ETC.' : k}</span>
        <span class="ko">${c.ko}</span>
        <span class="cnt">${n} WORKS</span>
      </button>`;
    })}
  </div>`;
}

function Grid({ list, onOpen, empty }) {
  if (!list.length) return html`<div class="grid"><div class="empty"><b>${empty[0]}</b>${empty[1]}</div></div>`;
  return html`<div class="grid">${list.map(w => html`<${WorkCard} key=${w.id} w=${w} onOpen=${onOpen} />`)}</div>`;
}

function PageHead({ tag, title, desc }) {
  return html`<${Stage} className="pagehead">
    <div class="wrap inner">
      <div class="hud">${tag}</div>
      <h1>${title}</h1>
      ${desc && html`<p>${desc}</p>`}
    </div>
  <//>`;
}

/* ================= GATE (입장 화면) ================= */
function Gate({ config, onEnter, toast }) {
  const [f, setF] = useState({ grade: '', ban: '', num: '', name: '' });
  const set = k => e => setF(Object.assign({}, f, { [k]: e.target.value }));
  const submit = e => {
    e.preventDefault();
    if (!f.grade || !f.ban || !f.num) return toast('학년, 반, 번호를 모두 선택해 주세요.', true);
    const name = f.name.trim();
    if (name.length < 2) return toast('이름을 2글자 이상 입력해 주세요.', true);
    onEnter({ grade: +f.grade, ban: +f.ban, num: +f.num, name });
  };
  const opts = (arr, suf) => [html`<option key="x" value="">선택</option>`].concat(arr.map(v => html`<option key=${v} value=${v}>${v}${suf}</option>`));
  const range = n => Array.from({ length: n }, (_, i) => i + 1);
  return html`<${Stage} className="gate">
    <div class="gate-top"><span class="hud"><span class="dot"></span>2026 Sinwol SW Exhibition</span><span class="hud">Player Login</span></div>
    <div class="gate-mid">
      <div class="hud">Welcome to the digital playground</div>
      <h1 class="brand-title" style=${{ marginTop: 16 }}>SW<span class="col">:</span>FAIR</h1>
      <div class="brand-sub">SINWOL × SOFTWARE</div>
      <p class="gate-copy">신월중학교 학생들이 한 달 동안 엔트리로 만든 작품의 세계.<br/>플레이어 정보를 입력하고 입장하세요.</p>
      <form class="entry" onSubmit=${submit} autoComplete="off">
        <div class="entry-head"><b>PLAYER ENTRY</b><span class="hud" style=${{ fontSize: 10.5 }}>Step 01 / 01</span></div>
        <div class="g3">
          <label class="fld"><span><span class="en">GRADE · </span>학년</span><select class="dark-in" value=${f.grade} onChange=${set('grade')}>${opts(config.grades, '학년')}</select></label>
          <label class="fld"><span><span class="en">CLASS · </span>반</span><select class="dark-in" value=${f.ban} onChange=${set('ban')}>${opts(range(config.classCount), '반')}</select></label>
          <label class="fld"><span><span class="en">NO. · </span>번호</span><select class="dark-in" value=${f.num} onChange=${set('num')}>${opts(range(config.maxNumber), '번')}</select></label>
        </div>
        <label class="fld"><span><span class="en">NAME · </span>이름</span><input class="dark-in" type="text" maxLength="10" placeholder="이름을 입력하세요" value=${f.name} onChange=${set('name')} /></label>
        <button class="neon" type="submit">ENTER THE FAIR <span class="arr">→</span></button>
        <small>입력한 정보는 작품 올리기와 투표에만 사용돼요.</small>
      </form>
    </div>
  <//>`;
}

/* ================= HOME ================= */
function Home({ data, go, onOpen }) {
  const latest = useMemo(() => data.works.slice().sort((a, b) => (b.time || 0) - (a.time || 0)), [data.works]);
  const deck = latest.slice(0, 3);
  return html`<div>
    <${Stage} className="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="hud"><span class="dot"></span>Now Open · 2026 Sinwol SW Exhibition</div>
          <h1 class="brand-title">SW<span class="col">:</span>FAIR</h1>
          <span class="brand-sub">SINWOL × SOFTWARE</span>
          <div class="slogan">상상을 코드로,<br/><em>코드를 플레이로.</em></div>
          <p class="lead">한 달 동안 엔트리로 직접 설계하고 코딩한 신월중학교 학생들의 게임, 애니메이션, 아트 작품이 공개됩니다. 플레이해 보고, 최고의 작품에 투표하세요.</p>
          <div class="cta">
            <button class="neon" type="button" onClick=${() => go('explore')}>작품 둘러보기 <span class="arr">→</span></button>
            <button class="ghost" type="button" onClick=${() => go('vote')}>투표하러 가기</button>
          </div>
          <div class="stats">
            <div class="stat"><b>${data.works.length}</b><span>WORKS</span></div>
            <div class="stat"><b>${data.voteCount}</b><span>VOTES</span></div>
            <div class="stat"><b>5</b><span>CATEGORIES</span></div>
          </div>
        </div>
        <div class="deck" aria-label="최근 전시 작품">
          <span class="badge-live">NEW ARRIVALS</span>
          ${[0, 1, 2].map(i => {
            const w = deck[i];
            if (!w) return html`<div key=${i} class=${'dc d' + i}><div class="ph">COMING SOON</div><div class="cap"><span class="hud">SW:FAIR</span><b>작품 준비 중</b></div></div>`;
            return html`<button key=${w.id} type="button" class=${'dc d' + i} onClick=${() => onOpen(w)}>
              ${safeImg(w.thumb) ? html`<img src=${safeImg(w.thumb)} alt="" />` : html`<div class="ph">NO IMAGE</div>`}
              <div class="cap"><span class="hud" style=${{ color: catOf(w.category).c }}>${w.category}</span><b>${w.title}</b></div>
            </button>`;
          })}
        </div>
      </div>
    <//>
    <${Ticker} />
    <section class="section">
      <div class="wrap">
        <div class="sec-head"><div><div class="hud">Select Category</div><h2>CATEGORY<small>어떤 작품을 플레이할까요?</small></h2></div></div>
        <${CatMenu} works=${data.works} active=${null} onPick=${k => go('category', k)} />
      </div>
    </section>
    <section class="section" style=${{ paddingTop: 0 }}>
      <div class="wrap">
        <div class="sec-head">
          <div><div class="hud">Latest Drops</div><h2>NEW ARRIVALS<small>새로 전시된 작품</small></h2></div>
          <button class="ghost light" type="button" onClick=${() => go('explore')}>전체 작품 보기 →</button>
        </div>
        <${Grid} list=${latest.slice(0, 8)} onOpen=${onOpen} empty=${['아직 전시된 작품이 없어요', '선생님이 작품을 선정하면 이곳에 전시됩니다.']} />
      </div>
    </section>
  </div>`;
}

/* ================= EXPLORE ================= */
function Explore({ data, onOpen, initialCat }) {
  const [cat, setCat] = useState(initialCat || 'ALL');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let l = data.works.filter(w => (cat === 'ALL' || w.category === cat) && (!s || (w.title + ' ' + w.name).toLowerCase().includes(s)));
    l = l.slice().sort(sort === 'new' ? (a, b) => (b.time || 0) - (a.time || 0) : (a, b) => a.title.localeCompare(b.title, 'ko'));
    return l;
  }, [data.works, cat, q, sort]);
  const tab = (k, label, icon, color, n) => html`<button key=${k} type="button" class=${'tab' + (cat === k ? ' on' : '')} style=${{ '--c': color }} onClick=${() => setCat(k)}>${icon}${label}<span class="n">${n}</span></button>`;
  return html`<div>
    <${PageHead} tag="Explore · Interactive Gallery" title="EXPLORE" desc="썸네일 위에 마우스를 올리고 ‘작품 실행하기’를 눌러 바로 플레이해 보세요." />
    <section class="section" style=${{ paddingTop: 36 }}>
      <div class="wrap">
        <div class="toolbar">
          <div class="tabs">
            ${tab('ALL', 'ALL', null, '#8055FF', data.works.length)}
            ${CAT_KEYS.map(k => tab(k, k === 'ETC' ? 'ETC.' : k, CATS[k].icon, CATS[k].c, data.works.filter(w => w.category === k).length))}
          </div>
          <select class="light-in" value=${sort} onChange=${e => setSort(e.target.value)} aria-label="정렬"><option value="new">최신순</option><option value="title">제목순</option></select>
          <input class="light-in search" type="search" placeholder="제목·이름 검색" value=${q} onChange=${e => setQ(e.target.value)} />
        </div>
        <${Grid} list=${list} onOpen=${onOpen} empty=${q || cat !== 'ALL' ? ['조건에 맞는 작품이 없어요', '다른 카테고리나 검색어를 시도해 보세요.'] : ['아직 전시된 작품이 없어요', '선생님이 작품을 선정하면 이곳에 전시됩니다.']} />
      </div>
    </section>
  </div>`;
}

/* ================= CATEGORY ================= */
function Category({ data, onOpen, initialCat }) {
  const [cat, setCat] = useState(initialCat || 'GAME');
  const c = CATS[cat];
  const list = data.works.filter(w => w.category === cat).sort((a, b) => (b.time || 0) - (a.time || 0));
  return html`<div>
    <${PageHead} tag="Select your mode" title="CATEGORY" desc="카테고리를 선택하면 해당 작품만 모아 볼 수 있어요." />
    <section class="section" style=${{ paddingTop: 36 }}>
      <div class="wrap">
        <${CatMenu} works=${data.works} active=${cat} onPick=${setCat} />
        <div class="sec-head" style=${{ marginTop: 44 }}>
          <div><div class="hud" style=${{ color: c.c }}>${list.length} works found</div><h2>${cat === 'ETC' ? 'ETC.' : cat}<small>${c.ko}</small></h2></div>
        </div>
        <${Grid} list=${list} onOpen=${onOpen} empty=${['이 카테고리에는 아직 작품이 없어요', '다른 카테고리를 선택해 보세요.']} />
      </div>
    </section>
  </div>`;
}

/* ================= UPLOAD ================= */
function Upload({ data, student, status, loadStatus, refresh, toast, go }) {
  const [d, setD] = useState({ thumb: '', category: '', title: '', link: '', purpose: '', usage: '' });
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [done, setDone] = useState(null);
  useEffect(() => { loadStatus(); }, []);
  const set = k => e => setD(Object.assign({}, d, { [k]: e.target.value }));
  const take = async file => {
    if (!file) return;
    try { const t = await compressImage(file); setD(x => Object.assign({}, x, { thumb: t })); } catch (e) { toast(e.message, true); }
  };
  const submit = async e => {
    e.preventDefault();
    if (!d.thumb) return toast('대표 이미지를 올려 주세요.', true);
    if (!d.category) return toast('카테고리를 골라 주세요.', true);
    if (!d.title.trim()) return toast('작품 제목을 입력해 주세요.', true);
    if (!safeLink(d.link.trim())) return toast('엔트리 작품 링크는 https://playentry.org/ 로 시작해야 해요.', true);
    if (!d.purpose.trim() || !d.usage.trim()) return toast('목적과 사용법을 모두 적어 주세요.', true);
    setBusy(true);
    try {
      const r = await call('submitWork', student, { thumb: d.thumb, category: d.category, title: d.title.trim(), link: d.link.trim(), purpose: d.purpose.trim(), usage: d.usage.trim() });
      setDone({ title: d.title.trim(), approved: r.approved });
      await refresh(true);
    } catch (err) { toast(err.message, true); }
    setBusy(false);
  };
  const cfg = data.config;
  const preview = { id: 'pv', title: d.title || '작품 제목', name: student.name, grade: student.grade, ban: student.ban, category: d.category || 'GAME', thumb: d.thumb, link: '' };

  let body;
  if (!cfg.uploadOpen) body = html`<div class="panel done"><div class="big">UPLOAD CLOSED</div><p>작품 올리기가 마감되었어요. 전시된 작품을 둘러보고 투표에 참여해 주세요!</p><br/><button class="neon" onClick=${() => go('explore')}>작품 둘러보기 →</button></div>`;
  else if (done) body = html`<div class="panel done"><div class="big">UPLOAD COMPLETE!</div><p><b>「${done.title}」</b> 제출 완료!</p><p>${done.approved ? '지금 바로 갤러리에서 볼 수 있어요.' : '선생님이 확인하면 갤러리에 전시돼요.'}</p><br/><button class="neon" onClick=${() => go('explore')}>작품 둘러보기 <span class="arr">→</span></button></div>`;
  else body = html`<div class="up">
    <div>
      <div class="panel" style=${{ padding: 20 }}>
        <div class="lbl">대표 이미지 <em>작품 실행 화면 캡처 추천 (16:9)</em></div>
        <label class=${'drop' + (over ? ' over' : '')} onDragOver=${e => { e.preventDefault(); setOver(true); }} onDragLeave=${() => setOver(false)} onDrop=${e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}>
          <input type="file" accept="image/*" onChange=${e => take(e.target.files[0])} />
          ${d.thumb ? html`<img src=${d.thumb} alt="대표 이미지 미리보기" /><span class="chg">이미지 바꾸기</span>` : html`<div><span class="plus">+</span>클릭하거나 이미지를 끌어다 놓으세요</div>`}
        </label>
      </div>
      <div class="pv-label">GALLERY PREVIEW · 갤러리에서 이렇게 보여요</div>
      <div class="card preview" style=${{ '--c': catOf(preview.category).c }}>
        <div class="thumb">${d.thumb ? html`<img src=${d.thumb} alt="" />` : html`<div class="ph" style=${{ width: '100%', height: '100%' }}>YOUR THUMBNAIL</div>`}${d.category && html`<${Chip} cat=${d.category} />`}</div>
        <div class="card-b"><h3>${preview.title}</h3><div class="meta"><span class="who">${student.name}</span><span class="sep"></span><span class="gc">${gradeClass(student)}</span></div></div>
      </div>
    </div>
    <form class="panel" onSubmit=${submit} autoComplete="off">
      ${status && status.myWork && html`<div class="notice warn">이미 <b>「${status.myWork.title}」</b>을(를) 올렸어요${status.myWork.approved ? ' (전시 중)' : ' (선생님 확인 대기 중)'}. 다시 제출하면 새 내용으로 바뀌어요.</div>`}
      ${!cfg.autoApprove && !cfg.demo && html`<div class="notice">제출한 작품은 선생님이 확인한 뒤 갤러리에 전시돼요.</div>`}
      <div class="frow"><div class="lbl">카테고리</div>
        <div class="catpick">${CAT_KEYS.map(k => html`<button key=${k} type="button" class=${'cp' + (d.category === k ? ' on' : '')} style=${{ '--c': CATS[k].c }} onClick=${() => setD(Object.assign({}, d, { category: k }))}>${CATS[k].icon}${k === 'ETC' ? 'ETC.' : k}</button>`)}</div>
      </div>
      <div class="frow"><div class="lbl"><span>작품 제목</span><span class="c">${d.title.length}/40</span></div><input class="light-in" maxLength="40" placeholder="예) 우주 쓰레기 청소부" value=${d.title} onChange=${set('title')} /></div>
      <div class="frow"><div class="lbl"><span>엔트리 작품 링크<em>엔트리에서 작품 공유 → 주소 복사</em></span></div><input class="light-in" type="url" maxLength="300" placeholder="https://playentry.org/project/..." value=${d.link} onChange=${set('link')} /></div>
      <div class="frow"><div class="lbl"><span>작품의 목적<em>왜 이 작품을 만들었나요?</em></span><span class="c">${d.purpose.length}/300</span></div><textarea class="light-in" maxLength="300" rows="3" placeholder="어떤 문제를 해결하거나 무엇을 표현하고 싶었는지 적어 주세요." value=${d.purpose} onChange=${set('purpose')}></textarea></div>
      <div class="frow"><div class="lbl"><span>사용법<em>어떻게 실행하고 조작하나요?</em></span><span class="c">${d.usage.length}/500</span></div><textarea class="light-in" maxLength="500" rows="4" placeholder="예) 시작 버튼을 누르고, 방향키로 캐릭터를 움직여요." value=${d.usage} onChange=${set('usage')}></textarea></div>
      <button class="neon" type="submit" style=${{ width: '100%' }} disabled=${busy}>${busy ? '제출하는 중…' : (status && status.myWork ? '작품 다시 제출하기' : '작품 제출하기')} ${!busy && html`<span class="arr">→</span>`}</button>
    </form>
  </div>`;

  return html`<div>
    <${PageHead} tag="Upload · Create your stage" title="UPLOAD" desc="갤러리에 보일 작품 정보를 정성껏 작성해 주세요." />
    <section class="section" style=${{ paddingTop: 36 }}><div class="wrap">${body}</div></section>
  </div>`;
}

/* ================= VOTE ================= */
function Vote({ data, student, status, loadStatus, refresh, toast, onOpen, go }) {
  const [picks, setPicks] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { loadStatus(); }, []);
  const works = data.works;
  const toggle = id => {
    if (picks.includes(id)) setPicks(picks.filter(x => x !== id));
    else if (picks.length < 2) setPicks(picks.concat(id));
    else toast('2개까지만 고를 수 있어요. 하나를 먼저 취소해 주세요.', true);
  };
  const doVote = async () => {
    setBusy(true);
    try {
      await call('submitVote', student, picks.slice());
      setConfirm(false); setPicks([]);
      toast('투표 완료! 참여해 줘서 고마워요 🎉');
      await refresh(true);
    } catch (e) { setConfirm(false); toast(e.message, true); await refresh(true); }
    setBusy(false);
  };
  const byId = id => works.find(w => w.id === id);

  let body;
  if (!status) body = html`<div class="panel done"><p>확인하는 중…</p></div>`;
  else if (status.voted) body = html`<div class="panel done"><div class="big">VOTE COMPLETE!</div>
      <p><b>${student.name}</b>님은 이미 투표했어요. 참여해 줘서 고마워요!</p>
      <ol>${status.votedTitles.map((t, i) => html`<li key=${i}>${t}</li>`)}</ol><br/>
      <button class="ghost light" onClick=${() => go('explore')}>작품 둘러보기</button></div>`;
  else if (!data.config.votingOpen) body = html`<div class="panel done"><div class="big">VOTING CLOSED</div><p>투표가 마감되었어요. 참여해 준 모두 고마워요!</p></div>`;
  else if (works.length < 2) body = html`<div class="panel done"><div class="big">COMING SOON</div><p>작품이 2개 이상 전시되면 투표할 수 있어요.</p></div>`;
  else body = html`<div>
    <div class="grid">
      ${works.map(w => {
        const i = picks.indexOf(w.id), c = catOf(w.category);
        const cls = 'card pick' + (i >= 0 ? ' sel' : '') + (i < 0 && picks.length >= 2 ? ' dim' : '');
        return html`<article key=${w.id} class=${cls} style=${{ '--c': c.c }} tabIndex="0" role="button" aria-pressed=${i >= 0}
            onClick=${() => toggle(w.id)} onKeyDown=${e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); toggle(w.id); } }}>
          <div class="thumb"><${Thumb} w=${w} /><${Chip} cat=${w.category} /><span class="vbadge">${i >= 0 ? i + 1 : ''}</span></div>
          <div class="card-b"><h3>${w.title}</h3><div class="meta"><span class="who">${w.name}</span><span class="sep"></span><span class="gc">${gradeClass(w)}</span></div></div>
          <button class="info" type="button" onClick=${e => { e.stopPropagation(); onOpen(w); }}>자세히</button>
        </article>`;
      })}
    </div>
    <div class="vbar">
      <div class="slots">${[0, 1].map(i => { const w = byId(picks[i]); return html`<div key=${i} class=${'slot' + (w ? ' full' : '')}><b>${i + 1}</b><span>${w ? w.title : '빈 슬롯'}</span></div>`; })}</div>
      <div class="txt"><b>SELECTED ${picks.length} / 2</b>카드를 눌러 고르고, 다시 누르면 취소돼요</div>
      <button class="neon" type="button" disabled=${picks.length !== 2} onClick=${() => setConfirm(true)} style=${{ padding: '13px 22px' }}>투표하기</button>
    </div>
    ${confirm && html`<div class="modal" onClick=${e => { if (e.target === e.currentTarget && !busy) setConfirm(false); }}>
      <div class="sheet" role="dialog" aria-modal="true"><div class="sb">
        <div class="hud" style=${{ color: 'var(--purple)' }}>Final check</div>
        <h3 style=${{ marginTop: 8 }}>이 두 작품에 투표할까요?</h3>
        <p class="tx" style=${{ marginTop: 6, color: 'var(--muted)' }}>투표는 한 번만 할 수 있고, 나중에 바꿀 수 없어요.</p>
        <ol style=${{ fontWeight: 900, fontSize: 17, lineHeight: 1.9, margin: '16px 0 0' }}>${picks.map(id => html`<li key=${id}>${(byId(id) || {}).title}</li>`)}</ol>
        <div class="acts"><button class="neon" type="button" disabled=${busy} onClick=${doVote}>${busy ? '투표하는 중…' : '이대로 투표하기'}</button><button class="ghost light" type="button" disabled=${busy} onClick=${() => setConfirm(false)}>다시 고를래요</button></div>
      </div></div>
    </div>`}
  </div>`;

  return html`<div>
    <${PageHead} tag="Vote · Pick your favorites" title="VOTE" desc="가장 마음에 드는 작품 2개를 골라 주세요. 투표는 한 사람당 한 번만 할 수 있어요." />
    <section class="section" style=${{ paddingTop: 36 }}><div class="wrap">${body}</div></section>
  </div>`;
}

/* ================= ABOUT ================= */
function About({ go }) {
  return html`<div>
    <${PageHead} tag="About the exhibition" title="ABOUT" desc="SW:FAIR는 신월중학교 학생들의 소프트웨어 작품 전시회입니다." />
    <section class="section" style=${{ paddingTop: 36 }}>
      <div class="wrap about-grid">
        <div class="panel">
          <h3>WHAT IS SW:FAIR?</h3>
          <div class="eq"><span><b>S</b>in<b>W</b>ol</span><i>+</i><span><b>S</b>oft<b>W</b>are</span><i>=</i><span style=${{ background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' }}>SW:FAIR</span></div>
          <p style=${{ marginTop: 18 }}>SW:FAIR는 신월(Sinwol)의 SW와 소프트웨어(Software)의 SW를 결합한 이름이에요.</p>
          <p>학생들은 한 달 동안 정보 수업에서 엔트리로 아이디어를 기획하고, 직접 코딩하고, 테스트하며 작품을 완성했어요. 이곳에서 친구들의 작품을 플레이하고 생각을 나눠 보세요.</p>
          <div class="cta" style=${{ marginTop: 22 }}><button class="neon" onClick=${() => go('explore')}>작품 둘러보기 <span class="arr">→</span></button></div>
        </div>
        <div class="panel">
          <h3>HOW TO JOIN</h3>
          <ul class="steps">
            <li><span class="n">1</span><div><b>EXPLORE · 둘러보기</b><span>카드에 마우스를 올려 ‘작품 실행하기’를 누르면 엔트리에서 작품이 열려요. 카드를 누르면 목적과 사용법을 볼 수 있어요.</span></div></li>
            <li><span class="n">2</span><div><b>UPLOAD · 작품 올리기</b><span>대표 이미지, 엔트리 링크, 제목·목적·사용법을 적어 제출해요.</span></div></li>
            <li><span class="n">3</span><div><b>VOTE · 투표하기</b><span>최고의 작품 2개를 골라 투표해요. 한 사람당 한 번만 투표할 수 있어요.</span></div></li>
          </ul>
        </div>
      </div>
    </section>
  </div>`;
}

/* ================= APP ================= */
/* ================= ADMIN (선생님 관리) ================= */
function Admin({ toast }) {
  const A = Backend && Backend.admin;
  const [user, setUser] = useState(undefined);
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('works');
  const [busy, setBusy] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [settings, setSettings] = useState(null);
  useEffect(() => (A ? A.onAuth(setUser) : undefined), []);
  const ok = !!(user && A && A.isAdminEmail(user.email));
  const load = useCallback(async () => {
    try { const r = await A.load(); setD(r); setSettings(r.settings); } catch (e) { toast(e.message, true); }
  }, []);
  useEffect(() => { if (ok) load(); }, [ok]);
  const act = async (label, fn, msg) => {
    setBusy(label);
    try { await fn(); if (msg) toast(msg); await load(); } catch (e) { toast(e.message, true); }
    setBusy(''); setConfirmDel(null);
  };

  const head = html`<${PageHead} tag="Admin · Teacher only" title="ADMIN" desc="작품 전시 승인, 투표 결과 확인, 올리기·투표 마감을 관리합니다." />`;
  const wrapIt = body => html`<div>${head}<section class="section" style=${{ paddingTop: 36 }}><div class="wrap">${body}</div></section></div>`;

  if (!A) return wrapIt(html`<div class="panel done"><div class="big">PREVIEW MODE</div><p>관리자 기능은 firebase-config.js에 Firebase 정보를 입력한 뒤 사용할 수 있어요.</p></div>`);
  if (user === undefined) return wrapIt(html`<div class="panel done"><p>로그인 상태를 확인하는 중…</p></div>`);
  if (!user) return wrapIt(html`<div class="panel done"><div class="big">TEACHER LOGIN</div><p>관리자로 등록된 구글 계정으로 로그인해 주세요.</p><br/>
    <button class="neon" type="button" onClick=${() => A.signIn().catch(e => toast(e.message, true))}>Google 계정으로 로그인 <span class="arr">→</span></button></div>`);
  if (!ok) return wrapIt(html`<div class="panel done"><div class="big">ACCESS DENIED</div><p><b>${user.email}</b> 계정은 관리자로 등록되어 있지 않아요.</p><p>firebase-config.js의 ADMIN_EMAILS와 firestore.rules의 이메일을 확인해 주세요.</p><br/>
    <button class="ghost light" type="button" onClick=${() => A.signOut()}>로그아웃</button></div>`);
  if (!d) return wrapIt(html`<div class="panel done"><p>데이터를 불러오는 중…</p></div>`);

  const works = d.works.slice().sort((a, b) => (a.approved - b.approved) || (b.time - a.time));
  const pending = works.filter(w => !w.approved).length;
  const counts = {};
  d.votes.forEach(v => (v.picks || []).forEach(id => { counts[id] = (counts[id] || 0) + 1; }));
  const ranking = d.works.map(w => Object.assign({}, w, { votes: counts[w.id] || 0 })).sort((a, b) => b.votes - a.votes);
  const maxV = Math.max(1, ...ranking.map(r => r.votes));
  const titleOf = id => (d.works.find(w => w.id === id) || {}).title || '(삭제된 작품)';

  const tabs = html`<div class="toolbar">
    <div class="tabs">
      ${[['works', `작품 관리`, works.length], ['results', '투표 결과', d.votes.length], ['settings', '마감 설정', null]].map(([k, l, n]) => html`<button key=${k} type="button" class=${'tab' + (tab === k ? ' on' : '')} style=${{ '--c': '#8055FF' }} onClick=${() => setTab(k)}>${l}${n != null && html`<span class="n">${n}</span>`}</button>`)}
    </div>
    <span class="adm-user">${user.email}</span>
    <button class="ghost light" type="button" onClick=${load}>새로고침</button>
    <button class="ghost light" type="button" onClick=${() => A.signOut()}>로그아웃</button>
  </div>`;

  let body;
  if (tab === 'works') body = html`<div>
    <p class="adm-note">승인 대기 <b>${pending}</b>개 · 전시 중 <b>${works.length - pending}</b>개 — ‘전시하기’를 누른 작품만 갤러리와 투표 화면에 나타나요.</p>
    ${!works.length && html`<div class="empty"><b>아직 제출된 작품이 없어요</b>학생들이 작품을 올리면 이곳에 표시됩니다.</div>`}
    <div class="adm-list">${works.map(w => html`<div key=${w.id} class=${'adm-row' + (w.approved ? ' on' : '')}>
      <div class="adm-th">${safeImg(w.thumb) ? html`<img src=${safeImg(w.thumb)} alt="" />` : html`<div class="ph" style=${{ width: '100%', height: '100%' }}>NO IMAGE</div>`}</div>
      <div class="adm-info">
        <div class="adm-st">${w.approved ? html`<span class="ok">● 전시 중</span>` : html`<span class="wait">● 승인 대기</span>`} <span class="mono">${w.category}</span></div>
        <b>${w.title}</b>
        <div class="meta"><span class="who">${w.name}</span><span class="sep"></span><span class="gc">${w.grade}학년 ${w.ban}반 ${w.num}번</span>${safeLink(w.link) && html`<span class="sep"></span><a href=${safeLink(w.link)} target="_blank" rel="noopener" class="adm-link">엔트리에서 열기 ↗</a>`}</div>
        <p><b>목적</b> ${w.purpose}</p><p><b>사용법</b> ${w.usage}</p>
      </div>
      <div class="adm-acts">
        ${w.approved
          ? html`<button class="ghost light" type="button" disabled=${!!busy} onClick=${() => act(w.id, () => A.setApproved(w.id, false), '전시를 중지했어요.')}>전시 중지</button>`
          : html`<button class="neon" type="button" disabled=${!!busy} onClick=${() => act(w.id, () => A.setApproved(w.id, true), '전시를 시작했어요.')}>전시하기</button>`}
        ${confirmDel === w.id
          ? html`<button class="ghost light danger" type="button" disabled=${!!busy} onClick=${() => act(w.id, () => A.deleteWork(w.id), '작품을 삭제했어요.')}>정말 삭제</button>`
          : html`<button class="ghost light" type="button" onClick=${() => setConfirmDel(w.id)}>삭제</button>`}
      </div>
    </div>`)}</div>
  </div>`;
  else if (tab === 'results') body = html`<div class="about-grid">
    <div class="panel">
      <h3>RANKING · 득표 순위</h3>
      <p class="adm-note">참여 ${d.votes.length}명 · 총 ${d.votes.length * 2}표</p>
      ${!ranking.length && html`<p class="adm-note">작품이 없어요.</p>`}
      <ol class="rank">${ranking.map((r, i) => html`<li key=${r.id}>
        <span class="rk">${i + 1}</span>
        <div class="rb"><div class="rt"><b>${r.title}</b><span>${r.name} · ${r.grade}-${r.ban}</span></div>
          <div class="bar"><i style=${{ width: (r.votes / maxV * 100) + '%' }}></i></div></div>
        <span class="rv">${r.votes}표</span>
      </li>`)}</ol>
    </div>
    <div class="panel">
      <h3>VOTERS · 투표한 학생</h3>
      <p class="adm-note">잘못된 투표를 삭제하면 그 학생은 다시 투표할 수 있어요.</p>
      <div class="voters">${d.votes.slice().sort((a, b) => b.time - a.time).map(v => html`<div key=${v.id} class="voter">
        <div><b>${v.grade}-${v.ban}-${v.num} ${v.name}</b><span>${(v.picks || []).map(titleOf).join(' · ')}</span></div>
        ${confirmDel === 'v' + v.id
          ? html`<button class="ghost light danger" type="button" disabled=${!!busy} onClick=${() => act(v.id, () => A.deleteVote(v.id, d.votes.length - 1), '투표를 삭제했어요.')}>정말 삭제</button>`
          : html`<button class="ghost light" type="button" onClick=${() => setConfirmDel('v' + v.id)}>삭제</button>`}
      </div>`)}${!d.votes.length && html`<p class="adm-note">아직 투표가 없어요.</p>`}</div>
    </div>
  </div>`;
  else body = html`<div class="panel" style=${{ maxWidth: 620 }}>
    <h3 style=${{ fontFamily: 'var(--display)', margin: '0 0 18px' }}>OPEN / CLOSE</h3>
    ${[['uploadOpen', '작품 올리기 받기', '끄면 학생들이 작품을 새로 올리거나 고칠 수 없어요.'], ['votingOpen', '투표 받기', '끄면 투표가 마감돼요.']].map(([k, l, s]) => html`<label key=${k} class="sw-row">
      <div><b>${l}</b><span>${s}</span></div>
      <input type="checkbox" class="sw" checked=${!!settings[k]} onChange=${e => setSettings(Object.assign({}, settings, { [k]: e.target.checked }))} />
    </label>`)}
    <button class="neon" type="button" style=${{ width: '100%', marginTop: 10 }} disabled=${!!busy} onClick=${() => act('settings', () => A.setSettings(settings), '설정을 저장했어요.')}>설정 저장</button>
  </div>`;

  return wrapIt(html`<div>${tabs}${body}</div>`);
}

const NAV = [['home', 'HOME', '홈'], ['explore', 'EXPLORE', '작품 둘러보기'], ['category', 'CATEGORY', '카테고리'], ['upload', 'UPLOAD', '작품 올리기'], ['vote', 'VOTE', '투표하기'], ['about', 'ABOUT', '전시 소개']];

function App() {
  const [data, setData] = useState({ config: DEFAULT_CONFIG, works: [], voteCount: 0, loaded: false });
  const [student, setStudent] = useState(() => { try { return JSON.parse(sessionStorage.getItem('swfair_student_v2') || 'null'); } catch (e) { return null; } });
  const [status, setStatus] = useState(null);
  const [view, setView] = useState({ name: 'home', arg: null, n: 0 });
  const [open, setOpen] = useState(null);
  const [toastMsg, setToast] = useState(null);
  const tRef = useRef();
  const [isAdmin, setIsAdmin] = useState(() => location.hash === '#admin');
  useEffect(() => { const h = () => setIsAdmin(location.hash === '#admin'); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);

  const toast = useCallback((msg, err) => {
    setToast({ msg, err }); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(null), 3200);
  }, []);
  const refresh = useCallback(async (withStatus) => {
    try {
      const d = await call('getInit');
      setData({ config: Object.assign({}, DEFAULT_CONFIG, d.config), works: d.works || [], voteCount: d.voteCount || 0, loaded: true });
    } catch (e) { toast('데이터를 불러오지 못했어요: ' + e.message, true); }
    if (withStatus && student) { try { setStatus(await call('getMyStatus', student)); } catch (e) {} }
  }, [student, toast]);
  const loadStatus = useCallback(async () => {
    if (!student) return;
    try { setStatus(await call('getMyStatus', student)); } catch (e) { toast(e.message, true); }
  }, [student, toast]);

  useEffect(() => { if (!isAdmin) refresh(true); }, [isAdmin]);  // 처음 열 때와 관리자 화면에서 돌아올 때 새로 불러오기

  const enter = st => {
    setStudent(st); setStatus(null);
    try { sessionStorage.setItem('swfair_student_v2', JSON.stringify(st)); } catch (e) {}
    setView({ name: 'home', arg: null, n: Date.now() });
    window.scrollTo(0, 0);
    toast(`${st.name}님, SW:FAIR에 오신 것을 환영해요!`);
  };
  const exit = () => {
    setStudent(null); setStatus(null);
    try { sessionStorage.removeItem('swfair_student_v2'); } catch (e) {}
    window.scrollTo(0, 0);
  };
  const go = (name, arg) => { setView({ name, arg: arg || null, n: Date.now() }); window.scrollTo({ top: 0 }); };

  const demoBar = data.config.demo && html`<div class="demo"><b>PREVIEW MODE</b> · 예시 작품이 들어 있고, 올리기·투표 내용은 이 브라우저에만 임시 저장됩니다.</div>`;
  const toastEl = toastMsg && html`<div class=${'toast' + (toastMsg.err ? ' err' : '')} role="status">${toastMsg.msg}</div>`;

  if (isAdmin) return html`<div>
    <header class="top"><div class="wrap bar">
      <a class="logo" href="#" onClick=${() => { history.replaceState(null, '', location.pathname); setIsAdmin(false); }}><b>SW<i>:</i>FAIR</b><small>ADMIN CONSOLE</small></a>
      <span style=${{ marginLeft: 'auto' }}></span>
      <a class="ghost" href="#" style=${{ padding: '9px 16px', fontSize: 13 }} onClick=${() => { history.replaceState(null, '', location.pathname); setIsAdmin(false); }}>전시장으로 돌아가기</a>
    </div></header>
    <main><${Admin} toast=${toast} /></main>${toastEl}</div>`;

  if (!student) return html`<div>${demoBar}<${Gate} config=${data.config} onEnter=${enter} toast=${toast} />${toastEl}</div>`;

  const props = { data, student, status, loadStatus, refresh, toast, go, onOpen: setOpen };
  let page;
  switch (view.name) {
    case 'explore': page = html`<${Explore} key=${view.n} ...${props} initialCat=${view.arg} />`; break;
    case 'category': page = html`<${Category} key=${view.n} ...${props} initialCat=${view.arg} />`; break;
    case 'upload': page = html`<${Upload} key=${view.n} ...${props} />`; break;
    case 'vote': page = html`<${Vote} key=${view.n} ...${props} />`; break;
    case 'about': page = html`<${About} key=${view.n} ...${props} />`; break;
    default: page = html`<${Home} key=${view.n} ...${props} />`;
  }

  return html`<div>
    ${demoBar}
    <header class="top">
      <div class="wrap bar">
        <button class="logo" type="button" onClick=${() => go('home')} aria-label="SW:FAIR 홈"><b>SW<i>:</i>FAIR</b><small>SINWOL × SOFTWARE</small></button>
        <nav class="menu">${NAV.map(([k, en, ko]) => html`<button key=${k} type="button" title=${ko} class=${view.name === k ? 'on' : ''} onClick=${() => go(k)}>${en}</button>`)}</nav>
        <div class="player">
          <span class="ava">${student.name.slice(0, 1)}</span>
          <span class="pn">${student.name}<small>${student.grade}-${student.ban} · NO.${student.num}</small></span>
          <button type="button" onClick=${exit} title="다른 사람으로 입장">EXIT</button>
        </div>
      </div>
    </header>
    <main>${page}</main>
    <footer class="foot">SW:FAIR · SINWOL × SOFTWARE · 신월중학교 정보 수업 2026<br/><a href="#admin" class="foot-admin">TEACHER ADMIN</a></footer>
    <${WorkModal} w=${open} onClose=${() => setOpen(null)} />
    ${toastEl}
  </div>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
