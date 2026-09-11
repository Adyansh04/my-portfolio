import { Award, BadgeCheck, Bot, Briefcase, Code, Cpu, FileText, Github, GraduationCap, Linkedin, Mail, Medal, Rocket, Trophy, type LucideProps } from 'lucide-react'
import type { IconName } from '@/content/types'

const ICONS = { Award, BadgeCheck, Bot, Briefcase, Code, Cpu, FileText, Github, GraduationCap, Linkedin, Mail, Medal, Rocket, Trophy } satisfies Record<IconName, unknown>

export function IconByName({ name, ...props }: { name: IconName } & LucideProps) {
  const Icon = ICONS[name] ?? Bot
  return <Icon {...props} />
}
