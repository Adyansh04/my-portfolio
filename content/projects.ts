// Content restructured 2026-09-11: a one-line gist and three scannable points carry the card,
// hard numbers are pulled out as metrics, and each challenge is split into what went wrong and
// what fixed it. The original prose is kept verbatim in `fullDescription` and `description`, so
// nothing was dropped, and no fact here is new.
import type { Project } from './types';

export const projects: Project[] = [
  {
    "id": 11,
    "title": "Grove-G1: Humanoid Autonomy Stack (Unitree G1)",
    "description": "An autonomy stack for the Unitree G1 humanoid, built on ROS 2 Jazzy and developed simulation-first against unitree_mujoco. The robot maps a facility with SLAM Toolbox, localizes against the saved map, and drives itself to a goal under Nav2, while its own learned locomotion policy keeps it balanced by commanding all 29 body motors, with no onboard controller underneath. MoveIt plans for either arm or both against a live LiDAR octomap, and a BehaviorTree.CPP mission picks a cube up at one workbench, carries it across the building and puts it down on another.",
    "venue": "Personal Project",
    "year": "2026",
    "award": null,
    "tags": [
      "ROS2 Jazzy",
      "Nav2",
      "MoveIt2",
      "SLAM Toolbox",
      "BehaviorTree.CPP",
      "GR00T N1.7"
    ],
    "links": {
      "github": "https://github.com/Adyansh04/grove-g1",
      "demo": "#"
    },
    "details": {
      "approach": [
        "Simulation-first in unitree_mujoco, which speaks the real robot's DDS channels, so hardware is a domain-ID change",
        "A ros2_control hardware interface is the only writer on rt/lowcmd: all 29 body motors at 200 Hz",
        "A learned locomotion policy at 50 Hz claims the legs and waist, and takes Nav2's /cmd_vel directly",
        "The 14 arm joints stay on a JointTrajectoryController, so MoveIt executes while the policy balances",
        "SLAM Toolbox maps, AMCL localizes, and FAST-LIO2 on the Mid360 provides odometry for hardware",
        "A BehaviorTree.CPP mission sequences navigate, approach, pick, carry and place"
      ],
      "challenges": [
        {
          "title": "Nav2 stops short of the arm's reach",
          "problem": "Nav2 parks within 0.5 m of a goal, but the arm's usable window is only about 0.2 m wide.",
          "solution": "A base-approach skill walks the last half metre under closed-loop control against the measured object rather than the map, and the mission tree runs it after navigation, never alongside it."
        },
        {
          "title": "No controller underneath to catch a fall",
          "problem": "Commanding rt/lowcmd means owning balance, and any joint no controller claims is left unpowered.",
          "solution": "Exactly one writer on the channel, with control-mode ownership made explicit through ros2_control: the policy claims the 12 leg joints and the waist, and the arms stay free for MoveIt."
        },
        {
          "title": "A learned policy behind a safety gate",
          "problem": "A vision-language-action policy proposes joint targets with no idea what is in the way.",
          "solution": "Every action chunk is checked against MoveIt's live planning scene and refused before the arm moves. The pipeline runs end to end with a 3B model; the base checkpoint still needs fine-tuning on demonstrations from this robot to grasp."
        }
      ],
      "fullDescription": "Grove-G1 is an autonomy stack for the Unitree G1 humanoid on ROS 2 Jazzy, developed simulation-first against unitree_mujoco. Because the simulator speaks the same DDS channels as the real robot, the hardware interface, the navigation stack and the control-authority logic carry over without code changes: moving to the physical G1 is a domain-ID and interface change, not a rewrite. Balance is the stack's own job. MotionSwitcherClient releases the onboard mode, a ros2_control hardware interface becomes the only writer on rt/lowcmd for all 29 body motors at 200 Hz, and a learned locomotion policy running at 50 Hz inside a ros2_control controller claims the 12 leg joints plus waist roll and pitch. The 14 arm joints stay on an ordinary JointTrajectoryController, so MoveIt executes while the policy keeps the robot up. MoveIt plans for either arm or both together, collision-checked against a live octomap built from the LiDAR, and each Dex3-1 hand is its own planning group with open and closed postures. SLAM Toolbox maps the facility, AMCL localizes against the saved map, and Nav2 drives to goals, its /cmd_vel consumed directly by the policy. For hardware, FAST-LIO2 on the Mid360 provides odometry; in simulation it tracks ground truth to about 10 cm over a 21 m walk. Pick and place are served as actions, and a BehaviorTree.CPP tree, editable in Groot2, sequences them with navigation into a mission that drives to a workbench, walks the last half metre under closed-loop control, picks a cube up, carries it across the building and puts it down on a bench. On top of that, a vision-language-action policy proposes joint targets and every chunk is checked against the planning scene before it runs. The pipeline works end to end; the pretrained policy reaches toward the cube but does not grasp it reliably, which needs fine-tuning on demonstrations from this robot.",
      "techStack": [
        "ROS 2 Jazzy, C++20 & ros2_control",
        "unitree_mujoco & unitree_sdk2 (DDS)",
        "Nav2, SLAM Toolbox & AMCL",
        "MoveIt 2 with a LiDAR octomap",
        "BehaviorTree.CPP & Groot2",
        "FAST-LIO2 on the Livox Mid360",
        "GR00T N1.7 behind a planning-scene gate"
      ],
      "mediaFolder": "grove-g1"
    },
    "gist": "A Unitree G1 humanoid that keeps its own balance while it maps, navigates, and carries things across a building.",
    "points": [
      "A learned 50 Hz walking policy owns all 29 motors, with no onboard controller underneath",
      "Nav2 drives it between rooms; MoveIt plans both arms against a live LiDAR octomap",
      "A behaviour tree runs pick, carry and place end to end in simulation"
    ],
    "metrics": [
      {
        "value": "29",
        "label": "motors under its own policy"
      },
      {
        "value": "50 Hz",
        "label": "learned balance"
      },
      {
        "value": "~10 cm",
        "label": "LIO drift over 21 m"
      }
    ]
  },
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
      "approach": [
        "A C++ frontier explorer picks goals by information gain, with blacklisting and recovery",
        "RTAB-Map fuses 4D LiDAR with odometry into a teleport-proof map→odom transform",
        "A watershed segmenter turns the saved map into labelled, navigable rooms",
        "Per zone: drive in with Nav2, spin 360° while YOLOE runs, project every hit into the map",
        "Nodes mirror the real Go2 topic contract, so the same code runs on hardware"
      ],
      "challenges": [
        {
          "title": "Natural-language mission control",
          "problem": "Plain-English requests are ambiguous, and a robot has to behave deterministically anyway.",
          "solution": "A FastMCP server maps 14 mission tools onto a thin ROS2 service layer, normalises zone references (\"room 3\" / \"zone 3\" / \"3\" → zone_3), and runs heavy work in isolated subprocesses so the bridge never fights rclpy threading."
        },
        {
          "title": "Map-grounded open-vocabulary localisation",
          "problem": "A spinning camera produces noisy 2D detections, not an object list.",
          "solution": "Each detection is projected into the map frame through the depth camera, validated against the occupancy grid to reject phantoms in free space, and de-duplicated by class and world position."
        },
        {
          "title": "Autonomy with no hard-coded poses",
          "problem": "The facility has never been seen before and no waypoints exist.",
          "solution": "Information-gain frontier exploration with stuck-detection, blacklisting and TTL recovery, paired with a zone segmenter that gives every room a guaranteed-open navigation point."
        }
      ],
      "fullDescription": "Built on ROS2 Jazzy and Gazebo Harmonic, the stack runs the full mapping → segmentation → inspection → report pipeline with zero hard-coded waypoints. A C++ frontier_explorer selects goals by information gain (not nearest-frontier) with a blacklist/recovery state machine, while RTAB-Map fuses a 4D L1 LiDAR with odometry into a teleport-proof map→odom transform and a 2D grid. Saved maps are turned into labelled, navigable rooms by a watershed-based zone segmenter (obstacle-island fill + distance-transform room cores + door-aware separation). For each zone the robot samples safe interior viewpoints, drives there with Nav2, performs a slow in-place 360° spin while a YOLOE open-vocabulary detector runs continuously, projects every detection into the map frame via the depth camera, de-duplicates by class and world position, crops each unique object, and emits per-zone and facility-wide reports. A FastMCP server exposes the entire mission as 14 natural-language tools, so commands like \"explore the area\", \"what zones did you find?\", \"inspect zone 1\", and \"give me the report\" are translated by Claude into ROS service calls. Because every node mirrors the real-Go2 topic contract, the same code ports unchanged from simulation to hardware.",
      "techStack": [
        "ROS2 Jazzy & Gazebo Harmonic",
        "RTAB-Map LiDAR Graph-SLAM",
        "Nav2 & Frontier Exploration (C++)",
        "YOLOE Open-Vocabulary Vision",
        "FastMCP + Claude (MCP)",
        "CHAMP Quadruped Gait"
      ],
      "mediaFolder": "go2-inspection"
    },
    "gist": "A quadruped that maps a building it has never seen, then inspects it on plain-English command.",
    "points": [
      "Maps, splits into rooms and sweeps each one, with no waypoints given to it",
      "Open-vocabulary detections projected into the map and de-duplicated",
      "Claude drives the whole mission through 14 MCP tools"
    ],
    "metrics": [
      {
        "value": "14",
        "label": "MCP tools"
      },
      {
        "value": "0",
        "label": "hard-coded waypoints"
      },
      {
        "value": "360°",
        "label": "inspection spin"
      }
    ]
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
      "approach": [
        "A depth camera generates a dense real-time 3D scene mesh with NvBlox",
        "NVIDIA FoundationPose estimates 6D pose and 3D bounding boxes for the target",
        "The target's spatial data is subtracted from the environmental TSDF grid",
        "The clean background mesh goes straight into the MoveIt planning scene",
        "The whole loop was validated in Isaac Sim before deployment"
      ],
      "challenges": [
        {
          "title": "Dynamic obstacle isolation",
          "problem": "The target object registered as a collision asset, so the planner aborted the grasp.",
          "solution": "Programmatic background mesh subtraction removes the target from the environment grid before the scene is published."
        },
        {
          "title": "Robust 6D pose under bad conditions",
          "problem": "Illumination varies and objects occlude each other.",
          "solution": "A zero-shot model architecture maps tight 3D coordinates without any localised model training."
        },
        {
          "title": "Perception-to-planning latency",
          "problem": "High-bandwidth volumetric meshing outran the planner and caused timeouts on sudden scene changes.",
          "solution": "Mesh generation now runs in step with the active MoveIt planning scene, and the data transformation path was optimised to stop the timeouts."
        }
      ],
      "fullDescription": "The architecture relies on an integrated ROS2 pipeline. First, a depth camera generates a dense, real-time 3D scene mesh using NvBlox. Concurrently, NVIDIA FoundationPose estimates the 6D pose and generates 3D bounding boxes for target objects. To prevent the robot from classifying the target object itself as a collision obstacle, the system dynamically subtracts the target object's spatial data from the environmental TSDF grid before publishing the clean background mesh directly into the MoveIt planning scene for immediate path generation. The complete loop was fully validated in high-fidelity NVIDIA Isaac Sim before deployment.",
      "techStack": [
        "Isaac Sim",
        "MoveIt2",
        "NvBlox",
        "FoundationPose",
        "ROS2 Humble"
      ],
      "mediaFolder": "ai-robotics"
    },
    "gist": "Pick-and-place in clutter, built in a hackathon, with nothing mapped in advance.",
    "points": [
      "Depth camera builds a live 3D scene mesh with NvBlox",
      "FoundationPose estimates 6D pose zero-shot, without per-object training",
      "Target subtracted from the TSDF so the planner stops refusing the grasp"
    ],
    "metrics": [
      {
        "value": "6D",
        "label": "zero-shot pose"
      },
      {
        "value": "0",
        "label": "pre-mapping"
      }
    ]
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
      "approach": [
        "A GTSAM iSAM2 backend runs one incremental keyframe graph",
        "Five modalities enter as runtime-togglable factors, plus ICP loop closure and a planar prior",
        "LiDAR-inertial frontend does gyro-seeded curvature-feature scan-to-map matching",
        "IMU preintegration estimates gyro and accel bias online; wheel odometry anchors metric scale",
        "WhyCode markers enter as TagSLAM-style landmark variables"
      ],
      "challenges": [
        {
          "title": "Keeping global corrections out of the controller (REP-105)",
          "problem": "Controllers need continuous odometry, but loop closures and marker anchors arrive as teleports.",
          "solution": "Two synchronised outputs from the same graph: a map-frame pose allowed to jump, and a ~50 Hz odom-frame stream where the correction lands entirely in map→odom. Max step across three 56 m loops was 2.4 cm."
        },
        {
          "title": "Fusing a weak, drifting modality",
          "problem": "Monocular VO has unobservable translation scale on a planar robot and its heading drifts.",
          "solution": "VO translation is scaled from wheel odometry and entered as a loose robust factor. An A/B test showed tight sigmas blow the estimate out to 29 m, while loose sigmas hold ~2 cm against 3.6 cm with VO off."
        },
        {
          "title": "Recovering from total sensor dropout",
          "problem": "Long GPS-denied corridors and blackouts make conventional filters diverge outright.",
          "solution": "Markers as landmark variables in the same graph: a surveyed marker resolves an 8.5 m spawn offset to centimetres on first sighting, and a 25 s LiDAR blackout recovers to 1.1 cm against 4.9 m of unrecoverable drift without them."
        }
      ],
      "fullDescription": "Built on ROS2 Jazzy with a GTSAM iSAM2 factor-graph backend, OLIVE runs a single incremental keyframe graph that fuses five modalities as runtime-togglable factors: a LiDAR-inertial frontend (curvature-feature scan-to-map matching, gyro-seeded), tightly-coupled IMU preintegration with online gyro/accel bias estimation, wheel odometry as a metric-scale anchor, WhyCode fiducial markers treated as TagSLAM-style landmark variables, and a wheel-scaled monocular visual-odometry front-end — with ICP loop closure and a soft planar prior on top. The backend publishes two REP-105-compliant outputs from that same graph: `/olive/odometry` (map-frame, globally accurate, allowed to jump when a marker or loop closure corrects drift) and `/olive/odometry_local` (odom-frame, ~50 Hz, continuous) — so every global correction lands in the `map→odom` transform while the stream a Nav2 controller actually drives on never teleports, making OLIVE a drop-in AMCL replacement.",
      "techStack": [
        "ROS2 Jazzy & GTSAM (iSAM2)",
        "LiDAR-Inertial Odometry (C++20)",
        "Tightly-Coupled IMU Preintegration",
        "WhyCode Fiducial Landmarks",
        "Monocular Visual Odometry"
      ],
      "mediaFolder": "olive"
    },
    "gist": "Five sensors into one factor graph, so an AMR stops drifting.",
    "points": [
      "LiDAR, IMU, encoders, fiducials and monocular VO in one iSAM2 graph",
      "Two outputs: a global pose that may jump, a local stream that never does",
      "A drop-in AMCL replacement that Nav2 drives on directly"
    ],
    "metrics": [
      {
        "value": "2.0 cm",
        "label": "RMSE over 56 m"
      },
      {
        "value": "2.4 cm",
        "label": "max controller step"
      },
      {
        "value": "1.1 cm",
        "label": "after 25 s blackout"
      }
    ]
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
      "approach": [
        "Rebuilt the deployed WhyCode pipeline as a modular ROS2 package, whycode_vision",
        "The legacy version was accurate but consumed a whole dual-core allocation on the onboard industrial PC",
        "That starved the downstream localisation and navigation stack",
        "The new package detects multiple markers, decodes IDs and estimates 6-DOF pose at high framerate"
      ],
      "challenges": [
        {
          "title": "Irregular code the compiler would not vectorise",
          "problem": "Connected-component labelling and flood fill branch per pixel, which breaks auto-vectorisation.",
          "solution": "Custom unrolled loops with explicit AVX mask registers via xsimd, dropping CPU from 180% to 10-15% at 640x480."
        },
        {
          "title": "Flickering IDs",
          "problem": "Fast camera motion and motion blur made WhyCode IDs flicker or drop out entirely.",
          "solution": "A hysteresis-based ID stabiliser paired with lightweight 2D tracking holds a continuous track through the blur."
        },
        {
          "title": "Orientation ambiguity from one marker",
          "problem": "6-DOF pose from a single marker is ambiguous in orientation.",
          "solution": "Dedicated four_marker and two_marker triangulation nodes use the known marker layout to compute stable, error-resistant odometry."
        }
      ],
      "fullDescription": "During my Mobile Robotics internship at Addverb Technologies, I was tasked with eliminating a major computational bottleneck in the AMR perception stack. The deployed legacy pipeline for the WhyCode fiducial marker tracking system was functionally accurate but lacked hardware-level optimization, consuming an entire dual-core allocation (180-190% CPU load) on the robot's onboard industrial computer and starving downstream localization and navigation systems. The goal was to build a highly optimized, modular ROS2 package capable of detecting multiple markers, decoding IDs, and estimating 6-DOF poses at high framerates.",
      "techStack": [
        "C++ & AVX-512 SIMD",
        "ROS2 (rclcpp, tf2)",
        "Computer Vision (OpenCV 4.2)",
        "Sensors & Calibration"
      ],
      "mediaFolder": "whycode"
    },
    "gist": "Rewrote a fiducial tracker until it stopped eating both cores of the robot's computer.",
    "points": [
      "Hand-vectorised the detector with AVX-512 through xsimd",
      "Hysteresis ID stabiliser stops markers flickering under motion blur",
      "Hierarchical triangulation from multiple markers removes orientation ambiguity"
    ],
    "metrics": [
      {
        "value": "180% → 10-15%",
        "label": "CPU load"
      },
      {
        "value": "640x480",
        "label": "resolution"
      },
      {
        "value": "6-DOF",
        "label": "marker pose"
      }
    ]
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
      "approach": [
        "Hierarchical parent-child chunking indexes academic PDFs into ChromaDB",
        "Claude-3.5-Sonnet extracts fields against a Pydantic schema rather than free text",
        "A verification pass traces every extracted quote to its raw source segment",
        "Built for three clinical uses: counterfactual mortality, phenotype extraction, biomarker ranking",
        "Runs entirely locally, so nothing leaves the clinician's machine"
      ],
      "challenges": [
        {
          "title": "Tables that survive extraction",
          "problem": "Standard PDF segmenters split tabular clinical statistics across unrelated text chunks.",
          "solution": "Layout-aware ingestion routines with Visual Language Model (VLM) summary hooks keep a table together."
        },
        {
          "title": "Hallucination is unacceptable in clinical use",
          "problem": "Clinical intelligence cannot tolerate a generated fact or a misattributed one.",
          "solution": "A validation module parses every extracted field and strictly traces its quote against the raw local source segment."
        },
        {
          "title": "One schema, many paper formats",
          "problem": "Mortality statistics and clustering descriptions do not reconcile into a single shape.",
          "solution": "Modular use-case-specific validation rules in Pydantic, with self-repairing JSON structural checks."
        }
      ],
      "fullDescription": "Sepsis Atlas was built to automate the time-consuming and error-prone process of clinical meta-analyses, enabling medical professionals to transform thousands of pages of unstructured academic PDFs into structured, queryable databases. Built for three core clinical use cases—counterfactual mortality estimation, phenotype extraction, and biomarker ranking—the system enables clinicians to interact with a reliable, source-grounded evidence dashboard without relying on centralized, cloud-hosted server infrastructures.",
      "techStack": [
        "Vector DBs & RAG",
        "Schema-Driven Extraction",
        "Streamlit Architecture",
        "Clinical Verification Pipelines"
      ],
      "mediaFolder": "sepsis-atlas"
    },
    "gist": "Turns clinical PDFs into evidence tables you can check against the source.",
    "points": [
      "Parent-child chunking into ChromaDB, all of it local-first",
      "Claude extracts against a Pydantic schema, not free text",
      "Every field traced back to a quote in the source document"
    ],
    "metrics": [
      {
        "value": "3",
        "label": "clinical use cases"
      },
      {
        "value": "0",
        "label": "cloud dependencies"
      }
    ]
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
      "approach": [
        "Built a ROS2 Humble and Micro-ROS workspace for the whole robot",
        "YOLO object tracking identifies balls and silos on the arena",
        "LSA08 line following and TF-Luna LiDAR handle precise alignment",
        "Custom motor controller nodes drive the mecanum base",
        "r2_description URDF validates the physical spatial parameters"
      ],
      "challenges": [
        {
          "title": "Microcontroller to ROS2 synchronisation",
          "problem": "High-level ROS2 logic and low-level sensor hardware sat on opposite sides of a gap.",
          "solution": "A Micro-ROS network streams TF-Luna distance and LSA08 line state with near-zero latency, so alignment corrects instantly."
        },
        {
          "title": "Tracking under arena lighting",
          "problem": "Balls move and silos glare under the competition lights.",
          "solution": "Optimised YOLO detection pipelines with custom ROS2 message interfaces feed target coordinates straight to the navigation stack."
        },
        {
          "title": "Mecanum kinematics at speed",
          "problem": "Strafing and rotating at speed drifts if the kinematics are even slightly off.",
          "solution": "Tuned motor controller nodes, with the physical spatial parameters validated against the r2_description URDF."
        }
      ],
      "fullDescription": "For the ABU Robocon 2024 competition, our team was tasked with building a dual-robot system to complete complex, time-sensitive arena tasks. I led the primary development of \"R2,\" the fully autonomous half of the system. The objective was to engineer a highly agile, omnidirectional platform capable of navigating the arena, identifying specific targets (balls and silos), and executing precise alignment and manipulation maneuvers entirely without human intervention.",
      "techStack": [
        "ROS2 Humble & Nav2",
        "Micro-ROS",
        "Computer Vision & YOLO",
        "Sensor Integration"
      ],
      "mediaFolder": "abu-robocon"
    },
    "gist": "Led the software for the autonomous half of a Robocon competition robot.",
    "points": [
      "Four-wheel mecanum platform that ran the arena without a driver",
      "YOLO finds balls and silos; LSA08 and TF-Luna handle alignment",
      "Micro-ROS streams sensor state to ROS2 with near-zero latency"
    ],
    "metrics": [
      {
        "value": "4",
        "label": "mecanum wheels"
      },
      {
        "value": "0",
        "label": "human intervention"
      }
    ]
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
      "approach": [
        "A custom acrylic chassis on N20 encoder motors gives holonomic movement",
        "ESP32 firmware talks to ROS2 over Micro-ROS",
        "An EKF fuses high-rate encoder ticks with IMU for state estimation",
        "Gazebo simulation validates navigation before it touches hardware",
        "A CSI camera feeds a CNN pipeline pre-trained on LVIS"
      ],
      "challenges": [
        {
          "title": "Omnidirectional odometry drift",
          "problem": "Three-wheel kinematics create slip dynamics that make pure wheel odometry drift fast.",
          "solution": "An Extended Kalman Filter tightly fuses high-rate ESP32 encoder ticks with IMU data."
        },
        {
          "title": "Sim-to-real",
          "problem": "A clean Gazebo environment behaves nothing like N20 motors on a real chassis.",
          "solution": "Micro-ROS on the ESP32 gives deterministic, low-latency communication between the ROS2 network and the physical actuators."
        },
        {
          "title": "Scene understanding on edge hardware",
          "problem": "Accurate perception normally means off-board compute the robot does not have.",
          "solution": "A lightweight CSI camera feed into a CNN pipeline pre-trained on LVIS identifies a large vocabulary at runtime."
        }
      ],
      "fullDescription": "The Kiwi Drive project was conceived as a highly maneuverable, cost-effective platform to test and validate complex navigation and computer vision algorithms. Built on a custom acrylic chassis and powered by N20 encoder motors, the three-wheeled omnidirectional design provides unique holonomic movement capabilities. The goal was to build an end-to-end robotics pipeline—from mechanical assembly and bare-metal microcontroller programming to advanced simulation and AI-driven perception.",
      "techStack": [
        "Hardware Integration",
        "State Estimation",
        "Computer Vision",
        "Simulation & Navigation"
      ],
      "mediaFolder": "kiwi-drive"
    },
    "gist": "A three-wheel omni robot built from bare metal up to Nav2.",
    "points": [
      "Custom acrylic chassis, N20 encoder motors, ESP32 firmware",
      "EKF fuses encoder ticks with IMU to kill holonomic slip drift",
      "CNN on an LVIS-pretrained model gives it a large object vocabulary"
    ],
    "metrics": [
      {
        "value": "3",
        "label": "omni wheels"
      },
      {
        "value": "LVIS",
        "label": "object vocabulary"
      }
    ]
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
      "approach": [
        "An ESP32 line-following robot traverses a simulated war-torn arena",
        "A static overhead camera acts as central command rather than on-board sensing",
        "A custom CNN classifies five distinct event categories from the overhead feed",
        "Adaptive A* routes to priority targets and treats other mapped areas as danger zones",
        "A telemetry bridge maps ESP32 odometry onto a live QGIS dashboard"
      ],
      "challenges": [
        {
          "title": "Overhead distortion and event classification",
          "problem": "The Watchtower feed suffered lighting variation and noise, so events were hard to recognise.",
          "solution": "A CNN pipeline reinforced with data augmentation and noise reduction classifies the five event categories reliably."
        },
        {
          "title": "Priority routing that changes mid-run",
          "problem": "Events had to be visited in strict priority order while other mapped areas counted as danger zones.",
          "solution": "An adaptive A* implementation recalculates the optimal route whenever the CNN's classifications change."
        },
        {
          "title": "Georeferencing with low latency",
          "problem": "The robot's exact coordinates had to appear on a digital map in near real time.",
          "solution": "A telemetry bridge maps physical ESP32 odometry directly onto a live QGIS geospatial dashboard."
        }
      ],
      "fullDescription": "Developed for the e-Yantra Robotics Competition (eYRC 2023-24), \"Vanguard\" is a holistic autonomous navigation project focused on bridging overhead perception with ground-level robotics. The mission was to design an ESP32-based line-following robot capable of traversing a simulated, war-torn arena. Instead of relying purely on on-board sensors, the robot receives real-time guidance from a static overhead camera (\"Watchtower\") acting as a central command station, mimicking advanced drone-assisted ground navigation in unpredictable environments.",
      "techStack": [
        "Machine Learning & Vision",
        "Path Planning",
        "Hardware & IoT",
        "Geospatial Tracking"
      ],
      "mediaFolder": "vanguard"
    },
    "gist": "A ground robot driven by an overhead camera acting as command station.",
    "points": [
      "A static 'Watchtower' camera classifies arena events with a CNN",
      "A* recalculates the route as classifications arrive",
      "Live QGIS dashboard tracks the robot's real coordinates"
    ],
    "metrics": [
      {
        "value": "5",
        "label": "event classes"
      },
      {
        "value": "A*",
        "label": "live replanning"
      },
      {
        "value": "QGIS",
        "label": "live geotracking"
      }
    ]
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
      "approach": [
        "An X-drive base gives omnidirectional movement from tuned kinematics and motor controllers",
        "Dual ESP32s handle every actuator over a distributed Micro-ROS architecture",
        "A depth camera feeds Cartographer SLAM for real-time mapping and localisation",
        "A separate YOLO pipeline scans continuously for cotton bolls",
        "ROS2 action servers tie navigation, detection and the picking trajectory into one mission"
      ],
      "challenges": [
        {
          "title": "Telling a boll from a leaf",
          "problem": "Outdoor lighting and dense foliage make cotton hard to segment from leaves and branches.",
          "solution": "A specialised YOLO model trained with extensive field data augmentation and environmental noise injection."
        },
        {
          "title": "Coordinating the base and the arm",
          "problem": "SLAM-based navigation and 6-DOF picking run at completely different levels.",
          "solution": "A hierarchical action-server architecture accepts target coordinates and computes collision-free picking paths by inverse kinematics."
        },
        {
          "title": "Localising between identical rows",
          "problem": "GPS-denied fields of highly repetitive crops defeat loop closure.",
          "solution": "Cartographer SLAM integrated with a secondary fiducial marker system holds loop closure across long field missions."
        }
      ],
      "fullDescription": "The X-drive base provides omnidirectional movement, enabled by precisely tuned kinematics and motor controllers. Dual ESP32 microcontrollers handle all hardware actuators via a distributed Micro-ROS architecture. A depth camera feeds into the Cartographer SLAM system for real-time simultaneous localization and mapping, while a separate YOLO vision pipeline continuously scans for cotton bolls. Once a boll is identified, the system calculates optimal manipulator joint angles and executes the plucking trajectory. All behaviors integrate into a cohesive mission planning system built with ROS2 action servers.",
      "techStack": [
        "ROS2 & Nav2",
        "Micro-ROS & ESP32",
        "YOLO & Depth Vision",
        "Cartographer SLAM",
        "Manipulator Kinematics"
      ],
      "mediaFolder": "agrobot"
    },
    "gist": "An omni-drive field robot that finds cotton bolls and picks them.",
    "points": [
      "X-drive base with dual ESP32 Micro-ROS firmware",
      "YOLO spots bolls; the arm solves IK and picks them",
      "Cartographer SLAM plus fiducials hold localisation between identical crop rows"
    ],
    "metrics": [
      {
        "value": "2",
        "label": "ESP32 controllers"
      },
      {
        "value": "6-DOF",
        "label": "picking arm"
      }
    ]
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
      "approach": [
        "A Crazyflie carries MultiRanger and Flow decks for indoor sensing",
        "ROS2, Nav2 and SLAM Toolbox handle mapping and navigation",
        "A Tello EDU platform covers the computer-vision side of the project",
        "Carried out as a research project at Avignon University"
      ],
      "challenges": [
        {
          "title": "Localising without GPS",
          "problem": "Indoor flight has no satellite fix to fall back on.",
          "solution": "LiDAR, optical flow and multi-ranger distance sensors together provide robust indoor localisation."
        },
        {
          "title": "Confined spaces",
          "problem": "Narrow corridors and clutter leave no room for a slow replan.",
          "solution": "Real-time obstacle detection with dynamic path replanning keeps the drone flying through tight environments."
        },
        {
          "title": "Flight stability across mixed sensor rates",
          "problem": "Multiple sensors update at different rates, which destabilises the low-level controller.",
          "solution": "Tuning the low-level control parameters held the flight stable while all those sensor inputs came in."
        }
      ],
      "fullDescription": "Research project at Avignon University focusing on autonomous drone navigation and computer vision applications using multiple drone platforms including Crazyflie with advanced sensor decks and Tello EDU drones.",
      "techStack": [
        "ROS2 & Nav2",
        "SLAM Toolbox",
        "Crazyflie Drone",
        "Tello EDU",
        "Computer Vision & OpenCV"
      ],
      "mediaFolder": "drone-systems"
    },
    "gist": "Indoor autonomous flight on a Crazyflie, where there is no GPS to fall back on.",
    "points": [
      "MultiRanger and Flow decks stand in for GPS indoors",
      "ROS2, Nav2 and SLAM Toolbox plan and replan in corridors",
      "Tello EDU used alongside for computer-vision work"
    ],
    "metrics": [
      {
        "value": "2",
        "label": "drone platforms"
      },
      {
        "value": "GPS-denied",
        "label": "indoor flight"
      }
    ]
  }
];
