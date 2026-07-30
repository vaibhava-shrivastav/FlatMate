export const ROLES = {
  SEARCHING_ROOM: 'searching',
  HAS_ROOM: 'hosting',
  ADMIN: 'admin',
};

export const PERMISSIONS = {
  VIEW_LISTINGS: 'view_listings',
  POST_LISTING: 'post_listing',
  MANAGE_USERS: 'manage_users',
};

const ROLE_PERMISSIONS = {
  [ROLES.SEARCHING_ROOM]: [PERMISSIONS.VIEW_LISTINGS],
  [ROLES.HAS_ROOM]: [PERMISSIONS.VIEW_LISTINGS, PERMISSIONS.POST_LISTING],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role, permission) {
  return getRolePermissions(role).includes(permission);
}

export function isAdmin(role) {
  return role === ROLES.ADMIN;
}

export function resolveApiError(error) {
  if (!error.response) return 'Unable to connect. Check your internet connection.';
  const { status, data } = error.response;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 409) return 'An account with this email already exists.';
  if (status === 500) return 'Server error. Please try again later.';
  return data?.message || 'Something went wrong. Please try again.';
}
