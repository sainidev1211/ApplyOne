/** The single operational admin account is never managed as a candidate. */
export const PROTECTED_ADMIN_EMAIL = 'admin@applyone.co';

export function isProtectedAdminAccount(user: { email?: string | null }): boolean {
  return user.email?.trim().toLowerCase() === PROTECTED_ADMIN_EMAIL;
}
