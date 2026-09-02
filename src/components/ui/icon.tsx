import {
  Activity, AlertTriangle, ArrowLeftRight, BarChart3, Bell, Bot, Boxes, Building2,
  CalendarDays, CheckCircle2, ClipboardList, Clock, Cloud, Code2, CreditCard,
  ExternalLink, Facebook, FileText, Flag, FolderArchive, FolderKanban, Github, Globe,
  GraduationCap, HardDrive, HeartPulse, HelpCircle, Home, Image as ImageIcon, Inbox,
  Landmark, Layers, LayoutDashboard, Library, LifeBuoy, LineChart, Link2, Linkedin,
  ListChecks, Lock, MapPin, Menu, MessageSquare, MessageSquareWarning, MousePointerClick,
  Newspaper, Palette, PenSquare, PieChart, Plug, Quote, Receipt, ScrollText, Search,
  Settings, Share2, ShieldAlert, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles,
  Target, Timer, Trophy, TrendingUp, Twitter, Undo2, User, UserCheck, UserCog, UserPlus,
  Users, Wallet, Zap, Mail, type LucideProps,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * An explicit registry rather than a namespace import.
 *
 * `import * as icons from "lucide-react"` would pull the entire icon set into
 * every client bundle that renders a CMS-supplied icon name — hundreds of
 * kilobytes for a handful of glyphs. Listing them keeps the bundle honest, and
 * an unknown name degrades to a fallback instead of throwing, because the name
 * comes from editable content (PRD §40.6).
 */
const REGISTRY: Record<string, React.ComponentType<LucideProps>> = {
  Activity, AlertTriangle, ArrowLeftRight, BarChart3, Bell, Bot, Boxes, Building2,
  CalendarDays, CheckCircle2, ClipboardList, Clock, Cloud, Code2, CreditCard,
  ExternalLink, Facebook, FileText, Flag, FolderArchive, FolderKanban, Github, Globe,
  GraduationCap, HardDrive, HeartPulse, HelpCircle, Home, Image: ImageIcon, Inbox,
  Landmark, Layers, LayoutDashboard, Library, LifeBuoy, LineChart, Link2, Linkedin,
  ListChecks, Lock, Mail, MapPin, Menu, MessageSquare, MessageSquareWarning,
  MousePointerClick, Newspaper, Palette, PenSquare, PieChart, Plug, Quote, Receipt,
  ScrollText, Search, Settings, Share2, ShieldAlert, ShieldCheck, ShoppingBag,
  ShoppingCart, Sparkles, Target, Timer, Trophy, TrendingUp, Twitter, Undo2, User,
  UserCheck, UserCog, UserPlus, Users, Wallet, Zap,
};

export function Icon({ name, ...props }: { name?: string | null } & Omit<LucideProps, "name">) {
  const Component = (name && REGISTRY[name]) || Sparkles;
  return <Component {...props} />;
}

/**
 * Reusable glass icon badge from the brand banner (PRD §51.4) — one component
 * used across Services, the capability rail and Process, instead of a new icon
 * treatment per section.
 */
export function IconBadge({
  name,
  size = "md",
  className,
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = { sm: "h-9 w-9 rounded-lg", md: "h-12 w-12 rounded-xl", lg: "h-14 w-14 rounded-2xl" }[size];
  const glyph = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  return (
    <span
      className={cn(
        "brand-ring inline-flex shrink-0 items-center justify-center border border-border/70 bg-gradient-to-br from-primary/12 to-accent/10 text-primary shadow-soft backdrop-blur",
        box,
        className,
      )}
    >
      <Icon name={name} className={glyph} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
