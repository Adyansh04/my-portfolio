// Content restructured 2026-09-11: a one-line gist and two or three scannable points carry each
// role. The original paragraph is kept in `description`, so nothing was dropped.
import type { Experience } from './types';

// Newest first: array order is display order, placard order in the corridor, and beat order.
// To add a role, copy an entry, give it the next free id, and put it where it belongs in time.
// The corridor, the robot's route and the scroll length all size themselves from this list.
export const experiences: Experience[] = [
  {
    "id": 6,
    "title": "Robotics Software Developer",
    "company": "Robotics Collective",
    "location": "Aachen, Germany",
    "period": "May 2026 - Present",
    "icon": "Bot",
    "logo": "robotics-collective.svg",
    "logoOnDark": true,
    "highlights": [
      {
        "metric": "Unitree R1",
        "label": "Humanoid"
      },
      {
        "metric": "Vision",
        "label": "Guided Arm"
      }
    ],
    "badges": [
      "Robotic Arm",
      "RGB Vision",
      "Teleoperation",
      "Speech Recognition"
    ],
    "description": "Developing an automated cable insertion pipeline using a robotic arm and RGB cameras for precise, vision-guided manipulation. Integrated teleoperation and speech-recognition on a Unitree R1 humanoid to enable real-time human-robot interaction for live demonstrations.",
    "gist": "Vision-guided cable insertion, and a humanoid you can talk to.",
    "points": [
      "Automated cable insertion with a robotic arm and RGB cameras",
      "Teleoperation and speech recognition on a Unitree R1 humanoid",
      "Real-time human-robot interaction for live demonstrations"
    ]
  },
  {
    "id": 1,
    "title": "Mobile Robotics Intern",
    "company": "Addverb Technologies",
    "location": "Noida, India",
    "period": "April 2025 - August 2025",
    "icon": "Rocket",
    "logo": "addverb.png",
    "highlights": [
      {
        "metric": "180% → 15%",
        "label": "CPU Reduction"
      },
      {
        "metric": "AVX-512",
        "label": "SIMD Optimization"
      }
    ],
    "badges": [
      "C++",
      "HPC",
      "AVX-512 SIMD",
      "LIO"
    ],
    "description": "Engineered a new C++ implementation of the WhyCode/Whycon fiducial marker system utilizing HPC techniques. Worked on camera drivers using shared memory and assisted in integrating Lidar-Inertial Odometry (LIO) for improved robot positioning.",
    "gist": "Rewrote the fiducial stack in C++ until it stopped starving the robot.",
    "points": [
      "New C++ WhyCode/Whycon implementation using HPC techniques",
      "Camera drivers over shared memory",
      "Helped integrate Lidar-Inertial Odometry (LIO) for positioning"
    ]
  },
  {
    "id": 2,
    "title": "Robotics Intern",
    "company": "Sakar Robotics",
    "location": "Pune, India",
    "period": "August 2024 - April 2025",
    "icon": "Cpu",
    "logo": "sakar-robotics.png",
    "highlights": [
      {
        "metric": "AMR",
        "label": "Industrial Focus"
      },
      {
        "metric": "Jetson",
        "label": "GPU Platform"
      }
    ],
    "badges": [
      "Isaac ROS",
      "NVIDIA Jetson",
      "Computer Vision",
      "Nav2"
    ],
    "description": "Collaborated on development of autonomous industrial AMRs with advanced navigation systems. Implemented computer vision using AI technologies and worked extensively with NVIDIA Jetson hardware and Isaac ROS.",
    "gist": "Industrial AMRs: navigation, vision, and Jetson hardware.",
    "points": [
      "Autonomous industrial AMRs with advanced navigation systems",
      "Computer vision built with AI technologies",
      "Worked extensively with NVIDIA Jetson and Isaac ROS"
    ]
  },
  {
    "id": 3,
    "title": "Drone Systems Development Intern",
    "company": "Avignon University",
    "location": "Avignon, France",
    "period": "June 2024 - July 2024",
    "icon": "Rocket",
    "logo": "avignon-university.svg",
    "highlights": [
      {
        "metric": "20/20",
        "label": "Perfect Score"
      },
      {
        "metric": "ROS2",
        "label": "Framework"
      }
    ],
    "badges": [
      "ROS2",
      "Drone Systems",
      "ArUco",
      "Indoor Nav"
    ],
    "description": "Developed drone systems for Indoor Navigation, Object Tracking, and ArUco-based Inventory Management using ROS2. Achieved a perfect score of 20/20, distinguishing myself among all students.",
    "gist": "Indoor drone navigation and ArUco inventory, scored 20/20.",
    "points": [
      "Indoor navigation and object tracking in ROS2",
      "ArUco-based inventory management",
      "Perfect score of 20/20, distinguishing myself among all students"
    ]
  },
  {
    "id": 4,
    "title": "Engineering Design Intern",
    "company": "Dassault Systems",
    "location": "Pune, India",
    "period": "Sept 2023 - Jan 2024",
    "icon": "Code",
    "logo": "dassault-systemes.svg",
    "highlights": [
      {
        "metric": "3D",
        "label": "Digital Twin"
      },
      {
        "metric": "CAE",
        "label": "Simulation"
      }
    ],
    "badges": [
      "3D Experience",
      "CATIA",
      "Simulation",
      "CAE"
    ],
    "description": "Led the conversion of a Pelton Wheel Turbine into a precise 3D digital twin and performed simulations for optimal performance.",
    "gist": "Turned a Pelton wheel turbine into a simulated digital twin.",
    "points": [
      "Led the conversion into a precise 3D digital twin",
      "Ran simulations for optimal performance"
    ]
  },
  {
    "id": 5,
    "title": "Vice President, Mechatronics Engineer",
    "company": "VIIT Robotics (College Club)",
    "location": "Pune, India",
    "period": "Aug 2022 - July 2024",
    "icon": "GraduationCap",
    "logo": "viit.png",
    "highlights": [
      {
        "metric": "Team",
        "label": "Leadership"
      },
      {
        "metric": "R&D",
        "label": "Projects"
      }
    ],
    "badges": [
      "Leadership",
      "Mechatronics",
      "Prototyping",
      "Team Management"
    ],
    "description": "Led a team of talented robotics enthusiasts, fostering collaboration and ensuring efficient project execution. Utilized mechatronics engineering skills to design, prototype, and test robotics components.",
    "gist": "Ran the robotics club, and the things it built.",
    "points": [
      "Led a team of talented robotics enthusiasts",
      "Designed, prototyped and tested robotics components",
      "Fostered collaboration and efficient project execution"
    ]
  }
];
