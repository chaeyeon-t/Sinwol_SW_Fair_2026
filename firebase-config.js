// ============================================================
//  SW:FAIR 설정 파일 — 선생님이 직접 채우는 곳
// ============================================================

// 1) Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹) → "SDK 설정 및 구성"의 값을 그대로 붙여 넣으세요.
//    projectId가 비어 있으면 사이트가 '미리보기 모드'(예시 작품, 저장 안 됨)로 동작합니다.
//    이 값들은 공개되어도 괜찮은 값입니다. 데이터 보호는 firestore.rules가 담당합니다.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASxUc377DNgi-6ZWRysGUPpkI1zV9WQXk",
  authDomain: "sinwol-sw-fair-2026.firebaseapp.com",
  projectId: "sinwol-sw-fair-2026",
  storageBucket: "sinwol-sw-fair-2026.firebasestorage.app",
  messagingSenderId: "1055299409188",
  appId: "1:1055299409188:web:0e2c94ee3bdd044a050fb1",
  measurementId: "G-S0L6ZWFFV9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2) 관리자(선생님) 구글 계정 이메일. firestore.rules의 이메일과 똑같이 적어 주세요.
export const ADMIN_EMAILS = [
  "parkcy0815@gmail.com",
];

// 3) 입장 화면 선택지
export const SITE = {
  grades: [1, 2, 3],   // 학년 목록 (firestore.rules는 1~3학년만 허용)
  classCount: 7,      // 반 개수 (rules는 최대 20반까지 허용)
  maxNumber: 22,       // 번호 최대값 (rules는 최대 50번까지 허용)
};
