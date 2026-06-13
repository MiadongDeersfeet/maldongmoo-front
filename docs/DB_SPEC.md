# 말씀암송 인증방 PWA — DB 명세

> PDF「말씀암송 인증방 PWA - Cursor 전달용 최종 DB/기능 명세서」를 기준으로 작성.  
> **DB 구조는 임의로 변경하지 않는다.**

---

## 최종 테이블 목록

| # | 테이블명 | 역할 |
|---|----------|------|
| 1 | `TB_MEMBER` | 회원 |
| 2 | `TB_ROOM` | 암송방 |
| 3 | `TB_ROOM_MEMBER` | 암송방 참여자 |
| 4 | `TB_RECITATION_SECTION` | 암송 본문/공지 |
| 5 | `TB_RECITATION_CHECK_IN` | 하루 단위 인증 카드 |
| 6 | `TB_RECITATION_CHECK_IN_DETAIL` | 녹음/계수기 인증 기록 |
| 7 | `TB_RECITATION_AMEN` | 아멘 반응 |

---

## 각 테이블 상세

### 1. TB_MEMBER — 회원

| 컬럼명 | 역할 | 비고 |
|--------|------|------|
| `MEMBER_ID` | 회원 식별값 | PK |
| `KAKAO_ID` | 카카오톡 식별값 | UNIQUE |
| `PROFILE_IMG` | 카카오톡 프로필 이미지 | nullable |
| `NAME` | 앱에서 사용할 실명 | 카카오 닉네임과 별도 |
| `ROLE` | 서비스 전체 권한 | `ADMIN` / `MEMBER`, 기본값 `MEMBER` |
| `CREATED_AT` | 가입일자 | 기본값 SYSDATE |
| `DELETED_AT` | 탈퇴일자 | nullable |
| `STATUS` | 회원 상태 | `Y` / `N`, 기본값 `Y` |

**제약:** PK(`MEMBER_ID`), UNIQUE(`KAKAO_ID`), CHECK `ROLE`, CHECK `STATUS`

---

### 2. TB_ROOM — 암송방

| 컬럼명 | 역할 | 비고 |
|--------|------|------|
| `ROOM_ID` | 암송방 식별값 | PK |
| `LEADER_ID` | 방장 회원 식별값 | FK → `TB_MEMBER(MEMBER_ID)` |
| `INVITE_CODE` | 초대코드 | UNIQUE |
| `ROOM_NAME` | 암송방 제목 | |
| `MEMBER_LIMIT` | 참여인원 제한 | 최대 20명 |
| `CREATED_AT` | 생성일자 | 기본값 SYSDATE |
| `UPDATED_AT` | 수정일자 | nullable |
| `STATUS` | 방 상태 | `Y` / `N`, 기본값 `Y` |

**제약:** PK, FK(`LEADER_ID`), UNIQUE(`INVITE_CODE`), CHECK `MEMBER_LIMIT BETWEEN 1 AND 20`, CHECK `STATUS`

**비즈니스 규칙:**
- 한 회원은 여러 암송방을 만들 수 있다 (`LEADER_ID`에 UNIQUE 없음).
- 방장은 `TB_ROOM.LEADER_ID`와 `TB_ROOM_MEMBER.ROOM_ROLE = 'LEADER'`로 함께 관리.

**`INVITE_CODE` 생성 규칙 (MVP 확정):**

| 항목 | 규칙 |
|------|------|
| 형식 | 6자리 대문자 영문 + 숫자 조합 |
| 예시 | `A7K3P9` |
| 중복 검증 | 추후 백엔드에서 DB UNIQUE 기준 처리 |
| 프론트 mock | 이미 존재하는 코드인지만 확인 |

> mock data의 기존 코드(`JOHN2026` 등)는 문서 작성 시점 예시이며, 구현 시 6자리 규칙에 맞게 교체한다.

---

### 3. TB_ROOM_MEMBER — 암송방 참여자

| 컬럼명 | 역할 | 비고 |
|--------|------|------|
| `ROOM_ID` | 암송방 식별값 | FK → `TB_ROOM(ROOM_ID)` |
| `MEMBER_ID` | 회원 식별값 | FK → `TB_MEMBER(MEMBER_ID)` |
| `ROOM_ROLE` | 방 안 역할 | `LEADER` / `MEMBER` |
| `CREATED_AT` | 참여일자 | 기본값 SYSDATE |
| `DELETED_AT` | 퇴장일자 | nullable |
| `STATUS` | 참여 상태 | `Y` / `N`, 기본값 `Y` |

**제약:** FK(`ROOM_ID`), FK(`MEMBER_ID`), UNIQUE(`ROOM_ID`, `MEMBER_ID`), CHECK `ROOM_ROLE`, CHECK `STATUS`

**비즈니스 규칙:**
- 한 회원 → 여러 방 참여 가능.
- 한 방 → 여러 회원 참여 가능.
- 같은 회원이 같은 방에 중복 입장 불가.
- 현재 참여 중: `STATUS = 'Y'`.

---

### 4. TB_RECITATION_SECTION — 암송 본문/공지

> 인증 대상 테이블이 **아님**. 방 안 현재/주차별 암송 말씀 표시용.

| 컬럼명 | 역할 | 비고 |
|--------|------|------|
| `SECTION_ID` | 섹션 식별값 | PK |
| `ROOM_ID` | 암송방 식별값 | FK → `TB_ROOM(ROOM_ID)` |
| `SECTION_TITLE` | 섹션 제목 | 예: 요한복음 1장 |
| `WEEKLY_RANGE` | 암송 범위 | 예: 요한복음 1장 1~5절 |
| `RECITATION_TEXT` | 말씀 본문 | CLOB 권장 |
| `DISPLAY_ORDER` | 노출 순서 | 1, 2, 3… |
| `IS_ACTIVE` | 현재 진행 중 여부 | `Y` / `N` |
| `CREATED_AT` | 등록일자 | 기본값 SYSDATE |
| `UPDATED_AT` | 수정일자 | nullable |
| `STATUS` | 섹션 상태 | `Y` / `N`, 기본값 `Y` |

**비즈니스 규칙:**
- 한 방은 여러 섹션 보유 가능.
- 인증 테이블과 **직접 연결 없음**.
- `IS_ACTIVE = 'Y'` 섹션을 현재 진행 말씀으로 표시.

---

### 5. TB_RECITATION_CHECK_IN — 하루 단위 인증 카드

> 실제 녹음/계수기 기록은 저장하지 **않음**. 회원·방·날짜의「인증 카드」.

| 컬럼명 | 역할 | 비고 |
|--------|------|------|
| `CHECK_IN_ID` | 인증 카드 식별값 | PK |
| `ROOM_ID` | 암송방 식별값 | FK → `TB_ROOM(ROOM_ID)` |
| `MEMBER_ID` | 회원 식별값 | FK → `TB_MEMBER(MEMBER_ID)` |
| `CHECK_IN_DATE` | 인증 날짜 | `TRUNC(SYSDATE)` 기준 날짜값 |
| `CREATED_AT` | 최초 인증 시도 시점 | 기본값 SYSDATE |
| `UPDATED_AT` | 상태 변경 시점 | nullable |
| `STATUS` | 인증 카드 요약 상태 | `Y` / `N` |

**제약:** PK, FK, UNIQUE(`ROOM_ID`, `MEMBER_ID`, `CHECK_IN_DATE`), CHECK `STATUS`

**핵심 규칙:**
- Oracle `DATE`는 시/분/초 포함 → `CHECK_IN_DATE`는 **반드시 TRUNC 기준 날짜값**.
- 한 회원·한 방·하루 → **인증 카드 1개**.
- `STATUS = 'Y'` → 유효 detail 1개 이상.
- `STATUS = 'N'` → 유효 detail 0개.
- **row 존재 ≠ 인증 완료.**

---

### 6. TB_RECITATION_CHECK_IN_DETAIL — 실제 인증 기록

| 컬럼명 | 역할 | 비고 |
|--------|------|------|
| `DETAIL_ID` | 인증 상세 식별값 | PK |
| `CHECK_IN_ID` | 부모 인증 카드 | FK → `TB_RECITATION_CHECK_IN(CHECK_IN_ID)` |
| `CHECK_IN_TYPE` | 인증 방식 | `VOICE` / `COUNTER` |
| `AUDIO_URL` | 음성파일 주소 | `VOICE`일 때 |
| `COUNTER_VALUE` | 카운팅 횟수 | `COUNTER`일 때 |
| `CREATED_AT` | 등록 시점 | 기본값 SYSDATE |
| `DELETED_AT` | 취소 시점 | nullable |
| `STATUS` | 상세 기록 상태 | `Y` / `N` |

**비즈니스 규칙:**
- 하나의 `CHECK_IN_ID` 아래 **여러 detail** 가능.
- 하루에 녹음·계수기 **각각 여러 개** 추가 가능.
- 취소: `STATUS = 'N'`, `DELETED_AT = SYSDATE` (물리 삭제 아님).
- detail 추가 시 → 부모 `CHECK_IN.STATUS = 'Y'`.
- detail 취소 후 유효 detail 0개 → 부모 `STATUS = 'N'`.
- detail 취소 후 유효 detail 1개 이상 → 부모 `STATUS = 'Y'` 유지.

---

### 7. TB_RECITATION_AMEN — 아멘 반응

> **detail이 아닌 `CHECK_IN_ID` 기준.**

| 컬럼명 | 역할 | 비고 |
|--------|------|------|
| `AMEN_ID` | 아멘 식별값 | PK |
| `MEMBER_ID` | 아멘을 누른 회원 | FK → `TB_MEMBER(MEMBER_ID)` |
| `CHECK_IN_ID` | 대상 인증 카드 | FK → `TB_RECITATION_CHECK_IN(CHECK_IN_ID)` |
| `CREATED_AT` | 생성일자 | 기본값 SYSDATE |
| `UPDATED_AT` | 취소/재클릭 시점 | nullable |
| `STATUS` | 아멘 상태 | `Y` / `N` |

**제약:** PK, FK, UNIQUE(`MEMBER_ID`, `CHECK_IN_ID`), CHECK `STATUS`

**비즈니스 규칙:**
- 한 회원 → 하나의 인증 카드에 아멘 **1회** (토글).
- 재클릭: `Y` → `N` 취소, `N` → `Y` 재활성화.
- **자기 자신의 인증 카드에는 아멘 불가** (Service 계층 검사).
- 아멘 수: 별도 컬럼 없이 `STATUS = 'Y'` row COUNT.

---

## 핵심 관계 (ER 개요)

```
TB_MEMBER ──┬──< TB_ROOM (LEADER_ID)
            ├──< TB_ROOM_MEMBER >── TB_ROOM
            ├──< TB_RECITATION_CHECK_IN >── TB_ROOM
            └──< TB_RECITATION_AMEN

TB_ROOM ────┬──< TB_RECITATION_SECTION
            └──< TB_RECITATION_CHECK_IN

TB_RECITATION_CHECK_IN ──< TB_RECITATION_CHECK_IN_DETAIL
TB_RECITATION_CHECK_IN ──< TB_RECITATION_AMEN
```

| 관계 | 카디널리티 | 비고 |
|------|-----------|------|
| MEMBER ↔ ROOM | N:M | `TB_ROOM_MEMBER` 경유 |
| ROOM → SECTION | 1:N | 인증 테이블과 무관 |
| ROOM + MEMBER + DATE → CHECK_IN | 1:1 | UNIQUE 제약 |
| CHECK_IN → DETAIL | 1:N | |
| CHECK_IN → AMEN | 1:N | |
| MEMBER + CHECK_IN → AMEN | 1:1 | UNIQUE 제약 |

---

## 중복 방지 기준

| 대상 | 제약/규칙 |
|------|-----------|
| 카카오 계정 | `TB_MEMBER.KAKAO_ID` UNIQUE |
| 초대코드 | `TB_ROOM.INVITE_CODE` UNIQUE |
| 방 중복 참여 | `TB_ROOM_MEMBER (ROOM_ID, MEMBER_ID)` UNIQUE |
| 하루 인증 카드 | `TB_RECITATION_CHECK_IN (ROOM_ID, MEMBER_ID, CHECK_IN_DATE)` UNIQUE |
| 아멘 | `TB_RECITATION_AMEN (MEMBER_ID, CHECK_IN_ID)` UNIQUE |

---

## 인증 완료 판단 기준

### 오늘 내 인증 완료 여부

```sql
SELECT STATUS
FROM TB_RECITATION_CHECK_IN
WHERE ROOM_ID = :roomId
  AND MEMBER_ID = :memberId
  AND CHECK_IN_DATE = TRUNC(SYSDATE);
```

| 조회 결과 | UI 표시 |
|-----------|---------|
| row 없음 | **미완료** |
| `STATUS = 'N'` | **미완료** |
| `STATUS = 'Y'` | **완료** |

### 원칙

1. `CHECK_IN` row 존재만으로 완료 판단 **하지 않음**.
2. 해당 `CHECK_IN_ID` 아래 `STATUS = 'Y'`인 detail **1개 이상** → 완료.
3. UI 빠른 조회용으로 `TB_RECITATION_CHECK_IN.STATUS` 사용.
4. detail 추가/취소 시 부모 `STATUS` **함께 갱신** (트랜잭션).

### 피드 노출 기준 (MVP 확정)

인증 피드 조회 시 **`CI.STATUS = 'Y'` AND `D.STATUS = 'Y'`**인 row만 표시한다.

| 구분 | 피드 노출 | 용도 |
|------|-----------|------|
| `CHECK_IN.STATUS = 'Y'` | **노출** | 유효 detail 1개 이상 |
| `CHECK_IN.STATUS = 'N'` | **미노출** | 오늘 인증 미완료 표시·내부 상태 관리용 |

**원칙:**
- `STATUS = 'N'` 카드는 피드에 보여주지 않는다.
- 사용자가 녹음/계수기를 시도했지만 유효 detail이 없는 상태는 **「인증 완료」로 표시하면 안 된다.**
- 오늘 인증 완료/미완료는 **홈·방 상세의 오늘 상태 영역**에서만 `TB_RECITATION_CHECK_IN.STATUS`로 판단한다.

### 피드 정렬 (MVP 확정)

| 정렬 단위 | 규칙 |
|-----------|------|
| 날짜 | **최신 날짜가 위** (내림차순) |
| 같은 날짜 내 | MVP mock 기준 자연스러운 표시 (인증 시간 빠른 순 또는 최근 detail 기준 가능) |
| 복잡한 정렬 | 추후 백엔드 API 명세에서 확정 |

---

## 아멘 처리 기준

1. 대상: **`CHECK_IN_ID`** (detail 아님).
2. 토글: 없으면 INSERT `STATUS='Y'`, 있으면 `Y↔N` 전환.
3. 본인 카드: `CHECK_IN.MEMBER_ID === 현재 로그인 MEMBER_ID` → **불가**.
4. 아멘 수: `COUNT(*) WHERE CHECK_IN_ID = :id AND STATUS = 'Y'`.
5. UI: `isAmenedByMe` — 현재 사용자의 해당 CHECK_IN에 대한 `STATUS = 'Y'` row 존재 여부.

---

## 화면별 데이터 ↔ 테이블 매핑

| 화면/UI 요소 | 기준 테이블·컬럼 |
|--------------|------------------|
| 로그인 사용자 정보 | `TB_MEMBER` |
| 내 암송방 목록 | `TB_ROOM` + `TB_ROOM_MEMBER` (참여 `STATUS='Y'`) |
| 방 제목·초대코드 | `TB_ROOM` |
| 방 참여자 수/목록 | `TB_ROOM_MEMBER` + `TB_MEMBER` |
| 현재 암송 말씀 | `TB_RECITATION_SECTION` (`IS_ACTIVE='Y'`, `STATUS='Y'`) |
| 오늘 인증 완료/미완료 | `TB_RECITATION_CHECK_IN.STATUS` (오늘 날짜) |
| 날짜 구분선 | `TB_RECITATION_CHECK_IN.CHECK_IN_DATE` |
| 사람별 인증 카드 | `TB_RECITATION_CHECK_IN.CHECK_IN_ID` + `TB_MEMBER` |
| 카드 내 녹음/계수기 목록 | `TB_RECITATION_CHECK_IN_DETAIL` (`STATUS='Y'`) |
| 아멘 수·내 아멘 여부 | `TB_RECITATION_AMEN` |
| 방 참여율 (MVP 이후) | `TB_RECITATION_CHECK_IN` + `TB_ROOM_MEMBER` |

### 피드 API 응답 구조 (명세 예시)

```json
[
  {
    "checkInDate": "2026-06-13",
    "checkIns": [
      {
        "checkInId": 1,
        "memberId": 1,
        "memberName": "김윤기",
        "profileImg": "kakao.cloud",
        "amenCount": 3,
        "isAmenedByMe": false,
        "details": [
          {
            "detailId": 1,
            "checkInType": "VOICE",
            "audioUrl": "audio1.mp3",
            "counterValue": null,
            "createdAt": "2026-06-13 09:12:00"
          }
        ]
      }
    ]
  }
]
```

---

## 트랜잭션 필수 로직

| 작업 | 트랜잭션 내 처리 |
|------|------------------|
| 인증 전송 | CHECK_IN 조회/생성 → DETAIL INSERT → 부모 STATUS='Y' |
| 인증 취소 | DETAIL STATUS='N' → 유효 detail 수 확인 → 부모 STATUS 갱신 |
| 아멘 토글 | 본인 카드 검사 → AMEN INSERT 또는 STATUS 토글 |

---

## MVP 이후 통계 (별도 테이블 없음)

원본 테이블에서 계산:

- 개인 이번 달 인증일 수
- 개인 연속 인증일 수
- 방 오늘/최근 7일 참여율
- 회원별 인증 횟수

**주의:** detail row 수가 아닌 **`TB_RECITATION_CHECK_IN.STATUS = 'Y'`** 기준.  
방 참여자 수: **`TB_ROOM_MEMBER.STATUS = 'Y'`** 기준.
