export type IconName =
  | 'Bot' | 'Rocket' | 'Cpu' | 'Code' | 'GraduationCap' | 'Briefcase'
  | 'Trophy' | 'Medal' | 'Award' | 'FileText' | 'BadgeCheck'
  | 'Mail' | 'Github' | 'Linkedin';

/** A number worth seeing before any prose. */
export interface Metric {
  value: string;
  label: string;
}

/** A challenge split into what went wrong and what fixed it, so both can be scanned. */
export interface Challenge {
  title: string;
  problem: string;
  solution: string;
}

export interface Project {
  id: number;
  title: string;
  /** one line: what this is, in the fewest words that still say something */
  gist: string;
  /** three claims the card can be read from — what it does, how, what came out */
  points: string[];
  /** hard numbers, shown before anyone has to read a sentence */
  metrics: Metric[];
  /** the original paragraph; kept for the full write-up at the bottom of the sheet */
  description: string;
  venue: string;
  year: string;
  award: string | null;
  tags: string[];
  links: { github: string; demo: string };
  details: {
    /** how it works, as steps rather than a wall */
    approach: string[];
    challenges: Challenge[];
    /** the original long-form text, unchanged */
    fullDescription: string;
    techStack: string[];
    mediaFolder: string;
  };
}

export interface Experience {
  id: number;
  title: string;
  /** one line: what the role actually was */
  gist: string;
  /** two or three scannable claims, in place of the paragraph */
  points: string[];
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
