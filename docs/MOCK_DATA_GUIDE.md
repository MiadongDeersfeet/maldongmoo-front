# 말씀암송 인증방 PWA — Mock Data 가이드

> 실제 백엔드 연결 전 프론트엔드 개발용 mock data 기준.  
> **PDF DB 구조(7개 테이블)를 그대로 반영한다.**

---

## 원칙

1. mock data 필드명·타입은 DB 컬럼과 1:1 대응 (camelCase 변환).
2. 비즈니스 규칙을 mock에서도 준수한다.
3. API 연동 시 mock → 실 API로 교체하기 쉽게 **서비스 레이어**에서 분리한다.
4. `STATUS = 'N'` row는 조회 시 필터링 (탈퇴·취소·비활성).
5. 인증 피드에는 `CHECK_IN.STATUS = 'Y'` 카드만 노출한다.

---

## MVP 설계 결정 (확정)

| 항목 | 결정 |
|------|------|
| `INVITE_CODE` | 6자리 대문자 영문+숫자 (예: `A7K3P9`). mock은 기존 코드 중복만 확인 |
| 피드 날짜 정렬 | 최신 날짜가 위. 같은 날짜 내는 mock 기준 자연스러운 표시 |
| `STATUS='N'` 카드 | 피드 미노출. 오늘 미완료 표시·내부 상태용 |
| 방장 본문 등록 | MVP 포함. 방 상세 내 `ROOM_ROLE=LEADER` 전용 간단 UI |
| 로그인 리다이렉트 | 로그인 + `/`·`/login` → `/home`. 비로그인 + protected → `/login` |

---

## `INVITE_CODE` mock 규칙

```typescript
/** 6자리 대문자 영문+숫자 생성 (mock) */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // ... 6자리 랜덤 생성
}

/** mock: 기존 mockRooms의 inviteCode와 중복 여부만 확인 */
function isInviteCodeAvailable(code: string, existingRooms: Room[]): boolean {
  return !existingRooms.some((r) => r.inviteCode === code);
}
```

> 실제 DB UNIQUE 중복 검증은 추후 백엔드에서 처리.

---

## TypeScript 타입 정의

```typescript
// ── TB_MEMBER ──
export interface Member {
  memberId: number;
  kakaoId: string;
  profileImg: string | null;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
  deletedAt: string | null;
  status: 'Y' | 'N';
}

// ── TB_ROOM ──
export interface Room {
  roomId: number;
  leaderId: number;
  inviteCode: string;
  roomName: string;
  memberLimit: number;
  createdAt: string;
  updatedAt: string | null;
  status: 'Y' | 'N';
}

// ── TB_ROOM_MEMBER ──
export interface RoomMember {
  roomId: number;
  memberId: number;
  roomRole: 'LEADER' | 'MEMBER';
  createdAt: string;
  deletedAt: string | null;
  status: 'Y' | 'N';
}

// ── TB_RECITATION_SECTION ──
export interface RecitationSection {
  sectionId: number;
  roomId: number;
  sectionTitle: string;
  weeklyRange: string;
  recitationText: string;
  displayOrder: number;
  isActive: 'Y' | 'N';
  createdAt: string;
  updatedAt: string | null;
  status: 'Y' | 'N';
}

// ── TB_RECITATION_CHECK_IN ──
export interface RecitationCheckIn {
  checkInId: number;
  roomId: number;
  memberId: number;
  checkInDate: string; // 'YYYY-MM-DD' (TRUNC 날짜)
  createdAt: string;
  updatedAt: string | null;
  status: 'Y' | 'N';
}

// ── TB_RECITATION_CHECK_IN_DETAIL ──
export interface RecitationCheckInDetail {
  detailId: number;
  checkInId: number;
  checkInType: 'VOICE' | 'COUNTER';
  audioUrl: string | null;
  counterValue: number | null;
  createdAt: string;
  deletedAt: string | null;
  status: 'Y' | 'N';
}

// ── TB_RECITATION_AMEN ──
export interface RecitationAmen {
  amenId: number;
  memberId: number;
  checkInId: number;
  createdAt: string;
  updatedAt: string | null;
  status: 'Y' | 'N';
}
```

---

## API 응답용 조합 타입 (피드)

DB 테이블 join 결과를 프론트에서 쓰기 좋게 묶은 형태 (PDF 6장 예시 기준):

```typescript
export interface CheckInDetailView {
  detailId: number;
  checkInType: 'VOICE' | 'COUNTER';
  audioUrl: string | null;
  counterValue: number | null;
  createdAt: string;
}

export interface CheckInCardView {
  checkInId: number;
  memberId: number;
  memberName: string;
  profileImg: string | null;
  amenCount: number;
  isAmenedByMe: boolean;
  details: CheckInDetailView[];
}

export interface FeedByDate {
  checkInDate: string;
  checkIns: CheckInCardView[];
}
```

---

## Mock 시나리오 개요

| 항목 | 설정 |
|------|------|
| 회원 | 4명 (memberId 1~4) |
| 암송방 | 2개 (roomId 1~2) |
| 교차 참여 | member 1 → room 1, 2 모두 참여 |
| 오늘 날짜 | `2026-06-13` (개발 기준일) |
| 어제 | `2026-06-12` |

### 참여 관계

```
Room 1 "요한복음 암송방" (LEADER: member 1)
  ├── member 1 (LEADER)
  ├── member 2 (MEMBER)
  └── member 3 (MEMBER)

Room 2 "시편 암송방" (LEADER: member 2)
  ├── member 1 (MEMBER)
  ├── member 2 (LEADER)
  └── member 4 (MEMBER)
```

---

## 1. 회원 (TB_MEMBER)

```typescript
export const mockMembers: Member[] = [
  {
    memberId: 1,
    kakaoId: 'kakao_1001',
    profileImg: 'https://placehold.co/80x80/FFE066/333?text=김',
    name: '김윤기',
    role: 'MEMBER',
    createdAt: '2026-05-01 10:00:00',
    deletedAt: null,
    status: 'Y',
  },
  {
    memberId: 2,
    kakaoId: 'kakao_1002',
    profileImg: 'https://placehold.co/80x80/B8E0FF/333?text=박',
    name: '박은빈',
    role: 'MEMBER',
    createdAt: '2026-05-02 11:00:00',
    deletedAt: null,
    status: 'Y',
  },
  {
    memberId: 3,
    kakaoId: 'kakao_1003',
    profileImg: 'https://placehold.co/80x80/FFD6E0/333?text=이',
    name: '이준호',
    role: 'MEMBER',
    createdAt: '2026-05-03 09:00:00',
    deletedAt: null,
    status: 'Y',
  },
  {
    memberId: 4,
    kakaoId: 'kakao_1004',
    profileImg: null,
    name: '최서연',
    role: 'MEMBER',
    createdAt: '2026-05-10 14:00:00',
    deletedAt: null,
    status: 'Y',
  },
];

/** 프론트 개발용 현재 로그인 사용자 */
export const mockCurrentMemberId = 1;
```

---

## 2. 암송방 (TB_ROOM)

```typescript
export const mockRooms: Room[] = [
  {
    roomId: 1,
    leaderId: 1,
    inviteCode: 'A7K3P9',
    roomName: '요한복음 암송방',
    memberLimit: 20,
    createdAt: '2026-05-01 10:30:00',
    updatedAt: null,
    status: 'Y',
  },
  {
    roomId: 2,
    leaderId: 2,
    inviteCode: 'B2M8X4',
    roomName: '시편 암송방',
    memberLimit: 10,
    createdAt: '2026-05-15 16:00:00',
    updatedAt: null,
    status: 'Y',
  },
];
```

> `inviteCode`는 MVP 확정 규칙(6자리 대문자 영문+숫자)에 맞춤.

---

## 3. 방 참여자 (TB_ROOM_MEMBER)

```typescript
export const mockRoomMembers: RoomMember[] = [
  { roomId: 1, memberId: 1, roomRole: 'LEADER', createdAt: '2026-05-01 10:30:00', deletedAt: null, status: 'Y' },
  { roomId: 1, memberId: 2, roomRole: 'MEMBER', createdAt: '2026-05-02 12:00:00', deletedAt: null, status: 'Y' },
  { roomId: 1, memberId: 3, roomRole: 'MEMBER', createdAt: '2026-05-05 08:00:00', deletedAt: null, status: 'Y' },
  { roomId: 2, memberId: 1, roomRole: 'MEMBER', createdAt: '2026-05-16 09:00:00', deletedAt: null, status: 'Y' },
  { roomId: 2, memberId: 2, roomRole: 'LEADER', createdAt: '2026-05-15 16:00:00', deletedAt: null, status: 'Y' },
  { roomId: 2, memberId: 4, roomRole: 'MEMBER', createdAt: '2026-05-17 10:00:00', deletedAt: null, status: 'Y' },
];
```

---

## 4. 암송 본문/공지 (TB_RECITATION_SECTION)

```typescript
export const mockSections: RecitationSection[] = [
  {
    sectionId: 1,
    roomId: 1,
    sectionTitle: '요한복음 1장',
    weeklyRange: '요한복음 1장 1~5절',
    recitationText:
      '태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라...',
    displayOrder: 1,
    isActive: 'Y',
    createdAt: '2026-06-01 09:00:00',
    updatedAt: null,
    status: 'Y',
  },
  {
    sectionId: 2,
    roomId: 1,
    sectionTitle: '요한복음 1장 (2주차)',
    weeklyRange: '요한복음 1장 6~10절',
    recitationText: '하나님께로부터 보냄을 받은 사람이 났으니 그 이름은 요한이라...',
    displayOrder: 2,
    isActive: 'N',
    createdAt: '2026-06-08 09:00:00',
    updatedAt: null,
    status: 'Y',
  },
  {
    sectionId: 3,
    roomId: 2,
    sectionTitle: '시편 23편',
    weeklyRange: '시편 23편 전체',
    recitationText: '여호와는 나의 목자시니 내게 부족함이 없으리로다...',
    displayOrder: 1,
    isActive: 'Y',
    createdAt: '2026-06-01 10:00:00',
    updatedAt: null,
    status: 'Y',
  },
];
```

---

## 5. 하루 인증 카드 (TB_RECITATION_CHECK_IN)

> Room 1 기준. 회원·방·날짜 UNIQUE 준수.

```typescript
export const mockCheckIns: RecitationCheckIn[] = [
  // ── 2026-06-12 (어제) ──
  { checkInId: 1, roomId: 1, memberId: 1, checkInDate: '2026-06-12', createdAt: '2026-06-12 08:00:00', updatedAt: null, status: 'Y' },
  { checkInId: 2, roomId: 1, memberId: 2, checkInDate: '2026-06-12', createdAt: '2026-06-12 09:15:00', updatedAt: null, status: 'Y' },
  { checkInId: 3, roomId: 1, memberId: 3, checkInDate: '2026-06-12', createdAt: '2026-06-12 07:30:00', updatedAt: '2026-06-12 20:00:00', status: 'N' }, // detail 전부 취소됨

  // ── 2026-06-13 (오늘) ──
  { checkInId: 4, roomId: 1, memberId: 1, checkInDate: '2026-06-13', createdAt: '2026-06-13 09:00:00', updatedAt: null, status: 'Y' },
  { checkInId: 5, roomId: 1, memberId: 2, checkInDate: '2026-06-13', createdAt: '2026-06-13 10:00:00', updatedAt: null, status: 'Y' },
  // member 3: 오늘 CHECK_IN row 없음 → 미완료

  // ── Room 2, 오늘 ──
  { checkInId: 6, roomId: 2, memberId: 2, checkInDate: '2026-06-13', createdAt: '2026-06-13 08:30:00', updatedAt: null, status: 'Y' },
];
```

### 검증 포인트

| checkInId | 의미 |
|-----------|------|
| 3 | row는 있으나 `STATUS='N'` → **미완료** (피드 SQL 기준 제외) |
| 4 | member 1 오늘 완료 (`STATUS='Y'`) |
| — | member 3 오늘 row 없음 → **미완료** |

---

## 6. 녹음/계수기 Detail (TB_RECITATION_CHECK_IN_DETAIL)

```typescript
export const mockCheckInDetails: RecitationCheckInDetail[] = [
  // checkInId 1 (어제, 김윤기)
  { detailId: 1, checkInId: 1, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio1.mp3', counterValue: null, createdAt: '2026-06-12 08:10:00', deletedAt: null, status: 'Y' },

  // checkInId 2 (어제, 박은빈)
  { detailId: 2, checkInId: 2, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio2.mp3', counterValue: null, createdAt: '2026-06-12 09:20:00', deletedAt: null, status: 'Y' },

  // checkInId 3 (어제, 이준호 — 모두 취소)
  { detailId: 3, checkInId: 3, checkInType: 'COUNTER', audioUrl: null, counterValue: 5, createdAt: '2026-06-12 07:35:00', deletedAt: '2026-06-12 20:00:00', status: 'N' },

  // checkInId 4 (오늘, 김윤기 — 녹음 + 계수기 2개)
  { detailId: 4, checkInId: 4, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio3.mp3', counterValue: null, createdAt: '2026-06-13 09:12:00', deletedAt: null, status: 'Y' },
  { detailId: 5, checkInId: 4, checkInType: 'COUNTER', audioUrl: null, counterValue: 10, createdAt: '2026-06-13 09:30:00', deletedAt: null, status: 'Y' },

  // checkInId 5 (오늘, 박은빈)
  { detailId: 6, checkInId: 5, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio4.mp3', counterValue: null, createdAt: '2026-06-13 10:05:00', deletedAt: null, status: 'Y' },

  // checkInId 6 (room 2, 오늘, 박은빈)
  { detailId: 7, checkInId: 6, checkInType: 'COUNTER', audioUrl: null, counterValue: 3, createdAt: '2026-06-13 08:45:00', deletedAt: null, status: 'Y' },
];
```

---

## 7. 아멘 (TB_RECITATION_AMEN)

> `CHECK_IN_ID` 기준. 본인 카드(memberId === checkIn.memberId)에는 아멘 없음.

```typescript
export const mockAmens: RecitationAmen[] = [
  // checkInId 4 (김윤기 오늘) — member 2, 3이 아멘
  { amenId: 1, memberId: 2, checkInId: 4, createdAt: '2026-06-13 10:00:00', updatedAt: null, status: 'Y' },
  { amenId: 2, memberId: 3, checkInId: 4, createdAt: '2026-06-13 11:00:00', updatedAt: null, status: 'Y' },
  { amenId: 3, memberId: 1, checkInId: 4, createdAt: '2026-06-13 09:00:00', updatedAt: '2026-06-13 09:01:00', status: 'N' }, // 본인이 눌렀다가 취소 시도 (Service에서 차단, mock 참고용)

  // checkInId 5 (박은빈 오늘) — member 1, 3이 아멘
  { amenId: 4, memberId: 1, checkInId: 5, createdAt: '2026-06-13 10:30:00', updatedAt: null, status: 'Y' },
  { amenId: 5, memberId: 3, checkInId: 5, createdAt: '2026-06-13 11:30:00', updatedAt: null, status: 'Y' },

  // checkInId 1 (어제, 김윤기)
  { amenId: 6, memberId: 2, checkInId: 1, createdAt: '2026-06-12 12:00:00', updatedAt: null, status: 'Y' },
];
```

---

## 8. 피드 조합 예시 (Room 1)

`mockCurrentMemberId = 1` 기준. **날짜는 최신순(내림차순)** — 아래 예시는 `2026-06-13` → `2026-06-12` 순.

```typescript
export const mockRoom1Feed: FeedByDate[] = [
  {
    checkInDate: '2026-06-13',
    checkIns: [
      {
        checkInId: 4,
        memberId: 1,
        memberName: '김윤기',
        profileImg: 'https://placehold.co/80x80/FFE066/333?text=김',
        amenCount: 2, // STATUS='Y' amen만 (amenId 1, 2)
        isAmenedByMe: false,
        details: [
          { detailId: 4, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio3.mp3', counterValue: null, createdAt: '2026-06-13 09:12:00' },
          { detailId: 5, checkInType: 'COUNTER', audioUrl: null, counterValue: 10, createdAt: '2026-06-13 09:30:00' },
        ],
      },
      {
        checkInId: 5,
        memberId: 2,
        memberName: '박은빈',
        profileImg: 'https://placehold.co/80x80/B8E0FF/333?text=박',
        amenCount: 2,
        isAmenedByMe: true, // member 1이 amenId 4
        details: [
          { detailId: 6, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio4.mp3', counterValue: null, createdAt: '2026-06-13 10:05:00' },
        ],
      },
    ],
  },
  {
    checkInDate: '2026-06-12',
    checkIns: [
      {
        checkInId: 1,
        memberId: 1,
        memberName: '김윤기',
        profileImg: 'https://placehold.co/80x80/FFE066/333?text=김',
        amenCount: 1,
        isAmenedByMe: false,
        details: [
          { detailId: 1, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio1.mp3', counterValue: null, createdAt: '2026-06-12 08:10:00' },
        ],
      },
      {
        checkInId: 2,
        memberId: 2,
        memberName: '박은빈',
        profileImg: 'https://placehold.co/80x80/B8E0FF/333?text=박',
        amenCount: 0,
        isAmenedByMe: false,
        details: [
          { detailId: 2, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio2.mp3', counterValue: null, createdAt: '2026-06-12 09:20:00' },
        ],
      },
      // checkInId 3 (이준호, STATUS='N') → 피드 미노출 (MVP 확정)
    ],
  },
];
```

> 피드 mock 서비스는 `checkInDate` 기준 **내림차순** 정렬 후 반환한다.

---

## Mock 서비스 함수 (제안)

```typescript
// front/src/mocks/services/ — 실제 API 교체 지점

getCurrentMember(): Member
getMyRooms(memberId: number): HomeRoomCard[]
getRoomFeed(roomId: number, currentMemberId: number): FeedByDate[]
getTodayCheckInStatus(roomId: number, memberId: number): 'Y' | 'N' | null
getActiveSection(roomId: number): RecitationSection | null

submitVoiceCheckIn(roomId: number, memberId: number, audioUrl: string): void
submitCounterCheckIn(roomId: number, memberId: number, counterValue: number): void
cancelCheckInDetail(detailId: number): void
toggleAmen(checkInId: number, memberId: number): void // 본인 카드면 throw

createRoom(input: CreateRoomInput, leaderId: number): Room  // inviteCode 6자리 자동 생성
joinRoom(inviteCode: string, memberId: number): Room       // 6자리 코드 입력

createSection(roomId: number, input: CreateSectionInput, leaderMemberId: number): RecitationSection  // 방장만
updateSection(sectionId: number, input: Partial<CreateSectionInput>, leaderMemberId: number): RecitationSection
```

---

## Mock data 검증 체크리스트

- [ ] 한 회원이 여러 방 참여 (member 1 → room 1, 2)
- [ ] 한 방에 여러 회원 (room 1 → member 1, 2, 3)
- [ ] 하루 인증 카드 = 회원·방·날짜 UNIQUE
- [ ] 하나의 카드에 VOICE + COUNTER detail 다수 (checkInId 4)
- [ ] CHECK_IN row 있으나 STATUS='N' → 미완료 (checkInId 3)
- [ ] CHECK_IN row 없음 → 미완료 (member 3, 오늘)
- [ ] 아멘 = CHECK_IN_ID 기준, detail 아님
- [ ] 본인 카드 아멘 UI 비활성 (checkInId 4, memberId 1)
- [ ] amenCount = STATUS='Y' COUNT만
- [ ] detail 취소 = STATUS='N' (detailId 3)
- [ ] 피드 mock — 날짜 **내림차순**(최신 위), `STATUS='Y'` 카드만
- [ ] `STATUS='N'` 카드 — 피드 미노출, 오늘 상태 영역에서만 미완료 표시
- [ ] `inviteCode` — 6자리 대문자 영문+숫자 형식
- [ ] 방장 본문 등록 mock — `ROOM_ROLE='LEADER'` 검사

---

## 파일 배치 (제안)

```
front/src/
  mocks/
    data/
      members.ts
      rooms.ts
      roomMembers.ts
      sections.ts
      checkIns.ts
      checkInDetails.ts
      amens.ts
    services/
      mockAuthService.ts
      mockRoomService.ts
      mockCheckInService.ts
      mockFeedService.ts
    types/
      index.ts
    index.ts          # mock on/off 스위치
    utils/
      inviteCode.ts   # generateInviteCode, isInviteCodeAvailable
```

---

## 추후 백엔드에서 확정할 항목

| 항목 | 현재 MVP 처리 |
|------|---------------|
| `INVITE_CODE` DB UNIQUE 중복 검증 | mock은 기존 코드 목록과만 비교 |
| 피드 같은 날짜 내 정렬 | mock 기준 자연스러운 표시 |
| 방장 본문 등록 권한 | 프론트 `ROOM_ROLE` UI + 추후 Service 재검증 |
