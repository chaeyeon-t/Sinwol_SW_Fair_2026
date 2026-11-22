# SW:FAIR — SINWOL × SOFTWARE

신월중학교 학생들이 한 달 동안 **엔트리(Entry)** 로 만든 작품을 전시하고 투표하는 웹사이트입니다.

- 화면: React 18 + htm (빌드 과정 없이 CDN으로 실행)
- 데이터: Firebase **Cloud Firestore** (썸네일도 압축해서 Firestore에 저장 → Storage·유료 요금제 불필요)
- 관리자 로그인: Firebase **Authentication (Google)**
- 배포: GitHub Pages 또는 Firebase Hosting

## 화면 구성

| 화면 | 내용 |
|---|---|
| 입장 | 학년/반/번호/이름을 입력해야 전시장으로 들어갑니다. |
| HOME | 대형 SW:FAIR 타이포그래피, 슬로건, 최근 작품, 흐르는 띠, 카테고리 메뉴 |
| EXPLORE | 전체 작품 갤러리 (카테고리 필터, 검색, 정렬). 카드에 마우스를 올리면 ‘작품 실행하기’ |
| CATEGORY | GAME · ANIMATION · ART · EDUCATION · ETC. 선택 시 해당 작품만 표시 |
| UPLOAD | 대표 이미지, 카테고리, 제목, 엔트리 링크, 목적, 사용법 제출 (학생 1명당 1작품, 다시 내면 덮어쓰기) |
| VOTE | 마음에 드는 작품 2개 투표 (학년-반-번호당 1회) |
| ABOUT | 전시 소개 |
| `#admin` | 선생님 전용: 전시 승인/중지, 삭제, 득표 순위, 투표 삭제, 올리기·투표 마감 |

`firebase-config.js`가 비어 있으면 **미리보기 모드**(예시 작품, 브라우저에만 임시 저장)로 동작합니다.

## 설치 (처음 한 번)

### 1. Firebase 프로젝트 만들기
1. <https://console.firebase.google.com> → **프로젝트 추가** (Google 애널리틱스는 꺼도 됩니다).
2. **Firestore Database** → 데이터베이스 만들기 → 위치 `asia-northeast3 (서울)` → **프로덕션 모드**.
3. **Authentication** → 시작하기 → 로그인 방법 → **Google** 사용 설정.
4. 프로젝트 설정(⚙) → **내 앱 → 웹(</>)** 앱 추가 → 나오는 `firebaseConfig` 값을 복사.

### 2. 설정 파일 채우기
- `firebase-config.js`
  - `firebaseConfig`에 복사한 값을 붙여 넣기
  - `ADMIN_EMAILS`에 선생님 구글 계정 이메일
  - 필요하면 `SITE`의 학년·반 수·번호 범위 수정
- `firestore.rules`
  - `isTeacher()` 안의 `'teacher@example.com'`을 **같은 이메일**로 변경

### 3. 보안 규칙 배포
Firebase 콘솔 → Firestore Database → **규칙** 탭에 `firestore.rules` 내용을 붙여 넣고 **게시**.
(또는 Firebase CLI: `firebase deploy --only firestore:rules`)

### 4. 사이트 공개 (GitHub Pages)
1. 이 저장소 → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → Save.
2. 잠시 후 `https://<계정>.github.io/Sinwol_SW_Fair_2026/` 주소가 생깁니다.
3. Firebase 콘솔 → Authentication → 설정 → **승인된 도메인**에 `<계정>.github.io` 추가 (관리자 로그인용).

## 운영

- **전시 승인**: 학생이 올린 작품은 ‘승인 대기’ 상태입니다. `사이트주소/#admin`(페이지 맨 아래 TEACHER ADMIN)에서 로그인 후 **전시하기**를 눌러야 갤러리와 투표 화면에 나타납니다. 학생이 작품을 다시 제출하면 다시 승인 대기로 바뀝니다.
- **투표 결과**: 관리자 → 투표 결과 탭에서 득표 순위와 투표한 학생을 볼 수 있습니다. 잘못된 투표를 삭제하면 그 학생은 다시 투표할 수 있습니다.
- **마감**: 관리자 → 마감 설정에서 작품 올리기 / 투표를 끄고 켭니다.

## 데이터 구조 (Firestore)

| 경로 | 내용 |
|---|---|
| `works/{학년-반-번호}` | grade, ban, num, name, category, title, purpose, usage, link, thumb(data URL), approved, createdAt, updatedAt |
| `votes/{학년-반-번호}` | grade, ban, num, name, picks[작품ID 2개], createdAt |
| `stats/public` | votes(전체 투표 수), lastVote |
| `settings/site` | uploadOpen, votingOpen |

## 보안 규칙 요약 (`firestore.rules`)

- 승인된 작품만 목록 조회 가능, 승인/삭제/마감 설정은 관리자만
- 학생이 올리는 작품은 항상 `approved: false`, 엔트리 링크(`https://playentry.org/...`)만, 글자 수·이미지 크기 제한
- 투표는 학년-반-번호 문서당 1번 생성만 가능(수정 불가), 서로 다른 **전시 중** 작품 2개만
- 전체 투표 수는 투표와 함께 1씩만 증가

### 공개 전 확인 목록
규칙은 Firestore 에뮬레이터로 자동 테스트하지 못했습니다. 배포 후 다음을 직접 확인해 주세요.
1. 학생으로 작품 올리기 → 성공, 갤러리에는 안 보임
2. 관리자에서 전시하기 → 갤러리에 보임
3. 작품 2개 투표 → 성공 / 같은 학년-반-번호로 다시 투표 → 거절
4. 마감 설정에서 투표 끄기 → 투표 거절
5. 관리자로 등록되지 않은 구글 계정으로 `#admin` 로그인 → 접근 거부

## 한계

- 학생 신원은 스스로 입력한 학년/반/번호/이름이라, 다른 학생 번호로 투표하거나 작품을 덮어쓰는 것을 완전히 막지는 못합니다. 관리자 화면의 ‘투표한 학생’ 목록으로 확인할 수 있습니다.
- React·글꼴·Firebase SDK를 외부 CDN(cdnjs, unpkg, gstatic, Google Fonts)에서 불러옵니다. 학교망에서 막혀 있지 않은지 미리 확인해 주세요.
- 파일을 직접 더블클릭(`file://`)하면 동작하지 않습니다. GitHub Pages 주소나 로컬 서버(`python3 -m http.server`)로 열어 주세요.
