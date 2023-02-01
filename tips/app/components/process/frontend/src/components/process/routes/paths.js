// ----------------------------------------------------------------------

function path(root, sublink) {
  return `${root}${sublink}`;
}

export const ROOTS_AUTH = '/auth';
export const ROOTS_DASHBOARD = '/dashboard';
export const ROOTS_MANAGEMENT = '/management';

// ----------------------------------------------------------------------

export const PATH_AUTH = {
  root: ROOTS_AUTH,
  login: path(ROOTS_AUTH, '/login'),
  register: path(ROOTS_AUTH, '/register'),
  loginUnprotected: path(ROOTS_AUTH, '/login-unprotected'),
  registerUnprotected: path(ROOTS_AUTH, '/register-unprotected'),
  verify: path(ROOTS_AUTH, '/verify'),
  resetPassword: path(ROOTS_AUTH, '/reset-password'),
  newPassword: path(ROOTS_AUTH, '/new-password'),
};

export const PATH_PAGE = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  pricing: '/pricing',
  payment: '/payment',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/403',
  page404: '/404',
  page500: '/500',
  components: '/components',
};

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  permissionDenied: path(ROOTS_DASHBOARD, '/permission-denied'),
  // blank: path(ROOTS_DASHBOARD, '/blank'),
  general: {
    main: path(ROOTS_DASHBOARD, '/main'),
  },
};

export const PATH_MANAGEMENT = {
  root: ROOTS_MANAGEMENT,
  permissionDenied: path(ROOTS_MANAGEMENT, '/permission-denied'),
  // blank: path(ROOTS_DASHBOARD, '/blank'),
  user: {
    root: path(ROOTS_MANAGEMENT, '/user'),
    add: path(ROOTS_MANAGEMENT, '/user/add'),
    list: path(ROOTS_MANAGEMENT, '/user/list'),
    profile: path(ROOTS_MANAGEMENT, '/user/profile'),
    edit: (id) => path(ROOTS_MANAGEMENT, `/user/${id}/edit`),
  },
  company: {
    root: path(ROOTS_MANAGEMENT, '/company'),
    add: path(ROOTS_MANAGEMENT, '/company/add'),
    list: path(ROOTS_MANAGEMENT, '/company/list'),
    edit: (id) => path(ROOTS_MANAGEMENT, `/company/${id}/edit`),
  },
};
