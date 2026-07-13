"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Trophy, ExternalLink, Github, MapPin, Calendar, Expand, X, Play, ImageIcon, FileText } from "lucide-react";
import { useColorTheme } from "./color-theme-provider";
import { GlitchText, TextRevealOnScroll, ScrambleText, AnimatedGridBackground, ParallaxScale } from "@/components/animations";
import { MediaCarousel } from "./media-carousel";
import { ProjectGlyph } from "@/components/glyphs";

const projects = [
  {
    id: 1,
    title: "Go2 Autonomous Inspection (Unitree Go2)",
    description:
      "A simulation-first ROS2 stack that lets a Unitree Go2 quadruped autonomously inspect an unknown facility — driven end-to-end by plain-English commands. The robot maps the area on its own, splits it into rooms (\"zones\"), then walks each zone and reports what it sees using an open-vocabulary camera detector, all triggered through an MCP server bridged to Claude.",
    venue: "Europe Embodied Hackathon",
    year: "2026",
    award: null,
    tags: ["ROS2 Jazzy", "RTAB-Map SLAM", "Nav2", "YOLOE", "MCP / Claude"],
    links: { github: "https://github.com/Adyansh04/go2-ros2-inspection", demo: "#" },
    details: {
      fullDescription: "Built on ROS2 Jazzy and Gazebo Harmonic, the stack runs the full mapping → segmentation → inspection → report pipeline with zero hard-coded waypoints. A C++ frontier_explorer selects goals by information gain (not nearest-frontier) with a blacklist/recovery state machine, while RTAB-Map fuses a 4D L1 LiDAR with odometry into a teleport-proof map→odom transform and a 2D grid. Saved maps are turned into labelled, navigable rooms by a watershed-based zone segmenter (obstacle-island fill + distance-transform room cores + door-aware separation). For each zone the robot samples safe interior viewpoints, drives there with Nav2, performs a slow in-place 360° spin while a YOLOE open-vocabulary detector runs continuously, projects every detection into the map frame via the depth camera, de-duplicates by class and world position, crops each unique object, and emits per-zone and facility-wide reports. A FastMCP server exposes the entire mission as 14 natural-language tools, so commands like \"explore the area\", \"what zones did you find?\", \"inspect zone 1\", and \"give me the report\" are translated by Claude into ROS service calls. Because every node mirrors the real-Go2 topic contract, the same code ports unchanged from simulation to hardware.",
      techStack: ["ROS2 Jazzy & Gazebo Harmonic", "RTAB-Map LiDAR Graph-SLAM", "Nav2 & Frontier Exploration (C++)", "YOLOE Open-Vocabulary Vision", "FastMCP + Claude (MCP)", "CHAMP Quadruped Gait"],
      challenges: [
        "Natural-Language Mission Control via MCP: Translating ambiguous plain-English requests into safe, deterministic robot behavior. Solved by building a FastMCP server that maps 14 mission tools onto a thin ROS2 service layer, normalizes zone references (\"room 3\" / \"zone 3\" / \"3\" → zone_3), and runs heavy capabilities as isolated subprocesses so the bridge never fights rclpy threading.",
        "Map-Grounded Open-Vocabulary Localization: Turning noisy 2D detections from a spinning camera into a clean object list. Addressed by projecting each YOLOE detection into the map frame through the depth camera, validating it against the occupancy grid to reject phantoms floating in mapped free space, and de-duplicating repeated sightings by class and world position within a tunable radius.",
        "Hard-Coded-Pose-Free Autonomy: Operating in a never-before-seen facility with no manual waypoints. Solved by pairing information-gain frontier exploration (with stuck-detection, blacklisting, and TTL recovery) with a watershed zone segmenter that converts any saved map into labelled rooms, each carrying a guaranteed-open navigation point for the inspection sweep."
      ],
      mediaFolder: "go2-inspection",
    },
  },
  {
    id: 2,
    title: "AI+Robotics Hackathon 2025 (RWTH Aachen)",
    description:
      "Developed under intense hackathon constraints at RWTH Aachen, this project secured the Best Technical Implementation prize by bridging advanced spatial computer vision with real-time robotic manipulation. The core engineering objective was to enable a robotic manipulator to execute reliable pick-and-place tasks within a cluttered, unpredictable workspace without pre-mapping the environment.",
    venue: "RWTH Aachen",
    year: "2025",
    award: "Best Technical Implementation",
    tags: ["Isaac Sim", "MoveIt2", "NvBlox", "FoundationPose"],
    links: { github: "#", demo: "#" },
    details: {
      fullDescription: "The architecture relies on an integrated ROS2 pipeline. First, a depth camera generates a dense, real-time 3D scene mesh using NvBlox. Concurrently, NVIDIA FoundationPose estimates the 6D pose and generates 3D bounding boxes for target objects. To prevent the robot from classifying the target object itself as a collision obstacle, the system dynamically subtracts the target object's spatial data from the environmental TSDF grid before publishing the clean background mesh directly into the MoveIt planning scene for immediate path generation. The complete loop was fully validated in high-fidelity NVIDIA Isaac Sim before deployment.",
      techStack: ["Isaac Sim", "MoveIt2", "NvBlox", "FoundationPose", "ROS2 Humble"],
      challenges: [
        "Dynamic Obstacle Isolation via Mesh Subtraction: Overcame the critical issue where the target object would register as a collision asset, causing the path planner to abort the grasp phase. Solved this by programmatic background mesh subtraction.",
        "Robust 6D Object Pose Estimation: Achieved high-accuracy pick positioning under varying illumination and object occlusions by utilizing a zero-shot model architecture to map tight 3D coordinates without localized model training.",
        "Perception-to-Planning Latency Reduction: Synchronized high-bandwidth volumetric mesh generation with the active MoveIt planning scene, optimizing data transformation lines to avoid path generation timeouts during sudden environment shifts."
      ],
      mediaFolder: "ai-robotics",
    },
  },
  {
    id: 3,
    title: "OLIVE: Optimization of Lidar, Inertial, Vision & Encoders",
    description:
      "A graph-based multi-sensor fusion backend that fuses LiDAR, tightly-coupled IMU, wheel encoders, WhyCode fiducial markers, and monocular visual odometry into one iSAM2 factor graph for drift-free AMR localization. Publishes two synchronized odometry outputs — a globally-accurate map-frame pose and a smooth, jump-free local stream a Nav2 controller can drive on directly — validated to 2.0 cm RMSE over three 56 m loops.",
    venue: "Personal Project",
    year: "2026",
    award: null,
    tags: ["ROS2 Jazzy", "GTSAM / iSAM2", "LiDAR-Inertial Odometry", "Sensor Fusion", "Nav2"],
    links: { github: "https://github.com/Adyansh04/olive", demo: "#" },
    details: {
      fullDescription: "Built on ROS2 Jazzy with a GTSAM iSAM2 factor-graph backend, OLIVE runs a single incremental keyframe graph that fuses five modalities as runtime-togglable factors: a LiDAR-inertial frontend (curvature-feature scan-to-map matching, gyro-seeded), tightly-coupled IMU preintegration with online gyro/accel bias estimation, wheel odometry as a metric-scale anchor, WhyCode fiducial markers treated as TagSLAM-style landmark variables, and a wheel-scaled monocular visual-odometry front-end — with ICP loop closure and a soft planar prior on top. The backend publishes two REP-105-compliant outputs from that same graph: `/olive/odometry` (map-frame, globally accurate, allowed to jump when a marker or loop closure corrects drift) and `/olive/odometry_local` (odom-frame, ~50 Hz, continuous) — so every global correction lands in the `map→odom` transform while the stream a Nav2 controller actually drives on never teleports, making OLIVE a drop-in AMCL replacement.",
      techStack: ["ROS2 Jazzy & GTSAM (iSAM2)", "LiDAR-Inertial Odometry (C++20)", "Tightly-Coupled IMU Preintegration", "WhyCode Fiducial Landmarks", "Monocular Visual Odometry"],
      challenges: [
        "Keeping Global Corrections Out of the Controller's Path (REP-105 Split): AMR controllers need continuous odometry, but global corrections — loop closures, marker anchors — must not appear as teleports. Solved by publishing two synchronized outputs from the same graph: a map-frame pose that is allowed to jump, and a ~50 Hz odom-frame stream where the correction lands entirely in `map→odom` — verified to a 2.4 cm max step across three 56 m loops.",
        "Fusing a Weak, Drifting Modality Without Hurting Accuracy: Monocular VO's translation scale is unobservable on a planar robot and its heading drifts uncorrected, so naively fusing it risks pulling the whole estimate off course. Solved by scaling VO translation from wheel odometry and entering it as a loose, robust factor — an A/B test showed tight sigmas blow the world-frame estimate out to 29 m, while loose sigmas keep steady-state accuracy at ~2 cm versus 3.6 cm with VO fully disabled, turning a weak modality into free robustness during LiDAR dropouts.",
        "Recovering from Total Sensor Dropout via Landmarks: Long GPS-denied corridors and sensor blackouts cause conventional filters to diverge outright. Solved by treating WhyCode markers as TagSLAM-style landmark variables in the same graph — a surveyed marker resolves an 8.5 m spawn-frame offset to centimeters on first sighting, and in fault-injection testing a 25 s LiDAR blackout recovers to 1.1 cm final error with markers versus 4.9 m of unrecoverable drift with markers disabled."
      ],
      mediaFolder: "olive",
    },
  },
  {
    id: 4,
    title: "WhyCode ROS2 Package (Addverb Technologies)",
    description:
      "Developed whycode_vision, a high-performance ROS2 package for 6-DOF WhyCon/WhyCode fiducial marker localization. Leveraged C++ and AVX-512 SIMD to slash CPU utilization from 180% to 10-15% while enabling multi-marker decoding, hysteresis-based ID stabilization, and hierarchical triangulation for AMRs.",
    venue: "Addverb Technologies",
    year: "2024",
    award: null,
    tags: ["C++", "AVX-512 SIMD", "ROS2", "Computer Vision"],
    links: { github: "https://github.com/Adyansh04/whycode", demo: "#" },
    details: {
      fullDescription: "During my Mobile Robotics internship at Addverb Technologies, I was tasked with eliminating a major computational bottleneck in the AMR perception stack. The deployed legacy pipeline for the WhyCode fiducial marker tracking system was functionally accurate but lacked hardware-level optimization, consuming an entire dual-core allocation (180-190% CPU load) on the robot's onboard industrial computer and starving downstream localization and navigation systems. The goal was to build a highly optimized, modular ROS2 package capable of detecting multiple markers, decoding IDs, and estimating 6-DOF poses at high framerates.",
      techStack: ["C++ & AVX-512 SIMD", "ROS2 (rclcpp, tf2)", "Computer Vision (OpenCV 4.2)", "Sensors & Calibration"],
      challenges: [
        "High CPU Load & Irregular Vectorization: Classical connected-component labeling and flood-fill operations rely on unpredictable pixel branch paths that break native auto-vectorization. Resolved by writing custom unrolled loops with explicit AVX mask registers via xsimd, dropping CPU usage to 10-15% at 640x480 resolution.",
        "Flickering IDs & Tracking Instability: Fast camera motion and motion blur caused WhyCode IDs to flicker or drop out entirely. Addressed by implementing a hysteresis-based ID stabilizer paired with lightweight 2D tracking to maintain continuous marker tracks over time.",
        "Robust Localization from Multiple Markers: Relying on a single marker for 6-DOF pose estimation can lead to orientation ambiguity. Developed dedicated hierarchical triangulation nodes (four_marker and two_marker) that use known marker layouts to compute highly stable, error-resistant odometry."
      ],
      mediaFolder: "whycode",
    },
  },
  {
    id: 5,
    title: "Sepsis Atlas (Clinical AI Evidence Processing)",
    description:
      "Developed a local-first RAG intelligence platform to convert unstructured medical research into schema-validated clinical evidence tables. Integrated hierarchical parent-child chunking with ChromaDB, Pydantic schema-driven data extraction via Claude-3.5-Sonnet, and programmatic source-quote verification to ensure hallucination-free output.",
    venue: "Personal Project",
    year: "2024",
    award: null,
    tags: ["RAG", "Vector DB", "Pydantic", "Claude AI"],
    links: { github: "https://github.com/Adyansh04/sepsis-atlas/tree/main", demo: "#" },
    details: {
      fullDescription: "Sepsis Atlas was built to automate the time-consuming and error-prone process of clinical meta-analyses, enabling medical professionals to transform thousands of pages of unstructured academic PDFs into structured, queryable databases. Built for three core clinical use cases—counterfactual mortality estimation, phenotype extraction, and biomarker ranking—the system enables clinicians to interact with a reliable, source-grounded evidence dashboard without relying on centralized, cloud-hosted server infrastructures.",
      techStack: ["Vector DBs & RAG", "Schema-Driven Extraction", "Streamlit Architecture", "Clinical Verification Pipelines"],
      challenges: [
        "Tabular and Layout-Aware PDF Extraction: Standard PDF segmenters split tabular clinical stats across unrelated text chunks, causing extraction failures. Overcame this by building layout-aware ingestion routines with Visual Language Model (VLM) summary hooks.",
        "Source-Grounded Hallucination Prevention: Clinical intelligence applications cannot tolerate generative hallucinations or factual misattributions. Solved this by developing a validation module that parses extracted fields and strictly traces quotes against raw, local source document segments.",
        "Schema Optimization for Complex Use Cases: Reconciling different paper formats into uniform schemas for highly complex scientific tasks (such as mortality statistics and clustering descriptions). Addressed by building modular, use-case-specific validation rules with Pydantic and self-repairing JSON structural checks."
      ],
      mediaFolder: "sepsis-atlas",
    },
  },
  {
    id: 6,
    title: "R2 - ABU Robocon 2024",
    description:
      "Led the software and systems engineering for \"R2,\" a fully autonomous, four-wheel mecanum drive robot for the ABU Robocon 2024 competition. Engineered a comprehensive ROS2 and Micro-ROS workspace featuring YOLO object tracking, LSA08 line following, and TF-Luna LiDAR alignment.",
    venue: "ABU Robocon",
    year: "2024",
    award: null,
    tags: ["ROS2 Humble", "Micro-ROS", "YOLO", "Nav2", "Mecanum"],
    links: { github: "https://github.com/Adyansh04/R2-Robocon", demo: "#" },
    details: {
      fullDescription: "For the ABU Robocon 2024 competition, our team was tasked with building a dual-robot system to complete complex, time-sensitive arena tasks. I led the primary development of \"R2,\" the fully autonomous half of the system. The objective was to engineer a highly agile, omnidirectional platform capable of navigating the arena, identifying specific targets (balls and silos), and executing precise alignment and manipulation maneuvers entirely without human intervention.",
      techStack: ["ROS2 Humble & Nav2", "Micro-ROS", "Computer Vision & YOLO", "Sensor Integration"],
      challenges: [
        "Microcontroller-to-ROS2 Synchronization: Bridging the gap between high-level ROS2 logic and low-level sensor hardware. Overcame this by engineering a reliable Micro-ROS network to stream TF-Luna distance data and LSA08 line states with near-zero latency for instant alignment corrections.",
        "Real-Time Dynamic Object Tracking: Identifying and tracking moving balls and static silos under glaring arena lighting. Addressed by deploying optimized YOLO object detection pipelines and custom ROS2 message interfaces to accurately feed visual target coordinates to the navigation stack.",
        "Omnidirectional Mecanum Kinematics: Ensuring smooth, drift-free strafing and rotation during high-speed arena navigation. Solved by tuning custom motor controller nodes and validating the physical robot's spatial parameters via r2_description URDF modeling."
      ],
      mediaFolder: "abu-robocon",
    },
  },
  {
    id: 7,
    title: "Kiwi Drive Robot",
    description:
      "Engineered a custom, small-scale three-wheeled omnidirectional \"Kiwi Drive\" robot from the ground up. Bridged physical hardware (ESP32, N20 motors) with high-level ROS2/Nav2 architecture via Micro-ROS, featuring EKF sensor fusion and a CNN-based vision pipeline trained on the LVIS dataset.",
    venue: "Personal Project",
    year: "2024",
    award: null,
    tags: ["ROS2", "Micro-ROS", "EKF", "CNN", "Gazebo"],
    links: { github: "https://github.com/Adyansh04/omnibot", demo: "#" },
    details: {
      fullDescription: "The Kiwi Drive project was conceived as a highly maneuverable, cost-effective platform to test and validate complex navigation and computer vision algorithms. Built on a custom acrylic chassis and powered by N20 encoder motors, the three-wheeled omnidirectional design provides unique holonomic movement capabilities. The goal was to build an end-to-end robotics pipeline—from mechanical assembly and bare-metal microcontroller programming to advanced simulation and AI-driven perception.",
      techStack: ["Hardware Integration", "State Estimation", "Computer Vision", "Simulation & Navigation"],
      challenges: [
        "Omnidirectional Odometry Drift: Three-wheeled kinematics create complex slip dynamics, causing pure wheel odometry to drift rapidly over time. Solved by tuning an Extended Kalman Filter (EKF) to tightly fuse high-rate ESP32 encoder ticks with IMU data for reliable state estimation.",
        "Sim-to-Real Hardware Bridging: Migrating from a perfect Gazebo simulation environment to the physical constraints of N20 motors. Addressed by deploying Micro-ROS on the ESP32 to ensure deterministic, low-latency communication between the ROS2 network and the physical actuators.",
        "Rich Object Perception on Edge Hardware: Needing accurate scene understanding without relying on heavy off-board compute. Integrated a lightweight CSI camera feed into a CNN pipeline pre-trained on the LVIS dataset, allowing the robot to accurately identify a massive vocabulary of objects during runtime."
      ],
      mediaFolder: "kiwi-drive",
    },
  },
  {
    id: 8,
    title: "Vanguard (eYRC 2023-24)",
    description:
      "Built for the eYRC 2023-24 \"GeoGuide\" theme, Vanguard is an autonomous ESP32-based robot guided by an overhead camera system (\"Watchtower\"). Integrated a custom CNN model to classify simulated war-zone events, enabling the robot to perform real-time A* pathfinding and QGIS geo-tracking to navigate priority targets while avoiding dynamic danger zones.",
    venue: "E-Yantra Competition",
    year: "2023",
    award: null,
    tags: ["CNN", "A* Algorithm", "QGIS", "ESP32", "Image Processing"],
    links: { github: "https://github.com/Adyansh04/eyrc23_gg_1306", demo: "#" },
    details: {
      fullDescription: "Developed for the e-Yantra Robotics Competition (eYRC 2023-24), \"Vanguard\" is a holistic autonomous navigation project focused on bridging overhead perception with ground-level robotics. The mission was to design an ESP32-based line-following robot capable of traversing a simulated, war-torn arena. Instead of relying purely on on-board sensors, the robot receives real-time guidance from a static overhead camera (\"Watchtower\") acting as a central command station, mimicking advanced drone-assisted ground navigation in unpredictable environments.",
      techStack: ["Machine Learning & Vision", "Path Planning", "Hardware & IoT", "Geospatial Tracking"],
      challenges: [
        "Overhead Image Distortion & Event Classification: The overhead \"Watchtower\" camera suffered from lighting variations and noise, making event recognition difficult. Solved by developing a robust CNN pipeline reinforced with data augmentation and noise reduction techniques to accurately classify the five distinct event categories.",
        "Dynamic Priority-Based Routing: The robot needed to visit specific events in a strict priority order while treating other mapped areas as danger zones. Addressed by implementing an adaptive A* pathfinding algorithm that dynamically recalculates optimal routes based on the CNN's real-time classifications.",
        "Real-Time Georeferencing & Telemetry: Tracking the physical robot's exact coordinates on a digital map with minimal latency. Solved by building a telemetry bridge that maps the robot's physical ESP32 odometry and movements directly onto a live QGIS geospatial dashboard."
      ],
      mediaFolder: "vanguard",
    },
  },
  {
    id: 9,
    title: "AgroBot (Omni-Directional Plucking Robot)",
    description:
      "Engineered a ROS2-based autonomous agricultural robot featuring an omni-directional X-drive base, dual ESP32 Micro-ROS firmware, and depth-camera vision. Developed end-to-end mission flows—from YOLO-driven cotton boll detection to Cartographer SLAM navigation and automated manipulator kinematics.",
    venue: "University Project",
    year: "2024",
    award: null,
    tags: ["ROS2", "YOLO", "SLAM", "Micro-ROS", "Computer Vision"],
    links: { github: "https://github.com/Adyansh04/AgroBot", demo: "#" },
    details: {
      fullDescription: "The X-drive base provides omnidirectional movement, enabled by precisely tuned kinematics and motor controllers. Dual ESP32 microcontrollers handle all hardware actuators via a distributed Micro-ROS architecture. A depth camera feeds into the Cartographer SLAM system for real-time simultaneous localization and mapping, while a separate YOLO vision pipeline continuously scans for cotton bolls. Once a boll is identified, the system calculates optimal manipulator joint angles and executes the plucking trajectory. All behaviors integrate into a cohesive mission planning system built with ROS2 action servers.",
      techStack: ["ROS2 & Nav2", "Micro-ROS & ESP32", "YOLO & Depth Vision", "Cartographer SLAM", "Manipulator Kinematics"],
      challenges: [
        "Agricultural Segmentation & Boll Detection: Distinguishing cotton bolls from leaves and branches under natural outdoor lighting. Overcame this by training a specialized YOLO model with extensive field data augmentation and environmental noise injection to achieve robust real-time detection.",
        "Autonomous Manipulator Coordination: Synchronizing high-level mission planning (SLAM-based navigation) with low-level manipulator control (6-DOF picking trajectories). Addressed by designing a hierarchical action-server architecture that accepts target coordinates and computes collision-free picking paths via inverse kinematics.",
        "Robust Field Navigation & Localization: Maintaining accurate localization in GPS-denied outdoor environments with highly repetitive crops. Solved by integrating Cartographer SLAM with a secondary fiducial marker system to maintain loop closure and prevent drift during extended field missions."
      ],
      mediaFolder: "agrobot",
    },
  },
  {
    id: 10,
    title: "Development of Drone Systems",
    description:
      "Developed autonomous navigation systems using the Crazyflie drone with MultiRanger and Flow decks, enabling precise indoor navigation via ROS2, Nav2, and SLAM Toolbox. Worked on Tello EDU drone for various computer vision tasks.",
    venue: "Avignon University",
    year: "2024",
    award: null,
    tags: ["ROS2", "Nav2", "SLAM Toolbox", "Crazyflie", "Computer Vision"],
    links: { github: "https://github.com/Adyansh04/TelloEDU-ROS2", demo: "#" },
    details: {
      fullDescription: "Research project at Avignon University focusing on autonomous drone navigation and computer vision applications using multiple drone platforms including Crazyflie with advanced sensor decks and Tello EDU drones.",
      techStack: ["ROS2 & Nav2", "SLAM Toolbox", "Crazyflie Drone", "Tello EDU", "Computer Vision & OpenCV"],
      challenges: [
        "Indoor Localization without GPS: Implementing robust localization in GPS-denied indoor environments using LiDAR, optical flow, and multi-ranger distance sensors.",
        "Obstacle Avoidance in Confined Spaces: Enabling real-time obstacle detection and dynamic path replanning in narrow corridors and cluttered indoor environments.",
        "Flight Stability & Control: Tuning low-level control parameters for stable autonomous flight while managing multiple sensor inputs with varying update rates."
      ],
      mediaFolder: "drone-systems",
    },
  },
];

function ProjectDetailsModal({ 
  project, 
  isOpen, 
  onClose 
}: { 
  project: typeof projects[0]; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { colors } = useColorTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 z-[9999] overflow-hidden"
          >
            <div className="relative h-full w-full rounded-2xl border border-white/10 bg-[#0a0a0c] overflow-hidden">
              {/* Glowing border effect */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 60px ${colors.primary}10, 0 0 40px ${colors.primary}20`,
                }}
              />
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: colors.primary }} />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-2xl" style={{ borderColor: colors.primary }} />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-2xl" style={{ borderColor: colors.primary }} />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: colors.primary }} />
              
              {/* Close button */}
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 z-10 p-2 rounded-full border border-white/10 bg-black/50 text-white/60 hover:text-white hover:border-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
              
              {/* Content */}
              <div className="h-full overflow-y-auto p-6 md:p-10">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span 
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                      style={{ 
                        borderColor: `${colors.primary}50`,
                        backgroundColor: `${colors.primary}10`,
                        color: colors.primary,
                      }}
                    >
                      <MapPin className="h-3 w-3" />
                      {project.venue}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      <Calendar className="h-3 w-3" />
                      {project.year}
                    </span>
                    {project.award && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                        <Trophy className="h-3 w-3" />
                        {project.award}
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                    {project.title}
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 hover:border-white/30 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Media Gallery Section */}
                {project.details.mediaFolder && (
                  <div className="mb-8">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-white/40 mb-4">
                      Media Gallery
                    </h3>
                    <MediaCarousel project={project.details.mediaFolder} primaryColor={colors.primary} />
                  </div>
                )}
                
                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-white/40 mb-4">
                    Project Overview
                  </h3>
                  <div className="p-6 rounded-xl border border-white/10 bg-white/5">
                    <p className="text-white/70 leading-relaxed mb-4">
                      {project.description}
                    </p>
                    <p className="text-white/50 leading-relaxed">
                      {project.details.fullDescription}
                    </p>
                  </div>
                </div>
                
                {/* Tech Stack & Challenges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-sm font-mono uppercase tracking-wider text-white/40 mb-4">
                      Tech Stack
                    </h3>
                    <div className="space-y-2">
                      {project.details.techStack.map((tech, i) => (
                        <motion.div
                          key={tech}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 hover:border-white/10 transition-colors"
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: colors.primary }}
                          />
                          <span className="text-white/70 text-sm font-mono">{tech}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-mono uppercase tracking-wider text-white/40 mb-4">
                      Key Challenges
                    </h3>
                    <div className="space-y-2">
                      {project.details.challenges.map((challenge, i) => (
                        <motion.div
                          key={challenge}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 hover:border-white/10 transition-colors"
                        >
                          <FileText className="w-4 h-4" style={{ color: `${colors.primary}80` }} />
                          <span className="text-white/70 text-sm">{challenge}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Links */}
                <div className="flex gap-4 pt-4 border-t border-white/10">
                  {project.links.github !== "#" && (
                    <motion.a
                      href={project.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 transition-all duration-300 hover:border-white/30 hover:text-white"
                    >
                      <Github className="h-4 w-4" />
                      <span>View Source Code</span>
                    </motion.a>
                  )}
                  {project.links.demo !== "#" && (
                    <motion.a
                      href={project.links.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm transition-all duration-300"
                      style={{
                        borderColor: `${colors.primary}50`,
                        backgroundColor: `${colors.primary}10`,
                        color: colors.primary,
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Live Demo</span>
                    </motion.a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ProjectMedia({ project, isEven }: { project: typeof projects[0]; isEven: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const { colors } = useColorTheme();

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative aspect-[4/3] w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl">
        {/* Per-project animated glyph (SVG line-art) */}
        <ProjectGlyph folder={project.details.mediaFolder} className="z-10" />

        <div 
          className="absolute inset-0 z-20" 
          style={{
            background: `linear-gradient(to bottom right, ${colors.primary}08, transparent, ${colors.primary}1a)`,
          }}
        />

        <CornerBrackets isHovered={isHovered} />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <div 
            className="rounded border px-2 py-1 font-mono text-xs"
            style={{
              borderColor: `${colors.primary}4d`,
              backgroundColor: `${colors.primary}1a`,
              color: colors.primary,
            }}
          >
            PRJ-{String(project.id).padStart(3, "0")}
          </div>
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span 
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: colors.primary }}
            />
            <span 
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
          </span>
          <span className="font-mono text-xs" style={{ color: `${colors.primary}b3` }}>ACTIVE</span>
        </div>
      </div>

      <motion.div
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute -inset-px rounded-2xl blur-xl"
        style={{
          background: `linear-gradient(to right, ${colors.primary}33, transparent, ${colors.primary}33)`,
        }}
      />
    </motion.div>
  );
}

function CornerBrackets({ isHovered }: { isHovered: boolean }) {
  const { colors } = useColorTheme();
  const bracketSize = 30;
  const strokeWidth = 2;
  const color = isHovered ? colors.primary : `${colors.primary}80`;
  const glow = isHovered ? `drop-shadow(0 0 8px ${colors.primary}cc)` : "none";

  const corners = [
    { position: "top-0 left-0", rotate: 0 },
    { position: "top-0 right-0", rotate: 90 },
    { position: "bottom-0 right-0", rotate: 180 },
    { position: "bottom-0 left-0", rotate: 270 },
  ];

  return (
    <>
      {corners.map((corner, i) => (
        <motion.svg
          key={i}
          className={`absolute ${corner.position} transition-all duration-300`}
          width={bracketSize}
          height={bracketSize}
          style={{ filter: glow, transform: `rotate(${corner.rotate}deg)` }}
          animate={{ scale: isHovered ? 1.1 : 1 }}
        >
          <path
            d={`M ${strokeWidth} ${bracketSize} L ${strokeWidth} ${strokeWidth} L ${bracketSize} ${strokeWidth}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
          />
        </motion.svg>
      ))}
    </>
  );
}

function ProjectContent({ project, isEven }: { project: typeof projects[0]; isEven: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { colors } = useColorTheme();

  return (
    <>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: isEven ? 50 : -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="flex flex-col justify-center"
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span 
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: `${colors.primary}4d`,
              backgroundColor: `${colors.primary}1a`,
              color: colors.primary,
            }}
          >
            <MapPin className="h-3 w-3" />
            {project.venue}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
            <Calendar className="h-3 w-3" />
            {project.year}
          </span>
          {project.award && (
            <motion.span
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400"
            >
              <Trophy className="h-3 w-3" />
              {project.award}
            </motion.span>
          )}
        </div>

        <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
          {project.title}
        </h3>

        <p className="mb-6 text-sm leading-relaxed text-white/60 md:text-base">
          {project.description}
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {project.tags.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="group relative overflow-hidden rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 transition-all duration-300 hover:border-[var(--hover-border)] hover:text-[var(--hover-text)]"
              style={{
                ["--hover-border" as string]: `${colors.primary}80`,
                ["--hover-text" as string]: colors.primary,
              }}
            >
              <span className="relative z-10">{tag}</span>
              <div 
                className="absolute inset-0 -translate-x-full transition-transform duration-500 group-hover:translate-x-full"
                style={{
                  background: `linear-gradient(to right, transparent, ${colors.primary}1a, transparent)`,
                }}
              />
            </motion.span>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          {/* View Details Button */}
          <motion.button
            onClick={() => {
              console.log("[v0] View Details clicked, opening modal for:", project.title);
              setIsModalOpen(true);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border px-4 py-2 text-sm transition-all duration-300 cursor-pointer"
            style={{
              borderColor: `${colors.primary}80`,
              backgroundColor: `${colors.primary}1a`,
              color: colors.primary,
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent, ${colors.primary}20, transparent)`,
              }}
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <Expand className="h-4 w-4 relative z-10 pointer-events-none" />
            <span className="relative z-10 pointer-events-none">View Details</span>
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none"
              style={{ backgroundColor: colors.primary }}
            />
          </motion.button>
          
          {project.links.github !== "#" && (
            <motion.a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              <Github className="h-4 w-4" />
              <span>Source</span>
            </motion.a>
          )}
          {project.links.demo !== "#" && (
            <motion.a
              href={project.links.demo}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-all duration-300 hover:border-white/30 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Live Demo</span>
            </motion.a>
          )}
        </div>
      </motion.div>
      
      <ProjectDetailsModal 
        project={project} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

export function ProjectsGrid() {
  const { colors } = useColorTheme();
  
  return (
    <section id="projects" className="relative min-h-screen bg-[#09090B] px-4 py-24 md:px-8 lg:px-16">
      {/* Animated grid background */}
      <AnimatedGridBackground 
        gridSize={60} 
        lineOpacity={0.04} 
        pulseSpeed={6}
        showPulse={true}
      />
      
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, ${colors.primary}0d 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div 
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
            style={{
              borderColor: `${colors.primary}4d`,
              backgroundColor: `${colors.primary}1a`,
            }}
          >
            <span className="relative flex h-2 w-2">
              <span 
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: colors.primary }}
              />
              <span 
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: colors.primary }}
              />
            </span>
            <span className="font-mono text-xs" style={{ color: colors.primary }}>
              <ScrambleText text="RESEARCH & PROJECTS" scrambleSpeed={40} />
            </span>
          </div>
          <h2 className="text-balance text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            <GlitchText intensity="low">Engineering the Future</GlitchText>
          </h2>
          <TextRevealOnScroll direction="up" delay={0.3}>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              A showcase of autonomous systems, computer vision pipelines, and
              robotics research pushing the boundaries of machine intelligence.
            </p>
          </TextRevealOnScroll>
        </motion.div>

        <div className="space-y-24 lg:space-y-32">
          {projects.map((project, index) => {
            const isEven = index % 2 === 1;
            
            return (
              <ParallaxScale key={project.id} scaleRange={[0.95, 1.02]}>
                <div
                  className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                    isEven ? "lg:[direction:rtl]" : ""
                  }`}
              >
                <div className={isEven ? "lg:[direction:ltr]" : ""}>
                  <ProjectMedia project={project} isEven={isEven} />
                </div>
                <div className={isEven ? "lg:[direction:ltr]" : ""}>
                  <ProjectContent project={project} isEven={isEven} />
                </div>
              </div>
            </ParallaxScale>
            );
          })}
        </div>
      </div>
    </section>
  );
}
