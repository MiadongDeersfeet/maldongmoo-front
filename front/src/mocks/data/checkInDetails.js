/** @see docs/MOCK_DATA_GUIDE.md — TB_RECITATION_CHECK_IN_DETAIL seed */
export const seedCheckInDetails = [
  { detailId: 1, checkInId: 1, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio1.mp3', counterValue: null, createdAt: '2026-06-12 08:10:00', deletedAt: null, status: 'Y' },
  { detailId: 2, checkInId: 2, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio2.mp3', counterValue: null, createdAt: '2026-06-12 09:20:00', deletedAt: null, status: 'Y' },
  { detailId: 3, checkInId: 3, checkInType: 'COUNTER', audioUrl: null, counterValue: 5, createdAt: '2026-06-12 07:35:00', deletedAt: '2026-06-12 20:00:00', status: 'N' },
  { detailId: 4, checkInId: 4, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio3.mp3', counterValue: null, createdAt: '2026-06-13 09:12:00', deletedAt: null, status: 'Y' },
  { detailId: 5, checkInId: 4, checkInType: 'COUNTER', audioUrl: null, counterValue: 10, createdAt: '2026-06-13 09:30:00', deletedAt: null, status: 'Y' },
  { detailId: 6, checkInId: 5, checkInType: 'VOICE', audioUrl: 'https://storage.example/audio4.mp3', counterValue: null, createdAt: '2026-06-13 10:05:00', deletedAt: null, status: 'Y' },
  { detailId: 7, checkInId: 6, checkInType: 'COUNTER', audioUrl: null, counterValue: 3, createdAt: '2026-06-13 08:45:00', deletedAt: null, status: 'Y' },
];
