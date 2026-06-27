import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DoorOpen } from 'lucide-react';
import BottomNavigation from '@/components/home/BottomNavigation.jsx';
import HomeHeader from '@/components/home/HomeHeader.jsx';
import QuickActionGrid from '@/components/home/QuickActionGrid.jsx';
import RoomListHeader from '@/components/home/RoomListHeader.jsx';
import TodayDashboardCard from '@/components/home/TodayDashboardCard.jsx';
import RoomCard from '@/components/room/RoomCard.jsx';
import EmptyStateCard from '@/components/ui/EmptyStateCard.jsx';
import ComingSoonModal from '@/components/ui/ComingSoonModal.jsx';
import FadeToast from '@/components/ui/FadeToast.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { usePushNotificationToggle } from '@/hooks/usePushNotificationToggle.js';
import { useHomeRoomsSocket } from '@/hooks/useHomeRoomsSocket.js';
import { buildHomeDashboardFromRooms, mapMyRoomToRoomCardData, isTodayCheckInCompleted } from '@/api/mappers/homeDashboardMapper.js';
import { mapRoomMembers } from '@/api/mappers/roomDetailMapper.js';
import { getTodayCheckIn } from '@/api/recitationApi.js';
import { getMyRooms, getRoomMembers } from '@/api/roomApi.js';
import { ApiError } from '@/api/apiClient.js';
import { HOME_COMING_SOON_FEATURES, getStoredHomeRoomSortOrder, saveHomeRoomSortOrder, sortHomeRooms } from '@/utils/homeRoomSort.js';
import './HomePage.css';

function getRoomsErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return '암송방 목록을 불러오지 못했습니다.';
}

const HOME_COMING_SOON_TABS = HOME_COMING_SOON_FEATURES;

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { member, logout, refreshSession } = useAuth();
  const pushToggle = usePushNotificationToggle(Boolean(member));
  const [dashboard, setDashboard] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const [inviteCopyToast, setInviteCopyToast] = useState(null);
  const [comingSoonModal, setComingSoonModal] = useState({
    open: false,
    featureName: '',
    description: '',
  });
  const [roomSortOrder, setRoomSortOrder] = useState(getStoredHomeRoomSortOrder);

  useEffect(() => {
    let ignore = false;

    async function loadRooms() {
      if (!member) {
        setDashboard(null);
        setRoomsError(null);
        setRoomsLoading(false);
        return;
      }

      setRoomsLoading(true);
      setRoomsError(null);

      try {
        const apiRooms = await getMyRooms();
        if (ignore) return;

        const rooms = await Promise.all(
          apiRooms.map(async (room) => {
            try {
              const [members, todayCheckIn] = await Promise.all([
                getRoomMembers(room.roomId).catch(() => []),
                getTodayCheckIn(room.roomId).catch(() => null),
              ]);
              const participants = mapRoomMembers(members)
                .slice(0, 4)
                .map(({ memberId, name, profileImg }) => ({ memberId, name, profileImg }));

              return mapMyRoomToRoomCardData(room, {
                participants,
                isTodayCompleted: isTodayCheckInCompleted(todayCheckIn),
              });
            } catch {
              return mapMyRoomToRoomCardData(room);
            }
          }),
        );

        setDashboard(buildHomeDashboardFromRooms(rooms));
      } catch (error) {
        if (ignore) return;

        if (error instanceof ApiError && error.isUnauthorized) {
          setDashboard(null);
          setRoomsError(null);

          try {
            const refreshedMember = await refreshSession();
            if (ignore) return;

            if (refreshedMember) {
              setRoomsError('암송방 목록을 불러오지 못했습니다.');
            }
          } catch {
            // Non-401 refresh errors are stored on AuthProvider.
          }
          return;
        }

        setRoomsError(getRoomsErrorMessage(error));
        setDashboard(buildHomeDashboardFromRooms([]));
      } finally {
        if (!ignore) {
          setRoomsLoading(false);
        }
      }
    }

    loadRooms();

    return () => {
      ignore = true;
    };
  }, [member, refreshSession, location.key, location.pathname]);

  const hasRooms = dashboard && dashboard.totalRoomCount > 0;
  const roomIds = useMemo(
    () => (dashboard?.rooms ?? []).map((roomData) => roomData.room.roomId),
    [dashboard?.rooms],
  );
  const sortedRooms = useMemo(
    () => sortHomeRooms(dashboard?.rooms ?? [], roomSortOrder),
    [dashboard?.rooms, roomSortOrder],
  );

  const handleRoomActivity = useCallback((roomId) => {
    setDashboard((prev) => {
      if (!prev) {
        return prev;
      }

      const rooms = prev.rooms.map((roomData) => (
        roomData.room.roomId === roomId
          ? { ...roomData, hasNewActivity: true }
          : roomData
      ));

      return { ...prev, rooms };
    });
  }, []);

  useHomeRoomsSocket(roomIds, {
    enabled: Boolean(member && hasRooms && !roomsLoading),
    currentMemberId: member?.memberId ?? null,
    onRoomActivity: handleRoomActivity,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleInviteCopySuccess = () => {
    setInviteCopyToast({ id: Date.now() });
  };

  const handleSortOrderChange = useCallback((nextSortOrder) => {
    setRoomSortOrder(nextSortOrder);
    saveHomeRoomSortOrder(nextSortOrder);
  }, []);

  const handleBottomNavClick = (tabId) => {
    const feature = HOME_COMING_SOON_TABS[tabId];
    if (!feature) {
      return;
    }

    setComingSoonModal({
      open: true,
      featureName: feature.featureName,
      description: feature.description,
    });
  };

  const handleCloseComingSoonModal = () => {
    setComingSoonModal((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="app-page">
      <div className="app-shell home-shell">
        <HomeHeader
          onLogout={handleLogout}
          pushToggle={{
            available: pushToggle.available,
            paused: pushToggle.paused,
            loading: pushToggle.loading,
            onToggle: pushToggle.toggle,
          }}
        />

        <div className="home-body">
          <div className="home-top-panel">
            <TodayDashboardCard
              name={member?.name}
              profileImg={member?.profileImg}
              dashboard={dashboard}
            />
            <QuickActionGrid />
            {hasRooms && (
              <RoomListHeader
                sortOrder={roomSortOrder}
                onSortOrderChange={handleSortOrderChange}
              />
            )}
          </div>

          <div className="home-room-list-scroll scrollbar-soft">
            {roomsLoading ? (
              <div className="page-placeholder">
                <p>불러오는 중...</p>
              </div>
            ) : roomsError ? (
              <div className="page-placeholder">
                <p role="alert">{roomsError}</p>
              </div>
            ) : hasRooms ? (
              <div className="home-room-list">
                {sortedRooms.map((roomData) => (
                  <RoomCard
                    key={roomData.room.roomId}
                    roomData={roomData}
                    hasNewActivity={roomData.hasNewActivity}
                    onInviteCopySuccess={handleInviteCopySuccess}
                  />
                ))}
              </div>
            ) : dashboard !== null ? (
              <EmptyStateCard
                icon={DoorOpen}
                title="아직 참여 중인 암송방이 없습니다."
                description="암송방을 만들거나 초대코드로 입장해보세요."
              />
            ) : (
              <div className="page-placeholder">
                <p>불러오는 중...</p>
              </div>
            )}
          </div>
        </div>

        <BottomNavigation activeId="home" onTabClick={handleBottomNavClick} />

        {inviteCopyToast && (
          <FadeToast
            key={inviteCopyToast.id}
            message="초대코드가 복사되었습니다."
            onDone={() => setInviteCopyToast(null)}
          />
        )}

        {pushToggle.error && (
          <FadeToast
            key={pushToggle.error}
            message={pushToggle.error}
            onDone={pushToggle.clearError}
          />
        )}

        <ComingSoonModal
          isOpen={comingSoonModal.open}
          onClose={handleCloseComingSoonModal}
          featureName={comingSoonModal.featureName}
          description={comingSoonModal.description}
        />
      </div>
    </div>
  );
}
