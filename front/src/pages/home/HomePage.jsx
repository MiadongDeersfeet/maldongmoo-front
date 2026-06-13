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
import { getHomeDashboard } from '@/mocks/index.js';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { member, logout } = useAuth();
  const dashboard = member ? getHomeDashboard(member.memberId) : null;
  const hasRooms = dashboard && dashboard.totalRoomCount > 0;

  const handleLogout = () => {
    logout();
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
            {hasRooms ? (
              <div className="home-room-list">
                {dashboard.rooms.map((roomData) => (
                  <RoomCard key={roomData.room.roomId} roomData={roomData} />
                ))}
              </div>
            ) : (
              <EmptyStateCard
                icon={DoorOpen}
                title="아직 참여 중인 암송방이 없습니다."
                description="암송방을 만들거나 초대코드로 입장해보세요."
              />
            )}
          </div>
        </div>

        <BottomNavigation />
      </div>
    </div>
  );
}
