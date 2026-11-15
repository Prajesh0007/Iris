/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Comprehensive Curated Interview Preparation Data & AI Rubrics
 */

export interface InterviewTopic {
  id: string;
  title: string;
  category: "dsa" | "system-design" | "cs-fundamentals" | "behavioral";
  description: string;
  keyConcepts: string[];
  docUrl?: string;
  videoUrl?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface CompanyTrack {
  id: string;
  name: string;
  tier: "Tier-1 Tech" | "High-Growth" | "FinTech" | "Global IT";
  rounds: string[];
  hiringFocus: string;
  topQuestions: string[];
  tips: string[];
  resources: { name: string; url: string; type: "doc" | "video" | "practice" }[];
}

export interface RoleTrack {
  id: string;
  role: string;
  summary: string;
  requiredSkills: string[];
  coreTopics: string[];
  sampleTechnicalQuestions: {
    question: string;
    expectedApproach: string;
    optimalComplexity: string;
  }[];
}

export interface MockQuestion {
  id: string;
  type: "technical" | "hr";
  role?: string;
  company?: string;
  question: string;
  context: string;
  sampleFollowUps: string[];
  evaluationCriteria: string[];
  modelAnswerOutline: string;
}

export const INTERVIEW_TOPICS: InterviewTopic[] = [
  {
    id: "topic-dsa-arrays-strings",
    title: "Arrays, Two Pointers & Sliding Window",
    category: "dsa",
    description: "Master contiguous array manipulation, in-place traversals, monotonic deques, and variable-length sliding window boundaries.",
    keyConcepts: ["Two-Pointer Opposing Convergence", "Sliding Window with Frequency Map", "Prefix Sum Arrays", "Kadane's Maximum Subarray Algorithm"],
    videoUrl: "https://www.youtube.com/watch?v=7u2KrbldDfg",
    difficulty: "beginner",
  },
  {
    id: "topic-dsa-trees-graphs",
    title: "Trees, Binary Search Trees & Graph Algorithms",
    category: "dsa",
    description: "Hierarchical data representation, depth-first and breadth-first search, Dijkstra's shortest path, Topological sorting, and Disjoint Set Union (DSU).",
    keyConcepts: ["DFS & BFS Traversals", "Lowest Common Ancestor (LCA)", "Dijkstra with PriorityQueue", "Topological Sort (Kahn's Algorithm)", "Cycle Detection in Directed Graphs"],
    videoUrl: "https://www.youtube.com/watch?v=tWVWeAqZ0WU",
    difficulty: "intermediate",
  },
  {
    id: "topic-dsa-dp",
    title: "Dynamic Programming & Memoization",
    category: "dsa",
    description: "Optimal substructure analysis, state transitions, memoized top-down recursion vs bottom-up tabulation, 0/1 Knapsack, and Longest Common Subsequence.",
    keyConcepts: ["State Definition & Recurrence Relations", "0/1 Knapsack Patterns", "Longest Increasing Subsequence (O(N log N))", "Matrix Chain & Interval DP"],
    videoUrl: "https://www.youtube.com/watch?v=oBt53YbR9Kk",
    difficulty: "advanced",
  },
  {
    id: "topic-sys-design-basics",
    title: "System Design: Scalability & High-Availability",
    category: "system-design",
    description: "Foundational concepts for designing large-scale distributed systems handling millions of queries per second.",
    keyConcepts: ["Horizontal vs Vertical Scaling", "Load Balancing (Round Robin, Consistent Hashing)", "Caching Strategies (Cache-Aside, Write-Through, Redis/Memcached)", "Database Sharding & Replication", "CAP Theorem & PACELC"],
    videoUrl: "https://www.youtube.com/watch?v=xpDnVSmNFX0",
    difficulty: "intermediate",
  },
  {
    id: "topic-sys-design-microservices",
    title: "Microservices Architecture & Event-Driven Systems",
    category: "system-design",
    description: "Decomposing monolithic architectures, asynchronous messaging with Kafka/RabbitMQ, API Gateways, and distributed transactions.",
    keyConcepts: ["Eventual Consistency & Saga Pattern", "Message Queues vs Pub/Sub", "Rate Limiting & Token Bucket Algorithm", "Circuit Breaker Pattern (Resilience4j)"],
    videoUrl: "https://www.youtube.com/watch?v=1xo-0gCVhTU",
    difficulty: "advanced",
  },
  {
    id: "topic-cs-dbms-os",
    title: "Core CS Fundamentals: OS, Concurrency & DBMS",
    category: "cs-fundamentals",
    description: "Operating system processes, threads, virtual memory, synchronization primitives, and database indexing internals.",
    keyConcepts: ["Process vs Thread & Context Switching", "Deadlock 4 Coffman Conditions & Prevention", "B-Tree vs B+ Tree in MySQL InnoDB", "ACID Transactions & Isolation Levels (Dirty Read, Phantom Read)"],
    videoUrl: "https://www.youtube.com/watch?v=bkSWJJZNgf8",
    difficulty: "intermediate",
  },
  {
    id: "topic-hr-star",
    title: "Behavioral Mastery: The STAR Methodology",
    category: "behavioral",
    description: "Structuring high-impact responses for situational behavioral questions: Situation, Task, Action, and Result with quantifiable metrics.",
    keyConcepts: ["Clear Situation Framing without Rambling", "Highlighting Personal Ownership in Tasks", "Action: Specific Technologies & Decisions Made", "Result: Quantified Business or Technical Impact (% latency reduction, user adoption)"],
    videoUrl: "https://www.youtube.com/watch?v=WRLF88beFpo",
    difficulty: "beginner",
  },
];

export const COMPANY_TRACKS: CompanyTrack[] = [
  {
    id: "company-google",
    name: "Google",
    tier: "Tier-1 Tech",
    rounds: [
      "Online Assessment (2 algorithmic questions, 90 mins)",
      "Technical Phone Screen (45 mins live coding on Google Docs/CoderPad)",
      "Onsite Round 1: Data Structures & Core Algorithms",
      "Onsite Round 2: Advanced Graph/DP Problem Solving",
      "Onsite Round 3: System Design / Architecture",
      "Onsite Round 4: Googleyness & Leadership Principles"
    ],
    hiringFocus: "Algorithmic ingenuity, asymptotic optimality (Big O), edge-case resilience, and humble collaborative communication (Googleyness).",
    topQuestions: [
      "Find the median from a data stream in O(log N) insertion.",
      "Design an autocomplete system with millions of queries per second.",
      "Word Break II (return all possible sentence segmentations).",
      "Detect cycles in a directed graph representing package dependencies."
    ],
    tips: [
      "Always clarify input bounds and ask about scale before writing any code.",
      "Think out loud continuously so the interviewer can track your thought trajectory.",
      "Write clean, modular code with descriptive variable names—avoid single-letter abbreviations."
    ],
    resources: [
      { name: "Google Engineering Practices & Code Review", url: "https://google.github.io/eng-practices/", type: "doc" },
      { name: "Google System Design Interview Guide", url: "https://github.com/donnemartin/system-design-primer", type: "doc" },
      { name: "Top Google Coding Interview Questions", url: "https://leetcode.com/problemset/all/?search=google", type: "practice" },
    ],
  },
  {
    id: "company-amazon",
    name: "Amazon",
    tier: "Tier-1 Tech",
    rounds: [
      "Online Assessment (OA1: Debugging + OA2: 2 Coding Challenges + Work Style Assessment)",
      "Technical Round 1: Coding + 2 Leadership Principles",
      "Technical Round 2: Object-Oriented Design (LLD) + Leadership Principles",
      "Technical Round 3: Distributed System Design (HLD)",
      "Bar Raiser Round: Deep Dive into Past Mistakes, Disagree and Commit, Customer Obsession"
    ],
    hiringFocus: "The 16 Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action, Deliver Results, Dive Deep, Earn Trust).",
    topQuestions: [
      "Design Amazon Locker pickup and delivery allocation system.",
      "Top K Frequent Words in a massive review catalog.",
      "Course Schedule / Dependency resolution.",
      "Reorganize String such that no two adjacent characters are identical."
    ],
    tips: [
      "Prepare 2 distinct real-world stories formatted in STAR for EACH of the 16 Leadership Principles.",
      "Use 'I' instead of 'we' when explaining what you personally delivered.",
      "Be prepared for the interviewer to drill down 5 layers deep ('Why did you choose PostgreSQL over DynamoDB?')."
    ],
    resources: [
      { name: "Amazon 16 Leadership Principles Breakdown", url: "https://www.aboutamazon.com/about-us/leadership-principles", type: "doc" },
      { name: "Amazon Bar Raiser Preparation Video", url: "https://www.youtube.com/watch?v=333P9Yt8E-U", type: "video" },
      { name: "Amazon Top Tagged DSA Questions", url: "https://leetcode.com/company/amazon/", type: "practice" },
    ],
  },
  {
    id: "company-microsoft",
    name: "Microsoft",
    tier: "Tier-1 Tech",
    rounds: [
      "Codility Online Assessment (3 problems in 75 mins)",
      "Technical Round 1: Binary Trees, Linked Lists & String Manipulation",
      "Technical Round 2: System Architecture & Database Design",
      "Technical Round 3: High-Level System Design (e.g. Teams, OneDrive, Azure scale)",
      "AA (As Appropriate / Partner Director) Round: Behavioral, Culture, and Vision"
    ],
    hiringFocus: "Solid computer science fundamentals, readable production code, test-driven mindset, and growth mindset.",
    topQuestions: [
      "Design a rate limiter for Microsoft Teams messaging API.",
      "Reverse Nodes in k-Group in a linked list.",
      "Lowest Common Ancestor in a Binary Tree.",
      "Find Minimum in Rotated Sorted Array."
    ],
    tips: [
      "Write unit test cases before the interviewer asks for them—check null pointers, empty arrays, and integer overflows.",
      "Demonstrate enthusiasm for collaborative engineering and learning from feedback."
    ],
    resources: [
      { name: "Microsoft Technical Interview Handbook", url: "https://www.techinterviewhandbook.org/", type: "doc" },
      { name: "Azure Distributed Architecture Reference", url: "https://learn.microsoft.com/en-us/azure/architecture/", type: "doc" },
    ],
  },
  {
    id: "company-goldman-sachs",
    name: "Goldman Sachs",
    tier: "FinTech",
    rounds: [
      "HackerRank Assessment (Math, Probability, DSA, CS Fundamentals)",
      "Technical Round 1: Fast Algorithmic Problem Solving & Big O optimization",
      "Technical Round 2: Java / C++ Memory Internals, Garbage Collection & Multithreading",
      "SuperDay Final Round: Technical Architecture + Core Behavioral & Ethics"
    ],
    hiringFocus: "High performance computing, microsecond latency trade-offs, multithreading synchronization, and numerical precision.",
    topQuestions: [
      "High-Frequency Order Book matching engine design.",
      "Find first non-repeating character in a stream of trade transactions.",
      "Implement a thread-safe LRU Cache with O(1) reads and writes.",
      "Trapping Rain Water / Maximum profit from buying and selling stock."
    ],
    tips: [
      "Expect questions on volatile, synchronized, locks, race conditions, and deadlocks.",
      "Pay extreme attention to numerical overflows (use 64-bit integers for financial values)."
    ],
    resources: [
      { name: "Goldman Sachs Engineering Insights", url: "https://www.goldmansachs.com/insights/pages/engineering.html", type: "doc" },
      { name: "Java Concurrency in Practice Guide", url: "https://jcip.net/", type: "doc" },
    ],
  },
  {
    id: "company-tcs-infosys",
    name: "TCS / Infosys / Global IT Services",
    tier: "Global IT",
    rounds: [
      "National Qualifier Test (NQT) / Online Aptitude + Coding Section",
      "Technical Round: Core Java, C++, Python, SQL queries, and DBMS Normalization",
      "Managerial Round: Project Discussion & Problem Solving Scenarios",
      "HR Round: Communication, Relocation, Willingness to Learn, Values"
    ],
    hiringFocus: "Core CS knowledge, clear spoken communication, database querying proficiency, and adaptability to new tech stacks.",
    topQuestions: [
      "Write an SQL query to find the 2nd highest salary in an Employee table using subqueries / DENSE_RANK().",
      "Explain the difference between Overloading and Overriding with practical examples.",
      "Palindrome checking and String permutation without using built-in libraries.",
      "Explain 1NF, 2NF, 3NF and BCNF database normalization."
    ],
    tips: [
      "Be confident in explaining your final-year academic project architecture.",
      "Write clean SQL queries with proper JOIN conditions and WHERE clauses.",
      "Maintain great posture and clear, polite verbal English."
    ],
    resources: [
      { name: "SQL Practice & LeetCode Database Solutions", url: "https://leetcode.com/problemset/database/", type: "practice" },
      { name: "Java / OOP Interview Q&A Repository", url: "https://www.geeksforgeeks.org/java-interview-questions/", type: "doc" },
    ],
  },
];

export const ROLE_TRACKS: RoleTrack[] = [
  {
    id: "role-sde-frontend",
    role: "Frontend Engineer (React / TypeScript / Web)",
    summary: "Architecting responsive, high-performance web applications with modern state management, virtualized rendering, and web security.",
    requiredSkills: ["React 19 / Modern Hooks", "TypeScript 5+", "Browser Rendering Pipeline & Paint Optimization", "Web Workers & WebSockets", "CSS Architecture / Tailwind", "Accessibility (WCAG)"],
    coreTopics: ["Virtual DOM Reconciliation", "Code Splitting & Lazy Loading", "Debounce & Throttle Implementations", "Cross-Site Scripting (XSS) & CSRF Defense", "State Management (Zustand, Redux, Context API)"],
    sampleTechnicalQuestions: [
      {
        question: "Implement a custom `useDebounce(value, delay)` hook in TypeScript from scratch.",
        expectedApproach: "Use useEffect with setTimeout and a cleanup function clearTimeout.",
        optimalComplexity: "O(1) time and memory overhead.",
      },
      {
        question: "How does React Fiber architecture work and how does it prevent blocking the main browser thread during large tree updates?",
        expectedApproach: "Explain cooperative multitasking, unit of work slices, requestIdleCallback, and priority lanes.",
        optimalComplexity: "Time-sliced scheduling across frames.",
      },
      {
        question: "Design an infinite-scroll list component that renders 100,000 items without browser tab slowdown.",
        expectedApproach: "Windowing / Virtualization: only render items visible in viewport plus a small buffer, updating on scroll event.",
        optimalComplexity: "O(K) DOM elements where K is visible count.",
      },
    ],
  },
  {
    id: "role-sde-backend",
    role: "Backend & Systems Engineer (Node.js / Distributed Systems)",
    summary: "Designing fault-tolerant REST and gRPC microservices, scalable database schemas, caching layers, and high-throughput background processing.",
    requiredSkills: ["Node.js / Express / Go / Java", "SQL (PostgreSQL/MySQL) & NoSQL (MongoDB/Redis)", "System Design & Distributed Caching", "Docker & Kubernetes", "Message Brokers (Kafka/RabbitMQ)", "API Security & JWT"],
    coreTopics: ["Database Indexing Internals", "Distributed Locking (Redlock)", "Database Sharding & Replication", "Rate Limiting & Throttling", "Event-Driven Microservices"],
    sampleTechnicalQuestions: [
      {
        question: "How do database indexes work under the hood in MySQL InnoDB, and why are composite indexes order-sensitive?",
        expectedApproach: "Explain B+ Trees, clustered vs secondary index lookups, and the Leftmost Prefix Rule.",
        optimalComplexity: "O(log N) point search.",
      },
      {
        question: "Design a distributed rate limiter that restricts API consumers to 100 requests per minute across 10 load-balanced backend instances.",
        expectedApproach: "Token bucket or Sliding Window Counter stored in Redis using atomic Lua scripts or MULTI/EXEC.",
        optimalComplexity: "O(1) time per request.",
      },
    ],
  },
  {
    id: "role-sde-ml",
    role: "Machine Learning & AI Engineer",
    summary: "Developing and deploying statistical models, deep learning architectures, open-weight vision & language pipelines, and scalable inference services.",
    requiredSkills: ["Python / PyTorch / TensorFlow", "Computer Vision (OpenCV, CNNs)", "LLM Fine-Tuning & Quantization", "Model Serving (Triton, ONNX, FastAPI)", "Vector Databases (Pinecone, Milvus, Chroma)"],
    coreTopics: ["Convolutional Neural Networks", "Transformer Attention Mechanism", "Quantization (INT8, FP16) for Edge Inference", "Retrieval Augmented Generation (RAG)", "Loss Functions & Optimization (AdamW)"],
    sampleTechnicalQuestions: [
      {
        question: "Explain the self-attention formula in Transformer models and why scaling by sqrt(d_k) is mathematically essential.",
        expectedApproach: "Softmax(Q K^T / sqrt(d_k)) V. Scaling prevents dot product magnitudes from growing too large, which would push softmax into extremely small gradient regions.",
        optimalComplexity: "O(N^2 * d) attention complexity.",
      },
    ],
  },
];

export const MOCK_INTERVIEW_QUESTIONS: MockQuestion[] = [
  // Technical Questions
  {
    id: "tech-q1",
    type: "technical",
    role: "Frontend Engineer",
    question: "Can you explain how the JavaScript Event Loop works, specifically distinguishing between the Call Stack, Microtask Queue (Promises), and Macrotask Queue (setTimeout)?",
    context: "Fundamental runtime behavior in JavaScript engines (V8).",
    sampleFollowUps: [
      "If we have a Promise that resolves immediately inside a setTimeout callback, in what exact sequence do they log?",
      "How does requestAnimationFrame fit into this execution cycle compared to microtasks?"
    ],
    evaluationCriteria: [
      "Mentions single-threaded execution model of JavaScript",
      "Correctly identifies that Microtasks always execute until empty before the next Macrotask",
      "Accurately explains event loop phases"
    ],
    modelAnswerOutline: "JavaScript runs on a single-threaded event loop. Code executes on the Call Stack. When asynchronous tasks trigger, macrotasks (setTimeout, I/O) go to the Macrotask queue, while microtasks (Promise.then, queueMicrotask, MutationObserver) go to the Microtask queue. When the call stack empties, the event loop drains ALL microtasks first before executing the single next macrotask.",
  },
  {
    id: "tech-q2",
    type: "technical",
    role: "Backend & Systems Engineer",
    question: "Suppose our primary MySQL database is experiencing 99% CPU utilization due to heavy read traffic. What architectural steps would you take to remediate this without disrupting user traffic?",
    context: "High-scale production database optimization scenario.",
    sampleFollowUps: [
      "How do you handle cache invalidation when a record updates in the primary database?",
      "What is replication lag in read replicas and how do you guarantee read-your-own-writes consistency?"
    ],
    evaluationCriteria: [
      "Mentions query profiling (EXPLAIN, slow query logs)",
      "Proposes adding Redis caching (Cache-Aside pattern)",
      "Proposes MySQL Read Replicas with read-write splitting",
      "Considers connection pooling and database indexing"
    ],
    modelAnswerOutline: "1. Diagnostic: Check slow query log and run EXPLAIN to verify if missing indexes cause full table scans. 2. Caching: Introduce Redis or Memcached using Cache-Aside for read-heavy entities with short TTL. 3. Read Replicas: Provision MySQL read replicas and route read traffic to replicas while directing writes to primary. 4. Connection Pooling: Ensure backend instances use pooling (e.g. HikariCP or connection pools) so idle connections don't exhaust DB worker threads.",
  },
  {
    id: "tech-q3",
    type: "technical",
    role: "General Software Engineer",
    question: "Walk me through how you would detect a cycle in a linked list, and how to find the exact node where the cycle begins.",
    context: "Algorithmic question: Floyd's Tortoise and Hare Cycle-Finding Algorithm.",
    sampleFollowUps: [
      "What is the formal mathematical proof that fast and slow pointers will meet?",
      "Can we do this in O(1) auxiliary space without modifying the list nodes?"
    ],
    evaluationCriteria: [
      "Identifies Floyd's Two-Pointer Cycle Algorithm (Slow advances 1, Fast advances 2)",
      "Explains that after meeting point, resetting one pointer to head and moving both at 1 step locates cycle start",
      "Correctly states time complexity is O(N) and space is O(1)"
    ],
    modelAnswerOutline: "Initialize slow and fast pointers to head. Move slow by 1 step, fast by 2 steps. If fast or fast.next reaches null, no cycle exists. If slow == fast, a cycle is confirmed. To find the entry node: reset slow to head, leave fast at the meeting node. Advance both pointers 1 step at a time; the node where they meet is the start of the cycle. Time complexity: O(N), Space complexity: O(1).",
  },
  // HR / Behavioral Questions
  {
    id: "hr-q1",
    type: "hr",
    question: "Tell me about a time when you had a disagreement with a team member or technical lead over a design decision. How did you handle it, and what was the outcome?",
    context: "Assessing emotional intelligence, conflict resolution, data-driven disagreement, and commit mindset.",
    sampleFollowUps: [
      "If you still believed your architectural approach was superior, how did you reconcile implementing their decision?",
      "What did this experience teach you about working in diverse engineering teams?"
    ],
    evaluationCriteria: [
      "Uses the STAR method (Situation, Task, Action, Result)",
      "Demonstrates objective data-backed reasoning rather than personal pride",
      "Shows empathy, active listening, and commitment to project success over ego",
      "Highlights a positive technical or business outcome"
    ],
    modelAnswerOutline: "Situation: During a sprint, our tech lead wanted to use a synchronous REST endpoint for PDF report generation, while I proposed an asynchronous message queue with BullMQ because large PDFs took 8+ seconds. Task: We needed to deliver the feature without causing HTTP 504 timeouts. Action: Instead of arguing subjectively, I created a quick benchmark script demonstrating that 20 concurrent requests caused timeout spikes in REST, but remained responsive in BullMQ. I presented the metrics in our design sync. Result: The team adopted the async queue approach, reducing timeout rates to 0% and improving p99 response times. We delivered on time with high reliability.",
  },
  {
    id: "hr-q2",
    type: "hr",
    question: "Describe a situation where a project or release was severely behind schedule or facing unexpected blockers. What actions did you take to bring it back on track?",
    context: "Assessing ownership, prioritization, bias for action, and transparent communication under pressure.",
    sampleFollowUps: [
      "How did you prioritize which features to ship vs cut?",
      "How did you communicate the risk to stakeholders without causing panic?"
    ],
    evaluationCriteria: [
      "Demonstrates proactivity and calm problem-solving",
      "Explains ruthless prioritization (P0 essential MVP vs P1/P2 nice-to-haves)",
      "Highlights transparent status communication to stakeholders",
      "Delivered a successful outcome"
    ],
    modelAnswerOutline: "Situation: Two weeks before our institution's online exam rollout, our primary database migration script began corrupting historical records during test runs. Task: I was responsible for the migration pipeline and had to ensure zero data loss while hitting our firm launch deadline. Action: I immediately alerted our lead engineer, paused non-essential sprint tasks, and decoupled the migration into idempotent, verifiable batches with automatic rollback checkpoints. I worked alongside our DBA to test the dry run on staging. Result: The migration executed in 18 minutes on release day with 100% integrity, zero downtime, and the platform launched on the scheduled date.",
  },
  {
    id: "hr-q3",
    type: "hr",
    question: "Why do you want to join our company specifically, and what makes you uniquely suited for this role compared to other candidates?",
    context: "Assessing company research, intrinsic motivation, self-awareness, and cultural alignment.",
    sampleFollowUps: [
      "What are the biggest challenges you believe our engineering team is facing right now?",
      "Where do you see yourself contributing within your first 90 days?"
    ],
    evaluationCriteria: [
      "Shows genuine understanding of the company's products and challenges",
      "Connects personal engineering passions to the role responsibilities",
      "Demonstrates humility and eagerness to learn"
    ],
    modelAnswerOutline: "Express deep familiarity with the organization's mission and engineering accomplishments. Highlight specific projects or challenges that match your skill set (e.g., real-time systems, scale, web standards). Connect past accomplishments directly to the team's needs, and outline a humble, high-impact 30-60-90 day ramp-up plan.",
  },
];
