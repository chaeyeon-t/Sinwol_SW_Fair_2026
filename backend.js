// SW:FAIR — Firebase(Firestore) 백엔드
// 데이터 구조
//   works/{학년-반-번호}   학생 1명당 작품 1개. approved가 true인 작품만 전시됩니다.
//   votes/{학년-반-번호}   학생 1명당 투표 1회 (picks: 작품 ID 2개)
//   stats/public          { votes: 전체 투표 수, lastVote: 마지막 투표 키 }
//   settings/site         { uploadOpen, votingOpen } — 관리자 페이지에서 변경
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, where, runTransaction, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

export function createBackend(firebaseConfig, SITE, ADMIN_EMAILS) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const keyOf = s => `${s.grade}-${s.ban}-${s.num}`;
  const toMs = t => (t && typeof t.toMillis === 'function') ? t.toMillis() : 0;
  const workOut = snap => {
    const d = snap.data();
    return {
      id: snap.id, time: toMs(d.updatedAt || d.createdAt), grade: d.grade, ban: d.ban, num: d.num, name: d.name,
      category: d.category, title: d.title, purpose: d.purpose, usage: d.usage, link: d.link, thumb: d.thumb,
      approved: d.approved === true,
    };
  };
  const friendly = e => {
    if (e && e.code === 'permission-denied') return new Error('허용되지 않은 요청이에요. 마감되었거나 입력 내용이 올바르지 않을 수 있어요.');
    if (e && e.code === 'unavailable') return new Error('인터넷 연결을 확인하고 다시 시도해 주세요.');
    return e instanceof Error ? e : new Error(String(e));
  };
  const wrap = fn => async (...a) => { try { return await fn(...a); } catch (e) { throw friendly(e); } };

  async function readSettings() {
    const s = await getDoc(doc(db, 'settings', 'site'));
    const d = s.exists() ? s.data() : {};
    return { uploadOpen: d.uploadOpen !== false, votingOpen: d.votingOpen !== false };
  }

  const api = {
    getInit: wrap(async () => {
      const [settings, worksSnap, stats] = await Promise.all([
        readSettings(),
        getDocs(query(collection(db, 'works'), where('approved', '==', true))),
        getDoc(doc(db, 'stats', 'public')),
      ]);
      return {
        config: Object.assign({}, SITE, settings, { autoApprove: false }),
        works: worksSnap.docs.map(workOut),
        voteCount: stats.exists() ? (stats.data().votes || 0) : 0,
      };
    }),

    getMyStatus: wrap(async st => {
      const key = keyOf(st);
      const [w, v] = await Promise.all([getDoc(doc(db, 'works', key)), getDoc(doc(db, 'votes', key))]);
      let votedTitles = [];
      if (v.exists()) {
        const picks = v.data().picks || [];
        const snaps = await Promise.all(picks.map(id => getDoc(doc(db, 'works', id))));
        votedTitles = snaps.map(s => s.exists() ? s.data().title : '(삭제된 작품)');
      }
      return {
        myWork: w.exists() ? { title: w.data().title, approved: w.data().approved === true } : null,
        voted: v.exists(),
        votedTitles,
      };
    }),

    submitWork: wrap(async (st, w) => {
      const key = keyOf(st);
      const ref = doc(db, 'works', key);
      const old = await getDoc(ref);
      await setDoc(ref, {
        grade: st.grade, ban: st.ban, num: st.num, name: st.name,
        category: w.category, title: w.title, purpose: w.purpose, usage: w.usage, link: w.link, thumb: w.thumb,
        approved: false,
        createdAt: old.exists() ? old.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { ok: true, replaced: old.exists(), approved: false };
    }),

    submitVote: async (st, ids) => {
      const key = keyOf(st);
      try {
        await runTransaction(db, async tx => {
          const vRef = doc(db, 'votes', key), sRef = doc(db, 'stats', 'public');
          const [v, s] = [await tx.get(vRef), await tx.get(sRef)];
          if (v.exists()) throw new Error('ALREADY');
          tx.set(vRef, { grade: st.grade, ban: st.ban, num: st.num, name: st.name, picks: [ids[0], ids[1]], createdAt: serverTimestamp() });
          tx.set(sRef, { votes: (s.exists() ? (s.data().votes || 0) : 0) + 1, lastVote: key });
        });
        return { ok: true };
      } catch (e) {
        if (e && e.message === 'ALREADY') throw new Error(`${st.grade}학년 ${st.ban}반 ${st.num}번은 이미 투표했어요. 투표는 한 번만 할 수 있어요.`);
        throw friendly(e);
      }
    },

    // ---------- 관리자 ----------
    admin: {
      isAdminEmail: email => !!email && ADMIN_EMAILS.map(x => x.toLowerCase()).includes(email.toLowerCase()),
      onAuth: cb => onAuthStateChanged(auth, u => cb(u ? { email: u.email, name: u.displayName } : null)),
      signIn: wrap(() => signInWithPopup(auth, new GoogleAuthProvider())),
      signOut: () => signOut(auth),
      load: wrap(async () => {
        const [works, votes, settings] = await Promise.all([
          getDocs(collection(db, 'works')), getDocs(collection(db, 'votes')), readSettings(),
        ]);
        return {
          works: works.docs.map(workOut),
          votes: votes.docs.map(s => Object.assign({ id: s.id }, s.data(), { time: toMs(s.data().createdAt) })),
          settings,
        };
      }),
      setApproved: wrap((id, approved) => updateDoc(doc(db, 'works', id), { approved })),
      deleteWork: wrap(id => deleteDoc(doc(db, 'works', id))),
      deleteVote: wrap(async (id, remaining) => {
        await deleteDoc(doc(db, 'votes', id));
        await setDoc(doc(db, 'stats', 'public'), { votes: remaining, lastVote: '' });
      }),
      setSettings: wrap(s => setDoc(doc(db, 'settings', 'site'), { uploadOpen: !!s.uploadOpen, votingOpen: !!s.votingOpen })),
    },
  };
  return api;
}
