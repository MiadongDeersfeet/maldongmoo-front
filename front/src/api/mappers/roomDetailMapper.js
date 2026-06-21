export function mapRoomDetail(apiRoom) {
  return {
    roomId: apiRoom.roomId,
    leaderId: apiRoom.leaderId,
    inviteCode: apiRoom.inviteCode ?? null,
    roomName: apiRoom.roomName,
    memberLimit: apiRoom.memberLimit ?? 0,
    memberCount: apiRoom.memberCount ?? 0,
    createdAt: apiRoom.createdAt,
    status: 'Y',
    myRole: apiRoom.myRole,
  };
}

export function mapRoomMembers(apiMembers = []) {
  return apiMembers.map((member) => ({
    memberId: member.memberId,
    name: member.memberName,
    memberName: member.memberName,
    profileImg: member.profileImageUrl ?? null,
    profileImageUrl: member.profileImageUrl ?? null,
    roomRole: member.roomRole,
    joinedAt: member.joinedAt,
  }));
}

export function mapActiveSection(apiSections = []) {
  const sections = Array.isArray(apiSections) ? apiSections : [];
  const activeSection =
    sections.find((section) => section.isActive === 'Y') || sections[0] || null;

  if (!activeSection) {
    return null;
  }

  const content = activeSection.sectionContent ?? '';

  return {
    sectionId: activeSection.sectionId,
    roomId: activeSection.roomId,
    sectionTitle: activeSection.sectionTitle ?? '',
    weeklyRange: activeSection.sectionRange ?? '',
    sectionRange: activeSection.sectionRange ?? '',
    recitationText: content,
    sectionContent: content,
    displayOrder: activeSection.displayOrder,
    isActive: activeSection.isActive,
    createdAt: activeSection.createdAt,
    updatedAt: activeSection.updatedAt,
  };
}

const DEFAULT_SECTION_TITLE = '암송 본문';
const DEFAULT_SECTION_RANGE = '-';

export function buildCreateSectionPayload(sectionContent) {
  return {
    sectionTitle: DEFAULT_SECTION_TITLE,
    sectionRange: DEFAULT_SECTION_RANGE,
    sectionContent: sectionContent.trim(),
  };
}

export function buildUpdateSectionPayload(section, sectionContent) {
  return {
    sectionTitle: section?.sectionTitle?.trim() || DEFAULT_SECTION_TITLE,
    sectionRange:
      section?.sectionRange?.trim() || section?.weeklyRange?.trim() || DEFAULT_SECTION_RANGE,
    sectionContent: sectionContent.trim(),
    isActive: section?.isActive ?? 'Y',
    displayOrder: section?.displayOrder,
  };
}

export function mapCheckInFeedToGroupedFeed(apiFeed = []) {
  const feed = Array.isArray(apiFeed) ? apiFeed : [];

  const cards = feed
    .map((item) => {
      const details = (item.details ?? [])
        .map((detail) => ({
          detailId: detail.checkInDetailId,
          checkInDetailId: detail.checkInDetailId,
          checkInType: detail.certType,
          certType: detail.certType,
          audioUrl: detail.voiceFileUrl,
          voiceFileUrl: detail.voiceFileUrl,
          counterValue: detail.counterCount,
          counterCount: detail.counterCount,
          createdAt: detail.createdAt,
        }))
        .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));

      const latestDetail = details[details.length - 1];

      return {
        checkInId: item.checkInId,
        memberId: item.memberId,
        memberName: item.memberName,
        profileImg: item.profileImageUrl,
        profileImageUrl: item.profileImageUrl,
        amenCount: item.amenCount ?? 0,
        isAmenedByMe: item.amenedByMe === true,
        amenedByMe: item.amenedByMe === true,
        details,
        checkInDate: item.checkInDate,
        createdAt: item.createdAt,
        sortTime: latestDetail?.createdAt ?? item.createdAt ?? '',
      };
    })
    .filter((card) => card.details.length > 0);

  const grouped = cards.reduce((acc, card) => {
    const date = card.checkInDate;
    if (!date) return acc;

    if (!acc[date]) {
      acc[date] = {
        checkInDate: date,
        checkIns: [],
      };
    }

    acc[date].checkIns.push(card);
    return acc;
  }, {});

  return Object.values(grouped)
    .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
    .map((day) => ({
      ...day,
      checkIns: day.checkIns.sort((a, b) => a.sortTime.localeCompare(b.sortTime)),
    }));
}

export function buildTodayDashboardFromMembersAndFeed({
  members = [],
  memberCount = 0,
  todayFeed = [],
  todayCheckIn = null,
}) {
  const feed = Array.isArray(todayFeed) ? todayFeed : [];
  const completedMemberIds = new Set(
    feed.filter((item) => item.status === 'Y').map((item) => item.memberId),
  );

  const toBarMember = ({ memberId, name, profileImg }) => ({
    memberId,
    name,
    profileImg,
  });

  const completedMembers = members
    .filter((member) => completedMemberIds.has(member.memberId))
    .map(toBarMember);

  const pendingMembers = members
    .filter((member) => !completedMemberIds.has(member.memberId))
    .map(toBarMember);

  const checkedIn =
    todayCheckIn?.checkedIn === true || todayCheckIn?.status === 'Y';

  return {
    todayCompletedCount: completedMembers.length,
    totalMemberCount: memberCount || members.length,
    myStatus: checkedIn ? 'Y' : null,
    todayAmenCount: 0,
    completedMembers,
    pendingMembers,
    myCheckInId: todayCheckIn?.checkInId ?? null,
    myTodayCheckIn: todayCheckIn ?? null,
  };
}

export function mergeTodayCheckInToDashboard(baseDashboard, todayCheckIn) {
  if (!baseDashboard) {
    return baseDashboard;
  }

  if (!todayCheckIn) {
    return baseDashboard;
  }

  const checkedIn =
    todayCheckIn.checkedIn === true || todayCheckIn.status === 'Y';

  return {
    ...baseDashboard,
    myStatus: checkedIn ? 'Y' : null,
    myCheckInId: todayCheckIn.checkInId ?? null,
    myTodayCheckIn: todayCheckIn,
  };
}

export function buildInitialTodayDashboard({ members = [], memberCount = 0 }) {
  const pendingMembers = members.map(({ memberId, name, profileImg }) => ({
    memberId,
    name,
    profileImg,
  }));

  const totalMemberCount = memberCount || pendingMembers.length;

  return {
    todayCompletedCount: 0,
    totalMemberCount,
    myStatus: null,
    todayAmenCount: 0,
    completedMembers: [],
    pendingMembers,
  };
}
