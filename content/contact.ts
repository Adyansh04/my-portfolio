// GENERATED 2026-09-03 from the pre-redesign components on branch main (verbatim). Edit by hand from here on.
import type { ContactCommand } from './types';

export const contactCommands: ContactCommand[] = [
  {
    "command": "cat contact.json | jq '.email'",
    "output": "\"gupta.adyansh@gmail.com\"",
    "icon": "Mail",
    "link": "mailto:gupta.adyansh@gmail.com",
    "label": "Email"
  },
  {
    "command": "git remote get-url origin",
    "output": "https://github.com/Adyansh04",
    "icon": "Github",
    "link": "https://github.com/Adyansh04",
    "label": "GitHub"
  },
  {
    "command": "curl -s api.linkedin.com/profile",
    "output": "\"linkedin.com/in/adyanshgupta\"",
    "icon": "Linkedin",
    "link": "https://linkedin.com/in/adyanshgupta",
    "label": "LinkedIn"
  }
];

export const resume = {
  href: '/resume.pdf', // relative to the site base path
  downloadName: 'Adyansh_Gupta_Resume.pdf',
  label: 'Download Resume',
  fileLabel: 'Resume.pdf',
  hint: 'Click to download',
};
