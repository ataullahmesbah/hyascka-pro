import type { Role } from "@prisma/client";

/**
 * The permission matrix is the authoritative source of truth for access
 * (PRD §12, §42.9). The dashboard navigation is generated *from* this matrix —
 * never the other way around — and the server re-checks it on every request.
 */

export const PERMISSIONS = [
  // People
  "users.read",
  "users.manage",
  "roles.manage",
  // CRM
  "leads.read",
  "leads.manage",
  "clients.read",
  "clients.manage",
  // Catalogue & sales
  "services.read",
  "services.manage",
  "orders.read",
  "orders.manage",
  // Delivery
  "projects.read",
  "projects.manage",
  // Communication
  "messages.read",
  "messages.manage",
  "support.read",
  "support.manage",
  // Finance
  "finance.read",
  "finance.approve",
  "invoice.issue",
  "payment.verify",
  "refund.create",
  "expense.manage",
  "reports.read",
  // Content
  "content.read",
  "content.manage",
  "content.publish",
  "media.manage",
  "seo.manage",
  // System
  "audit.read",
  "integrations.manage",
  "settings.manage",
  "settings.security",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

/** Highest-risk actions ADMIN is deliberately excluded from (PRD §42.3). */
const ADMIN_EXCLUDED: Permission[] = ["settings.security", "roles.manage"];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL.filter((p) => !ADMIN_EXCLUDED.includes(p)),
  FINANCE: [
    "clients.read",
    "finance.read",
    "finance.approve",
    "invoice.issue",
    "payment.verify",
    "refund.create",
    "expense.manage",
    "reports.read",
    "orders.read",
  ],
  PROJECT_MANAGER: [
    "clients.read",
    "projects.read",
    "projects.manage",
    "messages.read",
    "messages.manage",
    "services.read",
    "orders.read",
  ],
  EDITOR: [
    "content.read",
    "content.manage",
    "content.publish",
    "media.manage",
    "seo.manage",
    "services.read",
    "services.manage",
  ],
  SUPPORT: [
    "clients.read",
    "messages.read",
    "messages.manage",
    "support.read",
    "support.manage",
    "projects.read",
  ],
  CLIENT: [],
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FINANCE: "Finance",
  PROJECT_MANAGER: "Project Manager",
  EDITOR: "Editor",
  SUPPORT: "Support",
  CLIENT: "Client",
};

export const STAFF_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE",
  "PROJECT_MANAGER",
  "EDITOR",
  "SUPPORT",
];

export function isStaff(role: Role) {
  return role !== "CLIENT";
}

export type Actor = {
  id: string;
  role: Role;
  /** Per-user grants layered on the role matrix (UserPermission rows). */
  extraPermissions?: string[];
  revokedPermissions?: string[];
};

export function permissionsFor(actor: Actor): Permission[] {
  const base = new Set<Permission>(ROLE_PERMISSIONS[actor.role] ?? []);
  for (const p of actor.extraPermissions ?? []) {
    if ((PERMISSIONS as readonly string[]).includes(p)) base.add(p as Permission);
  }
  for (const p of actor.revokedPermissions ?? []) base.delete(p as Permission);
  return [...base];
}

export function can(actor: Actor | null | undefined, permission: Permission): boolean {
  if (!actor) return false;
  if (actor.revokedPermissions?.includes(permission)) return false;
  if (actor.extraPermissions?.includes(permission)) return true;
  return (ROLE_PERMISSIONS[actor.role] ?? []).includes(permission);
}

export function canAny(actor: Actor | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => can(actor, p));
}

export function canAll(actor: Actor | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((p) => can(actor, p));
}

// ---------------------------------------------------------------------------
// Per-role dashboard navigation (PRD §42) — each role gets its own shell and
// its own landing page. A role never sees a menu item it cannot use.
// ---------------------------------------------------------------------------

export type NavLink = {
  label: string;
  href: string;
  icon: string;
  /** Required permission; omitted means "available to any signed-in user". */
  permission?: Permission;
  children?: NavLink[];
};

const OVERVIEW: NavLink = { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" };

const FINANCE_GROUP: NavLink = {
  label: "Finance",
  href: "/dashboard/finance",
  icon: "Wallet",
  permission: "finance.read",
  children: [
    { label: "Overview", href: "/dashboard/finance", icon: "PieChart", permission: "finance.read" },
    { label: "Accounts", href: "/dashboard/finance/accounts", icon: "Landmark", permission: "finance.read" },
    { label: "Invoices", href: "/dashboard/finance/invoices", icon: "FileText", permission: "finance.read" },
    { label: "Payments", href: "/dashboard/finance/payments", icon: "CreditCard", permission: "finance.read" },
    { label: "Expenses", href: "/dashboard/finance/expenses", icon: "Receipt", permission: "expense.manage" },
    { label: "Transactions", href: "/dashboard/finance/transactions", icon: "ArrowLeftRight", permission: "finance.read" },
    { label: "Refunds", href: "/dashboard/finance/refunds", icon: "Undo2", permission: "finance.read" },
    { label: "Reports", href: "/dashboard/finance/reports", icon: "BarChart3", permission: "reports.read" },
  ],
};

const CONTENT_GROUP: NavLink = {
  label: "Content",
  href: "/dashboard/content",
  icon: "PenSquare",
  permission: "content.read",
  children: [
    { label: "Homepage", href: "/dashboard/content/homepage", icon: "Home", permission: "content.manage" },
    { label: "Blog", href: "/dashboard/content/blog", icon: "Newspaper", permission: "content.manage" },
    { label: "Case Studies", href: "/dashboard/content/case-studies", icon: "Trophy", permission: "content.manage" },
    { label: "Testimonials", href: "/dashboard/content/testimonials", icon: "Quote", permission: "content.manage" },
    { label: "FAQ", href: "/dashboard/content/faq", icon: "HelpCircle", permission: "content.manage" },
    { label: "Navigation", href: "/dashboard/content/navigation", icon: "Menu", permission: "content.manage" },
  ],
};

const STAFF_LINKS: Record<string, NavLink> = {
  leads: { label: "Leads & CRM", href: "/dashboard/leads", icon: "UserPlus", permission: "leads.read" },
  clients: { label: "Clients", href: "/dashboard/clients", icon: "Users", permission: "clients.read" },
  requests: { label: "Service Requests", href: "/dashboard/requests", icon: "ClipboardList", permission: "clients.read" },
  services: { label: "Services", href: "/dashboard/services", icon: "Layers", permission: "services.read" },
  orders: { label: "Orders", href: "/dashboard/orders", icon: "ClipboardList", permission: "orders.read" },
  projects: { label: "Projects", href: "/dashboard/projects", icon: "FolderKanban", permission: "projects.read" },
  messages: { label: "Messages", href: "/dashboard/messages", icon: "MessageSquare", permission: "messages.read" },
  support: { label: "Support Tickets", href: "/dashboard/support", icon: "LifeBuoy", permission: "support.read" },
  media: { label: "Media Library", href: "/dashboard/media", icon: "Image", permission: "media.manage" },
  seo: { label: "SEO", href: "/dashboard/seo", icon: "Search", permission: "seo.manage" },
  users: { label: "Users & Roles", href: "/dashboard/users", icon: "ShieldCheck", permission: "users.read" },
  audit: { label: "Audit & Security", href: "/dashboard/audit", icon: "ScrollText", permission: "audit.read" },
  integrations: { label: "Integrations", href: "/dashboard/integrations", icon: "Plug", permission: "integrations.manage" },
  settings: { label: "Settings", href: "/dashboard/settings", icon: "Settings", permission: "settings.manage" },
};

const NOTIFICATIONS: NavLink = {
  label: "Notifications",
  href: "/dashboard/notifications",
  icon: "Bell",
};

const CLIENT_NAV: NavLink[] = [
  OVERVIEW,
  { label: "My Services", href: "/dashboard/my-services", icon: "Layers" },
  { label: "Projects", href: "/dashboard/my-projects", icon: "FolderKanban" },
  { label: "Invoices", href: "/dashboard/my-invoices", icon: "FileText" },
  { label: "Payments", href: "/dashboard/my-payments", icon: "CreditCard" },
  { label: "Documents", href: "/dashboard/my-documents", icon: "FolderArchive" },
  { label: "Messages", href: "/dashboard/messages", icon: "MessageSquare" },
  { label: "Support", href: "/dashboard/support", icon: "LifeBuoy" },
  NOTIFICATIONS,
  { label: "Profile", href: "/dashboard/profile", icon: "User" },
  { label: "Security", href: "/dashboard/security", icon: "Lock" },
];

const NAV_BY_ROLE: Record<Role, NavLink[]> = {
  SUPER_ADMIN: [
    OVERVIEW,
    STAFF_LINKS.leads,
    STAFF_LINKS.clients,
    STAFF_LINKS.requests,
    STAFF_LINKS.services,
    STAFF_LINKS.orders,
    STAFF_LINKS.projects,
    STAFF_LINKS.messages,
    STAFF_LINKS.support,
    NOTIFICATIONS,
    FINANCE_GROUP,
    CONTENT_GROUP,
    STAFF_LINKS.media,
    STAFF_LINKS.seo,
    STAFF_LINKS.users,
    STAFF_LINKS.audit,
    STAFF_LINKS.integrations,
    STAFF_LINKS.settings,
  ],
  ADMIN: [
    OVERVIEW,
    STAFF_LINKS.leads,
    STAFF_LINKS.clients,
    STAFF_LINKS.requests,
    STAFF_LINKS.services,
    STAFF_LINKS.orders,
    STAFF_LINKS.projects,
    STAFF_LINKS.messages,
    STAFF_LINKS.support,
    NOTIFICATIONS,
    FINANCE_GROUP,
    CONTENT_GROUP,
    STAFF_LINKS.media,
    STAFF_LINKS.seo,
    STAFF_LINKS.users,
    STAFF_LINKS.audit,
    STAFF_LINKS.settings,
  ],
  FINANCE: [OVERVIEW, FINANCE_GROUP, STAFF_LINKS.clients, NOTIFICATIONS],
  PROJECT_MANAGER: [
    OVERVIEW,
    STAFF_LINKS.clients,
    STAFF_LINKS.requests,
    STAFF_LINKS.projects,
    STAFF_LINKS.messages,
    NOTIFICATIONS,
  ],
  EDITOR: [OVERVIEW, CONTENT_GROUP, STAFF_LINKS.services, STAFF_LINKS.media, STAFF_LINKS.seo, NOTIFICATIONS],
  SUPPORT: [OVERVIEW, STAFF_LINKS.messages, STAFF_LINKS.support, STAFF_LINKS.clients, STAFF_LINKS.requests, NOTIFICATIONS],
  CLIENT: CLIENT_NAV,
};

/** Navigation tree for a role, filtered by the actor's effective permissions. */
export function navigationFor(actor: Actor): NavLink[] {
  const filter = (links: NavLink[]): NavLink[] =>
    links
      .filter((link) => !link.permission || can(actor, link.permission))
      .map((link) => (link.children ? { ...link, children: filter(link.children) } : link))
      .filter((link) => !link.children || link.children.length > 0);

  return filter(NAV_BY_ROLE[actor.role] ?? CLIENT_NAV);
}

/** Where a role lands after signing in (PRD §42.1). */
export function dashboardHomeFor(role: Role) {
  return role === "CLIENT" ? "/dashboard" : "/dashboard";
}
