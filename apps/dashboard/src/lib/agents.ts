import { Bot, Mail, Headphones, FileText, Star, type LucideIcon } from 'lucide-react';

export interface AgentNav {
  slug: string;
  label: string;
  fr: string;
  icon: LucideIcon;
  phase: number;
}

export const MVP_AGENTS: readonly AgentNav[] = [
  { slug: 'chatbot', label: 'Chatbot', fr: 'Chatbot bilingue', icon: Bot, phase: 6 },
  { slug: 'email', label: 'Email', fr: 'Email lifecycle', icon: Mail, phase: 7 },
  { slug: 'support', label: 'Support', fr: 'Support email', icon: Headphones, phase: 8 },
  { slug: 'seo', label: 'SEO', fr: 'SEO blog', icon: FileText, phase: 9 },
  { slug: 'reviews', label: 'Reviews', fr: 'Reviews & UGC', icon: Star, phase: 10 },
] as const;
