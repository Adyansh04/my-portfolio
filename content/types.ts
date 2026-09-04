export type IconName =
  | 'Bot' | 'Rocket' | 'Cpu' | 'Code' | 'GraduationCap' | 'Briefcase'
  | 'Trophy' | 'Medal' | 'Award' | 'FileText' | 'BadgeCheck'
  | 'Mail' | 'Github' | 'Linkedin';

export interface Project {
  id: number;
  title: string;
  description: string;
  venue: string;
  year: string;
  award: string | null;
  tags: string[];
  links: { github: string; demo: string };
  details: {
    fullDescription: string;
    techStack: string[];
    challenges: string[];
    mediaFolder: string;
  };
}

export interface Experience {
  id: number;
  title: string;
  company: string;
  location: string;
  period: string;
  icon: IconName;
  highlights: { metric: string; label: string }[];
  badges: string[];
  description: string;
}

export interface Hackathon {
  id: number;
  rank: string;
  icon: IconName;
  /** Medal colour (gold / silver); null = theme accent. */
  accent: string | null;
  title: string;
  organizer: string;
  date: string;
  description: string;
  tags: string[];
}

export interface CredentialItem {
  title: string;
  id: string;
  year: string;
  status: string;
  description: string;
  highlights: string[];
  link: string;
}

export interface CredentialGroup {
  id: string;
  title: string;
  icon: IconName;
  items: CredentialItem[];
}

export interface Education {
  school: string;
  degree: string;
  years: string;
  flag: string;
  country: string;
}

export interface ContactCommand {
  command: string;
  output: string;
  icon: IconName;
  link: string;
  label: string;
}
