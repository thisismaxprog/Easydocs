import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

export const dashboardNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/overview', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clienti', icon: Users },
  { href: '/documents', label: 'Documenti', icon: FileText },
  { href: '/settings', label: 'Impostazioni', icon: Settings },
  { href: '/help', label: 'Aiuto', icon: HelpCircle },
];
