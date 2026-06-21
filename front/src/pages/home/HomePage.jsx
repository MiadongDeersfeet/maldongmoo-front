import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen } from 'lucide-react';
import BottomNavigation from '@/components/home/BottomNavigation.jsx';
import HomeHeader from '@/components/home/HomeHeader.jsx';
import QuickActionGrid from '@/components/home/QuickActionGrid.jsx';
import RoomListHeader from '@/components/home/RoomListHeader.jsx';
import TodayDashboardCard from '@/components/home/TodayDashboardCard.jsx';
import RoomCard from '@/components/room/RoomCard.jsx';
import EmptyStateCard from '@/components/ui/EmptyStateCard.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { buildHomeDashboard, mapMyRoomToRoomCardData } from '@/api/mappers/homeDashboardMapper.js';
import { mapRoomMembers } from '@/api/mappers/roomDetailMapper.js';
import { getMyRooms, getRoomMembers } from '@/api/roomApi.js';
import { ApiError } from '@/api/apiClient.js';
import './HomePage.css';

function getRoomsErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return '암송방 목록을 불러오지 못했습니다.';
}

export default function HomePage() {
  const navigate = useNavigate();
  const { member, logout, refreshSession } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);

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
              const members = await getRoomMembers(room.roomId);
              const participants = mapRoomMembers(members)
                .slice(0, 4)
                .map(({ memberId, name, profileImg }) => ({ memberId, name, profileImg }));
              return mapMyRoomToRoomCardData(room, { participants });
            } catch {
              return mapMyRoomToRoomCardData(room);
            }
          }),
        );

        setDashboard({
          ...buildHomeDashboard([]),
          rooms,
          totalRoomCount: rooms.length,
          pendingRoomCount: rooms.length,
        });
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
        setDashboard(buildHomeDashboard([]));
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
  }, [member, refreshSession]);

  const hasRooms = dashboard && dashboard.totalRoomCount > 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-page">
      <div className="app-shell home-shell">
        <HomeHeader onLogout={handleLogout} />

        <div className="home-body">
          <div className="home-top-panel">
            <TodayDashboardCard
              name={member?.name}
              profileImg={member?.profileImg}
              dashboard={dashboard}
            />
            <QuickActionGrid />
            {hasRooms && <RoomListHeader />}
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
                {dashboard.rooms.map((roomData) => (
                  <RoomCard key={roomData.room.roomId} roomData={roomData} />
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

        <BottomNavigation />
      </div>
    </div>
  );
}
