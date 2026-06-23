import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthGuard from '@/components/layout/AuthGuard.jsx';
import GuestOnly from '@/components/layout/GuestOnly.jsx';
import LandingPage from '@/pages/landing/LandingPage.jsx';
import LoginPage from '@/pages/login/LoginPage.jsx';
import HomePage from '@/pages/home/HomePage.jsx';
import CreateRoomPage from '@/pages/rooms/CreateRoomPage.jsx';
import JoinRoomPage from '@/pages/rooms/JoinRoomPage.jsx';
import RoomDetailPage from '@/pages/rooms/RoomDetailPage.jsx';
import VoiceCheckInPage from '@/pages/rooms/VoiceCheckInPage.jsx';
import CounterCheckInPage from '@/pages/rooms/CounterCheckInPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <GuestOnly>
        <LandingPage />
      </GuestOnly>
    ),
  },
  {
    path: '/onboarding/name',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: '/home',
    element: (
      <AuthGuard>
        <HomePage />
      </AuthGuard>
    ),
  },
  {
    path: '/rooms/new',
    element: (
      <AuthGuard>
        <CreateRoomPage />
      </AuthGuard>
    ),
  },
  {
    path: '/rooms/join',
    element: (
      <AuthGuard>
        <JoinRoomPage />
      </AuthGuard>
    ),
  },
  {
    path: '/rooms/:roomId',
    element: (
      <AuthGuard>
        <RoomDetailPage />
      </AuthGuard>
    ),
  },
  {
    path: '/rooms/:roomId/check-in/voice',
    element: (
      <AuthGuard>
        <VoiceCheckInPage />
      </AuthGuard>
    ),
  },
  {
    path: '/rooms/:roomId/check-in/counter',
    element: (
      <AuthGuard>
        <CounterCheckInPage />
      </AuthGuard>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
