import { ROLES, type Role } from "./constants";

export function isSystemAdmin(role: string) {
  return role === ROLES.SYSTEM_ADMIN;
}

export function isMerchantAdmin(role: string) {
  return role === ROLES.MERCHANT_ADMIN;
}

export function isClassroomAdmin(role: string) {
  return role === ROLES.CLASSROOM_ADMIN;
}

export function canManageVenue(role: string, userVenueId: string | null, venueId: string) {
  if (role === ROLES.SYSTEM_ADMIN) return true;
  if (role === ROLES.MERCHANT_ADMIN && userVenueId === venueId) return true;
  return false;
}

export function canManageClassroom(role: string, userClassroomId: string | null, classroomId: string) {
  if (role === ROLES.SYSTEM_ADMIN) return true;
  if (role === ROLES.CLASSROOM_ADMIN && userClassroomId === classroomId) return true;
  return false;
}

export function canViewPersonalData(role: string, classroomId: string | null, targetClassroomId: string) {
  // Personal data (id number, insurance) only visible to classroom admin of same classroom + system admin
  if (role === ROLES.SYSTEM_ADMIN) return true;
  if (role === ROLES.CLASSROOM_ADMIN && classroomId === targetClassroomId) return true;
  return false;
}

export function canViewAggregate(role: string) {
  // Merchant admins can see aggregate registration counts
  return (
    role === ROLES.SYSTEM_ADMIN ||
    role === ROLES.MERCHANT_ADMIN ||
    role === ROLES.RESERVATION_MANAGER ||
    role === ROLES.CLASSROOM_ADMIN
  );
}
