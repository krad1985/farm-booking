export const ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  MERCHANT_ADMIN: "MERCHANT_ADMIN",
  RESERVATION_MANAGER: "RESERVATION_MANAGER",
  CLASSROOM_ADMIN: "CLASSROOM_ADMIN",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  SYSTEM_ADMIN: "系統管理員",
  MERCHANT_ADMIN: "商家管理",
  RESERVATION_MANAGER: "預約管理",
  CLASSROOM_ADMIN: "教室管理",
  STUDENT: "學員",
};

export const BOOKING_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REGISTRATION_OPEN: "REGISTRATION_OPEN",
  FINALIZED: "FINALIZED",
  CANCELLED: "CANCELLED",
} as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  PENDING: "待審核",
  CONFIRMED: "已確認",
  REGISTRATION_OPEN: "報名中",
  FINALIZED: "已結案",
  CANCELLED: "已取消",
};

export const ITINERARY_TYPES = {
  FULL_DAY: "FULL_DAY",
  HALF_AM_LUNCH: "HALF_AM_LUNCH",
  HALF_PM_DINNER: "HALF_PM_DINNER",
} as const;

export const ITINERARY_LABELS: Record<string, string> = {
  FULL_DAY: "全天（含午晚餐）",
  HALF_AM_LUNCH: "半天上午（含午餐）",
  HALF_PM_DINNER: "半天下午（含晚餐）",
};

export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  SUBMITTED: "已提交",
  CONFIRMED: "已確認",
  PAID: "已繳費",
  CANCELLED: "已取消",
};

export const CHOICE_MODE_LABELS: Record<string, string> = {
  EXCLUSIVE: "擇一報名",
  CUMULATIVE: "可複選",
};
