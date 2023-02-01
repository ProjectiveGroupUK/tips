import { Navigate, useRoutes } from 'react-router-dom';
// auth
import AuthGuard from '../auth/AuthGuard';
import GuestGuard from '../auth/GuestGuard';
// layouts
// import MainLayout from '../layouts/main';
// import SimpleLayout from '../layouts/simple';
import CompactLayout from '../layouts/compact';
import DashboardLayout from '../layouts/dashboard';
// config
import { PATH_AFTER_LOGIN } from '../config';
//
import {
  // Auth
  LoginPage,
  // RegisterPage,
  // VerifyCodePage,
  NewPasswordPage,
  ResetPasswordPage,
  // Dashboard: Main
  MainDashboardPage,
  // Management: User
  UserListPage,
  UserEditPage,
  UserCreatePage,
  UserProfilePage,
  // Management: Company
  CompanyListPage,
  CompanyEditPage,
  CompanyCreatePage,
  Page404,
} from './elements';

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    // Auth
    {
      path: 'auth',
      children: [
        {
          path: 'login',
          element: (
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          ),
        },
        // {
        //   path: 'register',
        //   element: (
        //     <GuestGuard>
        //       <RegisterPage />
        //     </GuestGuard>
        //   ),
        // },
        // { path: 'login-unprotected', element: <LoginPage /> },
        // { path: 'register-unprotected', element: <RegisterPage /> },
        {
          element: <CompactLayout />,
          children: [
            { path: 'reset-password', element: <ResetPasswordPage /> },
            { path: 'new-password', element: <NewPasswordPage /> },
            // { path: 'verify', element: <VerifyCodePage /> },
          ],
        },
      ],
    },

    // Dashboard
    {
      path: 'dashboard',
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        { element: <Navigate to={PATH_AFTER_LOGIN} replace />, index: true },
        { path: 'main', element: <MainDashboardPage /> },
        {
          path: 'user',
          children: [
            { element: <Navigate to="/dashboard/user/profile" replace />, index: true },
            { path: 'list', element: <UserListPage /> },
            { path: 'add', element: <UserCreatePage /> },
            { path: ':id/edit', element: <UserEditPage /> },
            { path: 'profile', element: <UserProfilePage /> },
          ],
        },
        {
          path: 'company',
          children: [
            { element: <Navigate to="/dashboard/user/profile" replace />, index: true },
            { path: 'list', element: <UserListPage /> },
            { path: 'add', element: <UserCreatePage /> },
            { path: ':id/edit', element: <UserEditPage /> },
            { path: 'profile', element: <UserProfilePage /> },
          ],
        },
      ],
    },
    // Management
    {
      path: 'management',
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        { element: <Navigate to="/management/user" replace />, index: true },
        {
          path: 'user',
          children: [
            { element: <Navigate to="/management/user/list" replace />, index: true },
            { path: 'list', element: <UserListPage /> },
            { path: 'add', element: <UserCreatePage /> },
            { path: ':id/edit', element: <UserEditPage /> },
            { path: 'profile', element: <UserProfilePage /> },
          ],
        },
        {
          path: 'company',
          children: [
            { element: <Navigate to="/management/company/list" replace />, index: true },
            { path: 'list', element: <CompanyListPage /> },
            { path: 'add', element: <CompanyCreatePage /> },
            { path: ':id/edit', element: <CompanyEditPage /> },
          ],
        },
      ],
    },
    {
      element: <CompactLayout />,
      children: [
        // { path: 'coming-soon', element: <ComingSoonPage /> },
        // { path: 'maintenance', element: <MaintenancePage /> },
        // { path: '500', element: <Page500 /> },
        { path: '404', element: <Page404 /> },
        // { path: '403', element: <Page403 /> },
      ],
    },    
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
