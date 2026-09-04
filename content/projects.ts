// GENERATED 2026-09-03 from the pre-redesign components on branch main (verbatim). Edit by hand from here on.
import type { Project } from './types';

export const projects: Project[] = [
  {
    "id": 1,
    "title": "Go2 Autonomous Inspection (Unitree Go2)",
    "description": "A simulation-first ROS2 stack that lets a Unitree Go2 quadruped autonomously inspect an unknown facility — driven end-to-end by plain-English commands. The robot maps the area on its own, splits it into rooms (\"zones\"), then walks each zone and reports what it sees using an open-vocabulary camera detector, all triggered through an MCP server bridged to Claude.",
    "venue": "Europe Embodied Hackathon",
    "year": "2026",
    "award": null,
    "tags": [
      "ROS2 Jazzy",
      "RTAB-Map SLAM",
      "Nav2",
      "YOLOE",
      "MCP / Claude"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/go2-ros2-inspection",
      "demo": "#"
    },
    "details": {
      "fullDescription": "Built on ROS2 Jazzy and Gazebo Harmonic, the stack runs the full mapping → segmentation → inspection → report pipeline with zero hard-coded waypoints. A C++ frontier_explorer selects goals by information gain (not nearest-frontier) with a blacklist/recovery state machine, while RTAB-Map fuses a 4D L1 LiDAR with odometry into a teleport-proof map→odom transform and a 2D grid. Saved maps are turned into labelled, navigable rooms by a watershed-based zone segmenter (obstacle-island fill + distance-transform room cores + door-aware separation). For each zone the robot samples safe interior viewpoints, drives there with Nav2, performs a slow in-place 360° spin while a YOLOE open-vocabulary detector runs continuously, projects every detection into the map frame via the depth camera, de-duplicates by class and world position, crops each unique object, and emits per-zone and facility-wide reports. A FastMCP server exposes the entire mission as 14 natural-language tools, so commands like \"explore the area\", \"what zones did you find?\", \"inspect zone 1\", and \"give me the report\" are translated by Claude into ROS service calls. Because every node mirrors the real-Go2 topic contract, the same code ports unchanged from simulation to hardware.",
      "techStack": [
        "ROS2 Jazzy & Gazebo Harmonic",
        "RTAB-Map LiDAR Graph-SLAM",
        "Nav2 & Frontier Exploration (C++)",
        "YOLOE Open-Vocabulary Vision",
        "FastMCP + Claude (MCP)",
        "CHAMP Quadruped Gait"
      ],
      "challenges": [
        "Natural-Language Mission Control via MCP: Translating ambiguous plain-English requests into safe, deterministic robot behavior. Solved by building a FastMCP server that maps 14 mission tools onto a thin ROS2 service layer, normalizes zone references (\"room 3\" / \"zone 3\" / \"3\" → zone_3), and runs heavy capabilities as isolated subprocesses so the bridge never fights rclpy threading.",
        "Map-Grounded Open-Vocabulary Localization: Turning noisy 2D detections from a spinning camera into a clean object list. Addressed by projecting each YOLOE detection into the map frame through the depth camera, validating it against the occupancy grid to reject phantoms floating in mapped free space, and de-duplicating repeated sightings by class and world position within a tunable radius.",
        "Hard-Coded-Pose-Free Autonomy: Operating in a never-before-seen facility with no manual waypoints. Solved by pairing information-gain frontier exploration (with stuck-detection, blacklisting, and TTL recovery) with a watershed zone segmenter that converts any saved map into labelled rooms, each carrying a guaranteed-open navigation point for the inspection sweep."
      ],
      "mediaFolder": "go2-inspection"
    }
  },
  {
    "id": 2,
    "title": "AI+Robotics Hackathon 2025 (RWTH Aachen)",
    "description": "Developed under intense hackathon constraints at RWTH Aachen, this project secured the Best Technical Implementation prize by bridging advanced spatial computer vision with real-time robotic manipulation. The core engineering objective was to enable a robotic manipulator to execute reliable pick-and-place tasks within a cluttered, unpredictable workspace without pre-mapping the environment.",
    "venue": "RWTH Aachen",
    "year": "2025",
    "award": "Best Technical Implementation",
    "tags": [
      "Isaac Sim",
      "MoveIt2",
      "NvBlox",
      "FoundationPose"
    ],
    "links": {
      "github": "#",
      "demo": "#"
    },
    "details": {
      "fullDescription": "The architecture relies on an integrated ROS2 pipeline. First, a depth camera generates a dense, real-time 3D scene mesh using NvBlox. Concurrently, NVIDIA FoundationPose estimates the 6D pose and generates 3D bounding boxes for target objects. To prevent the robot from classifying the target object itself as a collision obstacle, the system dynamically subtracts the target object's spatial data from the environmental TSDF grid before publishing the clean background mesh directly into the MoveIt planning scene for immediate path generation. The complete loop was fully validated in high-fidelity NVIDIA Isaac Sim before deployment.",
      "techStack": [
        "Isaac Sim",
        "MoveIt2",
        "NvBlox",
        "FoundationPose",
        "ROS2 Humble"
      ],
      "challenges": [
        "Dynamic Obstacle Isolation via Mesh Subtraction: Overcame the critical issue where the target object would register as a collision asset, causing the path planner to abort the grasp phase. Solved this by programmatic background mesh subtraction.",
        "Robust 6D Object Pose Estimation: Achieved high-accuracy pick positioning under varying illumination and object occlusions by utilizing a zero-shot model architecture to map tight 3D coordinates without localized model training.",
        "Perception-to-Planning Latency Reduction: Synchronized high-bandwidth volumetric mesh generation with the active MoveIt planning scene, optimizing data transformation lines to avoid path generation timeouts during sudden environment shifts."
      ],
      "mediaFolder": "ai-robotics"
    }
  },
  {
    "id": 3,
    "title": "OLIVE: Optimization of Lidar, Inertial, Vision & Encoders",
    "description": "A graph-based multi-sensor fusion backend that fuses LiDAR, tightly-coupled IMU, wheel encoders, WhyCode fiducial markers, and monocular visual odometry into one iSAM2 factor graph for drift-free AMR localization. Publishes two synchronized odometry outputs — a globally-accurate map-frame pose and a smooth, jump-free local stream a Nav2 controller can drive on directly — validated to 2.0 cm RMSE over three 56 m loops.",
    "venue": "Personal Project",
    "year": "2026",
    "award": null,
    "tags": [
      "ROS2 Jazzy",
      "GTSAM / iSAM2",
      "LiDAR-Inertial Odometry",
      "Sensor Fusion",
      "Nav2"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/olive",
      "demo": "#"
    },
    "details": {
      "fullDescription": "Built on ROS2 Jazzy with a GTSAM iSAM2 factor-graph backend, OLIVE runs a single incremental keyframe graph that fuses five modalities as runtime-togglable factors: a LiDAR-inertial frontend (curvature-feature scan-to-map matching, gyro-seeded), tightly-coupled IMU preintegration with online gyro/accel bias estimation, wheel odometry as a metric-scale anchor, WhyCode fiducial markers treated as TagSLAM-style landmark variables, and a wheel-scaled monocular visual-odometry front-end — with ICP loop closure and a soft planar prior on top. The backend publishes two REP-105-compliant outputs from that same graph: `/olive/odometry` (map-frame, globally accurate, allowed to jump when a marker or loop closure corrects drift) and `/olive/odometry_local` (odom-frame, ~50 Hz, continuous) — so every global correction lands in the `map→odom` transform while the stream a Nav2 controller actually drives on never teleports, making OLIVE a drop-in AMCL replacement.",
      "techStack": [
        "ROS2 Jazzy & GTSAM (iSAM2)",
        "LiDAR-Inertial Odometry (C++20)",
        "Tightly-Coupled IMU Preintegration",
        "WhyCode Fiducial Landmarks",
        "Monocular Visual Odometry"
      ],
      "challenges": [
        "Keeping Global Corrections Out of the Controller's Path (REP-105 Split): AMR controllers need continuous odometry, but global corrections — loop closures, marker anchors — must not appear as teleports. Solved by publishing two synchronized outputs from the same graph: a map-frame pose that is allowed to jump, and a ~50 Hz odom-frame stream where the correction lands entirely in `map→odom` — verified to a 2.4 cm max step across three 56 m loops.",
        "Fusing a Weak, Drifting Modality Without Hurting Accuracy: Monocular VO's translation scale is unobservable on a planar robot and its heading drifts uncorrected, so naively fusing it risks pulling the whole estimate off course. Solved by scaling VO translation from wheel odometry and entering it as a loose, robust factor — an A/B test showed tight sigmas blow the world-frame estimate out to 29 m, while loose sigmas keep steady-state accuracy at ~2 cm versus 3.6 cm with VO fully disabled, turning a weak modality into free robustness during LiDAR dropouts.",
        "Recovering from Total Sensor Dropout via Landmarks: Long GPS-denied corridors and sensor blackouts cause conventional filters to diverge outright. Solved by treating WhyCode markers as TagSLAM-style landmark variables in the same graph — a surveyed marker resolves an 8.5 m spawn-frame offset to centimeters on first sighting, and in fault-injection testing a 25 s LiDAR blackout recovers to 1.1 cm final error with markers versus 4.9 m of unrecoverable drift with markers disabled."
      ],
      "mediaFolder": "olive"
    }
  },
  {
    "id": 4,
    "title": "WhyCode ROS2 Package (Addverb Technologies)",
    "description": "Developed whycode_vision, a high-performance ROS2 package for 6-DOF WhyCon/WhyCode fiducial marker localization. Leveraged C++ and AVX-512 SIMD to slash CPU utilization from 180% to 10-15% while enabling multi-marker decoding, hysteresis-based ID stabilization, and hierarchical triangulation for AMRs.",
    "venue": "Addverb Technologies",
    "year": "2024",
    "award": null,
    "tags": [
      "C++",
      "AVX-512 SIMD",
      "ROS2",
      "Computer Vision"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/whycode",
      "demo": "#"
    },
    "details": {
      "fullDescription": "During my Mobile Robotics internship at Addverb Technologies, I was tasked with eliminating a major computational bottleneck in the AMR perception stack. The deployed legacy pipeline for the WhyCode fiducial marker tracking system was functionally accurate but lacked hardware-level optimization, consuming an entire dual-core allocation (180-190% CPU load) on the robot's onboard industrial computer and starving downstream localization and navigation systems. The goal was to build a highly optimized, modular ROS2 package capable of detecting multiple markers, decoding IDs, and estimating 6-DOF poses at high framerates.",
      "techStack": [
        "C++ & AVX-512 SIMD",
        "ROS2 (rclcpp, tf2)",
        "Computer Vision (OpenCV 4.2)",
        "Sensors & Calibration"
      ],
      "challenges": [
        "High CPU Load & Irregular Vectorization: Classical connected-component labeling and flood-fill operations rely on unpredictable pixel branch paths that break native auto-vectorization. Resolved by writing custom unrolled loops with explicit AVX mask registers via xsimd, dropping CPU usage to 10-15% at 640x480 resolution.",
        "Flickering IDs & Tracking Instability: Fast camera motion and motion blur caused WhyCode IDs to flicker or drop out entirely. Addressed by implementing a hysteresis-based ID stabilizer paired with lightweight 2D tracking to maintain continuous marker tracks over time.",
        "Robust Localization from Multiple Markers: Relying on a single marker for 6-DOF pose estimation can lead to orientation ambiguity. Developed dedicated hierarchical triangulation nodes (four_marker and two_marker) that use known marker layouts to compute highly stable, error-resistant odometry."
      ],
      "mediaFolder": "whycode"
    }
  },
  {
    "id": 5,
    "title": "Sepsis Atlas (Clinical AI Evidence Processing)",
    "description": "Developed a local-first RAG intelligence platform to convert unstructured medical research into schema-validated clinical evidence tables. Integrated hierarchical parent-child chunking with ChromaDB, Pydantic schema-driven data extraction via Claude-3.5-Sonnet, and programmatic source-quote verification to ensure hallucination-free output.",
    "venue": "Personal Project",
    "year": "2024",
    "award": null,
    "tags": [
      "RAG",
      "Vector DB",
      "Pydantic",
      "Claude AI"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/sepsis-atlas/tree/main",
      "demo": "#"
    },
    "details": {
      "fullDescription": "Sepsis Atlas was built to automate the time-consuming and error-prone process of clinical meta-analyses, enabling medical professionals to transform thousands of pages of unstructured academic PDFs into structured, queryable databases. Built for three core clinical use cases—counterfactual mortality estimation, phenotype extraction, and biomarker ranking—the system enables clinicians to interact with a reliable, source-grounded evidence dashboard without relying on centralized, cloud-hosted server infrastructures.",
      "techStack": [
        "Vector DBs & RAG",
        "Schema-Driven Extraction",
        "Streamlit Architecture",
        "Clinical Verification Pipelines"
      ],
      "challenges": [
        "Tabular and Layout-Aware PDF Extraction: Standard PDF segmenters split tabular clinical stats across unrelated text chunks, causing extraction failures. Overcame this by building layout-aware ingestion routines with Visual Language Model (VLM) summary hooks.",
        "Source-Grounded Hallucination Prevention: Clinical intelligence applications cannot tolerate generative hallucinations or factual misattributions. Solved this by developing a validation module that parses extracted fields and strictly traces quotes against raw, local source document segments.",
        "Schema Optimization for Complex Use Cases: Reconciling different paper formats into uniform schemas for highly complex scientific tasks (such as mortality statistics and clustering descriptions). Addressed by building modular, use-case-specific validation rules with Pydantic and self-repairing JSON structural checks."
      ],
      "mediaFolder": "sepsis-atlas"
    }
  },
  {
    "id": 6,
    "title": "R2 - ABU Robocon 2024",
    "description": "Led the software and systems engineering for \"R2,\" a fully autonomous, four-wheel mecanum drive robot for the ABU Robocon 2024 competition. Engineered a comprehensive ROS2 and Micro-ROS workspace featuring YOLO object tracking, LSA08 line following, and TF-Luna LiDAR alignment.",
    "venue": "ABU Robocon",
    "year": "2024",
    "award": null,
    "tags": [
      "ROS2 Humble",
      "Micro-ROS",
      "YOLO",
      "Nav2",
      "Mecanum"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/R2-Robocon",
      "demo": "#"
    },
    "details": {
      "fullDescription": "For the ABU Robocon 2024 competition, our team was tasked with building a dual-robot system to complete complex, time-sensitive arena tasks. I led the primary development of \"R2,\" the fully autonomous half of the system. The objective was to engineer a highly agile, omnidirectional platform capable of navigating the arena, identifying specific targets (balls and silos), and executing precise alignment and manipulation maneuvers entirely without human intervention.",
      "techStack": [
        "ROS2 Humble & Nav2",
        "Micro-ROS",
        "Computer Vision & YOLO",
        "Sensor Integration"
      ],
      "challenges": [
        "Microcontroller-to-ROS2 Synchronization: Bridging the gap between high-level ROS2 logic and low-level sensor hardware. Overcame this by engineering a reliable Micro-ROS network to stream TF-Luna distance data and LSA08 line states with near-zero latency for instant alignment corrections.",
        "Real-Time Dynamic Object Tracking: Identifying and tracking moving balls and static silos under glaring arena lighting. Addressed by deploying optimized YOLO object detection pipelines and custom ROS2 message interfaces to accurately feed visual target coordinates to the navigation stack.",
        "Omnidirectional Mecanum Kinematics: Ensuring smooth, drift-free strafing and rotation during high-speed arena navigation. Solved by tuning custom motor controller nodes and validating the physical robot's spatial parameters via r2_description URDF modeling."
      ],
      "mediaFolder": "abu-robocon"
    }
  },
  {
    "id": 7,
    "title": "Kiwi Drive Robot",
    "description": "Engineered a custom, small-scale three-wheeled omnidirectional \"Kiwi Drive\" robot from the ground up. Bridged physical hardware (ESP32, N20 motors) with high-level ROS2/Nav2 architecture via Micro-ROS, featuring EKF sensor fusion and a CNN-based vision pipeline trained on the LVIS dataset.",
    "venue": "Personal Project",
    "year": "2024",
    "award": null,
    "tags": [
      "ROS2",
      "Micro-ROS",
      "EKF",
      "CNN",
      "Gazebo"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/omnibot",
      "demo": "#"
    },
    "details": {
      "fullDescription": "The Kiwi Drive project was conceived as a highly maneuverable, cost-effective platform to test and validate complex navigation and computer vision algorithms. Built on a custom acrylic chassis and powered by N20 encoder motors, the three-wheeled omnidirectional design provides unique holonomic movement capabilities. The goal was to build an end-to-end robotics pipeline—from mechanical assembly and bare-metal microcontroller programming to advanced simulation and AI-driven perception.",
      "techStack": [
        "Hardware Integration",
        "State Estimation",
        "Computer Vision",
        "Simulation & Navigation"
      ],
      "challenges": [
        "Omnidirectional Odometry Drift: Three-wheeled kinematics create complex slip dynamics, causing pure wheel odometry to drift rapidly over time. Solved by tuning an Extended Kalman Filter (EKF) to tightly fuse high-rate ESP32 encoder ticks with IMU data for reliable state estimation.",
        "Sim-to-Real Hardware Bridging: Migrating from a perfect Gazebo simulation environment to the physical constraints of N20 motors. Addressed by deploying Micro-ROS on the ESP32 to ensure deterministic, low-latency communication between the ROS2 network and the physical actuators.",
        "Rich Object Perception on Edge Hardware: Needing accurate scene understanding without relying on heavy off-board compute. Integrated a lightweight CSI camera feed into a CNN pipeline pre-trained on the LVIS dataset, allowing the robot to accurately identify a massive vocabulary of objects during runtime."
      ],
      "mediaFolder": "kiwi-drive"
    }
  },
  {
    "id": 8,
    "title": "Vanguard (eYRC 2023-24)",
    "description": "Built for the eYRC 2023-24 \"GeoGuide\" theme, Vanguard is an autonomous ESP32-based robot guided by an overhead camera system (\"Watchtower\"). Integrated a custom CNN model to classify simulated war-zone events, enabling the robot to perform real-time A* pathfinding and QGIS geo-tracking to navigate priority targets while avoiding dynamic danger zones.",
    "venue": "E-Yantra Competition",
    "year": "2023",
    "award": null,
    "tags": [
      "CNN",
      "A* Algorithm",
      "QGIS",
      "ESP32",
      "Image Processing"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/eyrc23_gg_1306",
      "demo": "#"
    },
    "details": {
      "fullDescription": "Developed for the e-Yantra Robotics Competition (eYRC 2023-24), \"Vanguard\" is a holistic autonomous navigation project focused on bridging overhead perception with ground-level robotics. The mission was to design an ESP32-based line-following robot capable of traversing a simulated, war-torn arena. Instead of relying purely on on-board sensors, the robot receives real-time guidance from a static overhead camera (\"Watchtower\") acting as a central command station, mimicking advanced drone-assisted ground navigation in unpredictable environments.",
      "techStack": [
        "Machine Learning & Vision",
        "Path Planning",
        "Hardware & IoT",
        "Geospatial Tracking"
      ],
      "challenges": [
        "Overhead Image Distortion & Event Classification: The overhead \"Watchtower\" camera suffered from lighting variations and noise, making event recognition difficult. Solved by developing a robust CNN pipeline reinforced with data augmentation and noise reduction techniques to accurately classify the five distinct event categories.",
        "Dynamic Priority-Based Routing: The robot needed to visit specific events in a strict priority order while treating other mapped areas as danger zones. Addressed by implementing an adaptive A* pathfinding algorithm that dynamically recalculates optimal routes based on the CNN's real-time classifications.",
        "Real-Time Georeferencing & Telemetry: Tracking the physical robot's exact coordinates on a digital map with minimal latency. Solved by building a telemetry bridge that maps the robot's physical ESP32 odometry and movements directly onto a live QGIS geospatial dashboard."
      ],
      "mediaFolder": "vanguard"
    }
  },
  {
    "id": 9,
    "title": "AgroBot (Omni-Directional Plucking Robot)",
    "description": "Engineered a ROS2-based autonomous agricultural robot featuring an omni-directional X-drive base, dual ESP32 Micro-ROS firmware, and depth-camera vision. Developed end-to-end mission flows—from YOLO-driven cotton boll detection to Cartographer SLAM navigation and automated manipulator kinematics.",
    "venue": "University Project",
    "year": "2024",
    "award": null,
    "tags": [
      "ROS2",
      "YOLO",
      "SLAM",
      "Micro-ROS",
      "Computer Vision"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/AgroBot",
      "demo": "#"
    },
    "details": {
      "fullDescription": "The X-drive base provides omnidirectional movement, enabled by precisely tuned kinematics and motor controllers. Dual ESP32 microcontrollers handle all hardware actuators via a distributed Micro-ROS architecture. A depth camera feeds into the Cartographer SLAM system for real-time simultaneous localization and mapping, while a separate YOLO vision pipeline continuously scans for cotton bolls. Once a boll is identified, the system calculates optimal manipulator joint angles and executes the plucking trajectory. All behaviors integrate into a cohesive mission planning system built with ROS2 action servers.",
      "techStack": [
        "ROS2 & Nav2",
        "Micro-ROS & ESP32",
        "YOLO & Depth Vision",
        "Cartographer SLAM",
        "Manipulator Kinematics"
      ],
      "challenges": [
        "Agricultural Segmentation & Boll Detection: Distinguishing cotton bolls from leaves and branches under natural outdoor lighting. Overcame this by training a specialized YOLO model with extensive field data augmentation and environmental noise injection to achieve robust real-time detection.",
        "Autonomous Manipulator Coordination: Synchronizing high-level mission planning (SLAM-based navigation) with low-level manipulator control (6-DOF picking trajectories). Addressed by designing a hierarchical action-server architecture that accepts target coordinates and computes collision-free picking paths via inverse kinematics.",
        "Robust Field Navigation & Localization: Maintaining accurate localization in GPS-denied outdoor environments with highly repetitive crops. Solved by integrating Cartographer SLAM with a secondary fiducial marker system to maintain loop closure and prevent drift during extended field missions."
      ],
      "mediaFolder": "agrobot"
    }
  },
  {
    "id": 10,
    "title": "Development of Drone Systems",
    "description": "Developed autonomous navigation systems using the Crazyflie drone with MultiRanger and Flow decks, enabling precise indoor navigation via ROS2, Nav2, and SLAM Toolbox. Worked on Tello EDU drone for various computer vision tasks.",
    "venue": "Avignon University",
    "year": "2024",
    "award": null,
    "tags": [
      "ROS2",
      "Nav2",
      "SLAM Toolbox",
      "Crazyflie",
      "Computer Vision"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/TelloEDU-ROS2",
      "demo": "#"
    },
    "details": {
      "fullDescription": "Research project at Avignon University focusing on autonomous drone navigation and computer vision applications using multiple drone platforms including Crazyflie with advanced sensor decks and Tello EDU drones.",
      "techStack": [
        "ROS2 & Nav2",
        "SLAM Toolbox",
        "Crazyflie Drone",
        "Tello EDU",
        "Computer Vision & OpenCV"
      ],
      "challenges": [
        "Indoor Localization without GPS: Implementing robust localization in GPS-denied indoor environments using LiDAR, optical flow, and multi-ranger distance sensors.",
        "Obstacle Avoidance in Confined Spaces: Enabling real-time obstacle detection and dynamic path replanning in narrow corridors and cluttered indoor environments.",
        "Flight Stability & Control: Tuning low-level control parameters for stable autonomous flight while managing multiple sensor inputs with varying update rates."
      ],
      "mediaFolder": "drone-systems"
    }
  }
];
