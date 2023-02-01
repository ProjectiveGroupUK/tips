import { Suspense, lazy } from 'react';
// components
import LoadingScreen from '../components/loading-screen';

// ----------------------------------------------------------------------

const Loadable = (Component) => (props) =>
  (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  );

// ----------------------------------------------------------------------

// AUTH
export const LoginPage = Loadable(lazy(() => import('../pages/auth/LoginPage')));
// export const RegisterPage = Loadable(lazy(() => import('../pages/auth/RegisterPage')));
// export const VerifyCodePage = Loadable(lazy(() => import('../pages/auth/VerifyCodePage')));
export const NewPasswordPage = Loadable(lazy(() => import('../pages/auth/NewPasswordPage')));
export const ResetPasswordPage = Loadable(lazy(() => import('../pages/auth/ResetPasswordPage')));

// DASHBOARD: GENERAL
export const MainDashboardPage = Loadable(lazy(() => import('../pages/dashboard/MainDashboardPage')));

// MANAGEMENT: USER
export const UserProfilePage = Loadable(lazy(() => import('../pages/management/user/UserProfilePage')));
export const UserListPage = Loadable(lazy(() => import('../pages/management/user/UserListPage')));
export const UserCreatePage = Loadable(lazy(() => import('../pages/management/user/UserCreatePage')));
export const UserEditPage = Loadable(lazy(() => import('../pages/management/user/UserEditPage')));
// MANAGEMENT: COMPANY
export const CompanyListPage = Loadable(lazy(() => import('../pages/management/company/ListPage')));
export const CompanyCreatePage = Loadable(lazy(() => import('../pages/management/company/CreatePage')));
export const CompanyEditPage = Loadable(lazy(() => import('../pages/management/company/EditPage')));

export const Page404 = Loadable(lazy(() => import('../pages/Page404')));


