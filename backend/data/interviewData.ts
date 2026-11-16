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
  type: "technical" | "hr" | "aptitude";
  category: "coding" | "dsa" | "system_design" | "os" | "networking" | "numerical" | "hr";
  role?: string;
  company?: string;
  difficulty?: "easy" | "medium" | "hard";
  question: string;
  context: string;
  spokenPrompt?: string;
  starterCode?: string;
  testCases?: { input: string; expectedOutput: string }[];
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
  // 1. CODING CHALLENGES (With live execution starter code and test cases)
  {
    id: "code-q1",
    type: "technical",
    category: "coding",
    role: "Fullstack / Backend / Frontend",
    difficulty: "medium",
    question: "Coding Challenge: Given an array of integers nums and an integer target, write a function twoSum(nums, target) that returns the indices of the two numbers such that they add up to target. You may assume each input has exactly one solution and you may not use the same element twice.",
    context: "Fundamental algorithmic coding problem testing hash map lookup optimization vs quadratic brute force.",
    spokenPrompt: "Let's begin with a coding problem. I've placed the boilerplate in your live editor. Can you implement twoSum in optimal O(N) time using a hash map?",
    starterCode: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    testCases: [
      { input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]" },
      { input: "[3, 2, 4], 6", expectedOutput: "[1, 2]" },
      { input: "[3, 3], 6", expectedOutput: "[0, 1]" }
    ],
    sampleFollowUps: [
      "What is the space complexity if all elements are distinct?",
      "How would your approach change if the array was already sorted in non-decreasing order?"
    ],
    evaluationCriteria: [
      "Uses a Hash Map / Dictionary for O(1) complement lookups",
      "Achieves O(N) time and O(N) space complexity",
      "Correctly handles zero, negative numbers, and duplicate values"
    ],
    modelAnswerOutline: "We iterate through the array once. For each element num at index i, calculate complement = target - num. If complement exists in map, return [map.get(complement), i]. Otherwise insert num with index i into map. Time complexity: O(N), Space complexity: O(N)."
  },
  {
    id: "code-q2",
    type: "technical",
    category: "coding",
    role: "Frontend / Fullstack Engineer",
    difficulty: "medium",
    question: "Coding Challenge: Write a function isValidParentheses(s) that determines if an input string containing '(', ')', '{', '}', '[' and ']' is valid. Brackets must close in the correct order and match corresponding open bracket types.",
    context: "Stack-based algorithmic problem testing data structure selection.",
    spokenPrompt: "Now let's test your stack mechanics. Please implement isValidParentheses in the editor and ensure it handles mismatched nested brackets.",
    starterCode: `function isValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
    testCases: [
      { input: '"()[]{}"', expectedOutput: "true" },
      { input: '"(]"', expectedOutput: "false" },
      { input: '"([{}])"', expectedOutput: "true" }
    ],
    sampleFollowUps: [
      "How would you handle other nested token pairs like XML/HTML tags?",
      "What if the string contains non-bracket characters?"
    ],
    evaluationCriteria: [
      "Applies Last-In-First-Out (LIFO) stack principle",
      "Properly checks empty stack condition upon closing bracket",
      "Returns true only if stack is fully empty at completion"
    ],
    modelAnswerOutline: "Initialize an empty stack. For each character, if it is an opening bracket push to stack. If it is a closing bracket, pop from stack and verify matching type. If stack is empty or type mismatches return false. After traversal, return true if stack is empty."
  },

  // 2. DSA (Data Structures & Algorithms)
  {
    id: "dsa-q1",
    type: "technical",
    category: "dsa",
    role: "Software Engineer / Algorithms",
    difficulty: "medium",
    question: "Walk me through how you would detect a cycle in a directed graph. Compare Depth First Search (DFS) with 3-color vertex marking against Kahn's Topological Sort algorithm.",
    context: "Graph theory, dependency resolution, and cycle detection.",
    spokenPrompt: "Could you walk me through how cycle detection operates in directed graphs? Specifically contrast three-color DFS against Kahn's algorithm.",
    sampleFollowUps: [
      "In a build system like npm or Blaze, how would you report the exact circular dependency cycle back to the developer?",
      "What is the time complexity in terms of vertices V and edges E?"
    ],
    evaluationCriteria: [
      "Explains 3-color DFS state: White (unvisited), Gray (currently in recursion call stack), Black (fully processed)",
      "Identifies that reaching a Gray node confirms a back-edge and hence a cycle",
      "Explains Kahn's Algorithm using in-degree array: cycle exists if processed node count < total vertices V",
      "States O(V + E) time complexity"
    ],
    modelAnswerOutline: "1. Three-color DFS: Nodes have 3 states: 0=unvisited, 1=visiting, 2=visited. When traversing node u, mark it 1. For each neighbor v, if v is 1, a back-edge exists (cycle). If v is 0, recurse. After exploring all neighbors, mark u as 2. 2. Kahn's Algorithm: Compute in-degree for all vertices. Push 0-in-degree vertices into a queue. Dequeue, increment counter, decrement in-degrees of neighbors. If in-degree becomes 0, push to queue. If processed count != V, a cycle exists. Time: O(V + E), Space: O(V)."
  },
  {
    id: "dsa-q2",
    type: "technical",
    category: "dsa",
    role: "Backend & Systems",
    difficulty: "hard",
    question: "Explain the optimal approach to solve the Longest Increasing Subsequence (LIS) problem. Why does the naive DP take O(N^2) and how can we optimize it to O(N log N) using binary search (Patience Sorting)?",
    context: "Dynamic programming and greedy binary search optimizations.",
    spokenPrompt: "Let's explore the Longest Increasing Subsequence. How do we transition from the classical O of N squared dynamic programming to O of N log N using binary search?",
    sampleFollowUps: [
      "Does the auxiliary tails array represent an actual valid subsequence, or solely lengths?",
      "How would you reconstruct the actual elements of the longest sequence?"
    ],
    evaluationCriteria: [
      "Explains dp[i] definition as length of LIS ending at index i",
      "Explains tails array where tails[len] stores smallest tail of all increasing subsequences of length len+1",
      "Applies binary search (bisect_left) to find placement index in O(log N)"
    ],
    modelAnswerOutline: "Naive DP maintains dp[i] = 1 + max(dp[j] for j < i where nums[j] < nums[i]), requiring O(N^2). We optimize to O(N log N) with patience sorting: maintain an array 'tails' where tails[i] is the smallest tail value among all increasing subsequences of length i+1. For each x in nums, binary search in tails: if x is larger than all elements, append x. Otherwise replace the first element >= x with x. The length of tails is the LIS length."
  },

  // 3. SYSTEM DESIGN
  {
    id: "sys-q1",
    type: "technical",
    category: "system_design",
    role: "Backend / Systems Architect",
    difficulty: "medium",
    question: "Design a distributed Rate Limiter capable of handling 500,000 requests per second across multiple API gateway clusters. Compare the Token Bucket, Leaky Bucket, and Sliding Window Log algorithms. How would you store state with minimal latency?",
    context: "Distributed rate limiting, concurrency, and Redis memory management.",
    spokenPrompt: "Suppose our API Gateway needs a distributed rate limiter for half a million requests per second. Which algorithm would you choose, and how would you manage state across distributed instances?",
    sampleFollowUps: [
      "How do you handle race conditions when two requests from the same user hit two different API instances simultaneously?",
      "What happens if your Redis cluster experiences a 2-second network partition?"
    ],
    evaluationCriteria: [
      "Compares Token Bucket (allows bursts) vs Sliding Window Counter (smooth rate)",
      "Proposes centralized in-memory datastore like Redis with Lua scripts for atomic execution",
      "Considers fallback policy (fail open vs fail closed) during cache downtime",
      "Explains memory efficiency of sliding window counter vs raw logs"
    ],
    modelAnswerOutline: "Architecture: Place rate limiting at API Gateway (e.g. Envoy / Nginx). Choose Token Bucket for burst allowance or Sliding Window Counter for memory efficiency. State Storage: Redis cluster with key = user_id:window_epoch. Concurrency: Use Redis EVAL with atomic Lua script to check and increment counter atomically in 1 round-trip, avoiding race conditions. Scalability: Shard Redis keys by hash(user_id). Fault Tolerance: If Redis fails, fail open to prevent blocking legitimate users while sounding alerts."
  },
  {
    id: "sys-q2",
    type: "technical",
    category: "system_design",
    role: "Fullstack / Cloud Engineer",
    difficulty: "medium",
    question: "Design a scalable URL Shortening Service (like TinyURL or Bitly) handling 100 million new URLs per month with a 100:1 read-to-write ratio. How would you generate unique short keys and ensure high read availability?",
    context: "Distributed ID generation, Base62 encoding, and caching strategies.",
    spokenPrompt: "Let's design a high-volume URL shortener. How do you guarantee unique short keys without collisions in a distributed multi-master setup?",
    sampleFollowUps: [
      "Why Base62 encoding (a-z, A-Z, 0-9) instead of MD5 or SHA256 hashing?",
      "How do you purge expired URLs efficiently without locking database tables?"
    ],
    evaluationCriteria: [
      "Calculates write QPS (~40 writes/sec) and read QPS (~4,000 reads/sec)",
      "Proposes 64-bit unique ID generation (Snowflake or pre-allocated counter ranges)",
      "Applies Base62 encoding (6-7 characters yields billions of unique combinations)",
      "Introduces Redis cache for popular URLs with LRU eviction"
    ],
    modelAnswerOutline: "Data Model: Mapping table (id BIGINT PK, short_url VARCHAR(7), long_url TEXT, created_at, expires_at). Short Key Generation: Use distributed ID generator (Twitter Snowflake or ZooKeeper range allocation) to produce a 64-bit integer, then encode to Base62 (62^7 = 3.5 trillion keys). Cache Layer: 80-20 Pareto principle; cache top 20% of read URLs in Redis. Reads return HTTP 301 (Permanent Redirect for browser caching) or 302 (Temporary for analytics tracking). Partition DB by hash(short_url)."
  },

  // 4. OPERATING SYSTEMS (OS)
  {
    id: "os-q1",
    type: "technical",
    category: "os",
    role: "Systems / Backend / Core CS",
    difficulty: "medium",
    question: "Explain the architectural differences between a Process and a Thread in terms of memory layout (heap, stack, data, code). What happens during a Context Switch, and why is a process context switch significantly more expensive than a thread context switch?",
    context: "Operating system kernel abstractions, virtual memory, and MMU TLB flushing.",
    spokenPrompt: "In operating systems, what is the precise memory separation between a process and a thread? And why does a process context switch carry a much heavier overhead?",
    sampleFollowUps: [
      "What is the Translation Lookaside Buffer (TLB) and why does process switching invalidate it?",
      "How does copy-on-write (COW) optimize the fork() system call?"
    ],
    evaluationCriteria: [
      "Differentiates that threads share address space (code, data, heap) but have private stack and registers",
      "Explains context switch steps: save CPU registers, PC, stack pointer to PCB/TCB",
      "Identifies that process switch changes CR3 register (page directory) which flushes TLB, causing cache misses"
    ],
    modelAnswerOutline: "Memory: A Process owns an isolated virtual address space (code, data, heap, file descriptors). Threads within the same process share heap, text, and data segments, but each thread has its own private Stack, Registers, and Program Counter (PC). Context Switch: For threads, the kernel saves registers and stack pointer. For processes, the kernel must also switch virtual memory page tables (updating CR3 register). This invalidates the CPU Translation Lookaside Buffer (TLB), triggering expensive subsequent memory page walks and CPU cache misses."
  },
  {
    id: "os-q2",
    type: "technical",
    category: "os",
    role: "Core CS / Systems Engineer",
    difficulty: "medium",
    question: "What are the four necessary Coffman conditions required for a Deadlock to occur in an operating system? Explain how you would prevent or break at least one of these conditions in production software.",
    context: "Concurrency, resource allocation graphs, and deadlock prevention.",
    spokenPrompt: "Could you list the four Coffman conditions necessary for deadlock? How do we break or prevent deadlock in multi-threaded code?",
    sampleFollowUps: [
      "How does strict lock ordering (hierarchical locking) prevent circular wait?",
      "What is the difference between deadlock prevention and deadlock avoidance (Banker's Algorithm)?"
    ],
    evaluationCriteria: [
      "Lists all 4: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait",
      "Explains lock ordering to prevent Circular Wait (e.g. always acquire Mutex A before Mutex B)",
      "Mentions try_lock timeouts to avoid indefinite Hold and Wait"
    ],
    modelAnswerOutline: "Coffman Conditions: 1. Mutual Exclusion (resource held in non-shareable mode). 2. Hold and Wait (process holds resource while requesting another). 3. No Preemption (resource cannot be forcibly taken away). 4. Circular Wait (chain of processes waiting on next). Prevention: Break Circular Wait by enforcing a strict global lock ordering (all threads acquire locks in identical alphabetical or memory address order). Break Hold and Wait by requiring threads to acquire all needed locks atomically upfront, or using timed locks (pthread_mutex_timedlock / try_lock)."
  },

  // 5. COMPUTER NETWORKING
  {
    id: "net-q1",
    type: "technical",
    category: "networking",
    role: "Systems / Network / DevOps / Backend",
    difficulty: "medium",
    question: "Walk through the TCP 3-Way Handshake (SYN, SYN-ACK, ACK) and 4-Way Teardown (FIN, ACK, FIN, ACK). What is the purpose of the TIME_WAIT state, and what problems occur if too many sockets get stuck in TIME_WAIT?",
    context: "Transport Layer protocol mechanics, sequence numbers, and socket lifecycle.",
    spokenPrompt: "Let's discuss transport networking. Walk me through the TCP three-way handshake, and explain why the TIME_WAIT socket state is essential on the client.",
    sampleFollowUps: [
      "How long is 2MSL (Maximum Segment Lifetime) typically in modern operating systems?",
      "How do SYN cookies protect against SYN Flood DDoS attacks?"
    ],
    evaluationCriteria: [
      "Correctly outlines SYN (seq=x), SYN-ACK (seq=y, ack=x+1), ACK (seq=x+1, ack=y+1)",
      "Explains TIME_WAIT (2MSL) allows delayed in-flight packets to expire so they don't corrupt a new connection",
      "Explains TIME_WAIT ensures final ACK was received by peer (allows retransmitting ACK if FIN repeats)",
      "Identifies ephemeral port exhaustion when high connection churning fills port range"
    ],
    modelAnswerOutline: "Handshake: 1. Client sends SYN (seq=x). 2. Server replies SYN-ACK (seq=y, ack=x+1). 3. Client returns ACK (ack=y+1). Connection is ESTABLISHED. Teardown: 1. Initiator sends FIN. 2. Responder sends ACK. 3. Responder sends FIN. 4. Initiator sends ACK and enters TIME_WAIT state for 2*MSL (typically 60s). Purpose of TIME_WAIT: 1. Ensure remote peer received final ACK (if ACK lost, server re-sends FIN). 2. Prevent old duplicate packets from a previous connection from being accepted by a new connection on the same IP:port tuple. Risk: Ephemeral port exhaustion in microservices making frequent short-lived HTTP connections."
  },
  {
    id: "net-q2",
    type: "technical",
    category: "networking",
    role: "Frontend / Backend / Fullstack",
    difficulty: "medium",
    question: "Compare HTTP/1.1, HTTP/2, and HTTP/3. Specifically explain Head-of-Line (HoL) blocking at the application layer in HTTP/1.1 vs at the transport layer in HTTP/2, and how HTTP/3 resolves this using QUIC over UDP.",
    context: "Evolution of web protocols, binary framing, multiplexing, and UDP QUIC.",
    spokenPrompt: "How do HTTP 1.1, HTTP 2, and HTTP 3 differ regarding Head of Line blocking? How does QUIC over UDP solve this completely?",
    sampleFollowUps: [
      "Why did HTTP/2 multiplexed streams still suffer from packet loss delays over TCP?",
      "What is 0-RTT connection resumption in TLS 1.3 with QUIC?"
    ],
    evaluationCriteria: [
      "Explains HTTP/1.1 sequential pipelining limitation (slow resource blocks following ones on same TCP socket)",
      "Explains HTTP/2 binary framing multiplexes multiple streams over 1 TCP connection, but TCP packet loss stalls ALL streams",
      "Explains HTTP/3 uses QUIC over UDP: individual streams are decoupled so packet loss on one stream does not block others"
    ],
    modelAnswerOutline: "HTTP/1.1: Text protocol. Suffers from Application-Layer HoL blocking: request 2 cannot finish until request 1 completes on that socket (browsers opened 6 parallel connections as a workaround). HTTP/2: Binary framing layer allows interleaving frames from multiple streams on a single TCP connection. However, it introduced Transport-Layer HoL blocking: if 1 TCP segment drops, TCP halts ALL streams until the dropped packet retransmits. HTTP/3: Replaces TCP with QUIC over UDP. Each stream is independent at the transport layer. A dropped UDP packet only pauses its specific stream, leaving other parallel requests unaffected."
  },

  // 6. NUMERICAL & QUANTITATIVE APTITUDE
  {
    id: "num-q1",
    type: "aptitude",
    category: "numerical",
    role: "Campus Placement / Engineering / Tech",
    difficulty: "easy",
    question: "Numerical Aptitude: Pipe A can fill a water tank in 12 hours, while Pipe B can fill it in 18 hours. If both pipes are opened simultaneously, but Pipe A is closed after 4 hours, how many total hours will it take to fill the tank completely?",
    context: "Work & Time rate arithmetic commonly featured in tech placement assessments.",
    spokenPrompt: "Let's test your numerical problem solving. If Pipe A fills a tank in 12 hours and Pipe B in 18 hours, and Pipe A closes after 4 hours, what is the total time to fill the tank?",
    sampleFollowUps: [
      "What percentage of the tank was filled by Pipe A versus Pipe B?",
      "If Pipe C was a drain pipe emptying the tank in 36 hours, how would that alter the rate equation?"
    ],
    evaluationCriteria: [
      "Calculates combined filling rate: 1/12 + 1/18 = 5/36 per hour",
      "Calculates work done in first 4 hours: 4 * (5/36) = 20/36 = 5/9",
      "Calculates remaining work: 1 - 5/9 = 4/9",
      "Calculates Pipe B remaining time: (4/9) / (1/18) = 8 hours",
      "Calculates total time: 4 + 8 = 12 hours"
    ],
    modelAnswerOutline: "1. Rate of A = 1/12 per hr. Rate of B = 1/18 per hr. 2. Combined rate in 1 hr = (3 + 2)/36 = 5/36. 3. In 4 hours, work done = 4 * (5/36) = 20/36 = 5/9 of tank. 4. Remaining work = 1 - 5/9 = 4/9. 5. Pipe B alone finishes remaining 4/9: Time = (4/9) / (1/18) = (4/9) * 18 = 8 hours. 6. Total time = 4 hours (together) + 8 hours (B alone) = 12 hours total."
  },
  {
    id: "num-q2",
    type: "aptitude",
    category: "numerical",
    role: "General Software Engineer / Data",
    difficulty: "medium",
    question: "Quantitative Probability: A bag contains 5 red balls, 4 blue balls, and 3 green balls (12 balls total). If 3 balls are drawn at random without replacement, what is the exact probability that all three balls are of different colors?",
    context: "Combinatorics and probability without replacement.",
    spokenPrompt: "Here is a probability question. With 5 red, 4 blue, and 3 green balls, what is the exact probability of drawing three balls of three different colors without replacement?",
    sampleFollowUps: [
      "What is the probability that at least two of the three balls share the same color?",
      "How would the calculation change if drawing with replacement?"
    ],
    evaluationCriteria: [
      "Calculates total possible 3-ball combinations: 12C3 = (12 * 11 * 10) / (3 * 2 * 1) = 220",
      "Calculates favorable outcomes (1 Red, 1 Blue, 1 Green): 5C1 * 4C1 * 3C1 = 5 * 4 * 3 = 60",
      "Calculates exact probability: 60 / 220 = 3 / 11 (approx 27.27%)"
    ],
    modelAnswerOutline: "Total combinations: 12 choose 3 = 12! / (3! * 9!) = (12 * 11 * 10) / 6 = 220. Favorable outcomes (selecting 1 Red, 1 Blue, 1 Green): (5C1) * (4C1) * (3C1) = 5 * 4 * 3 = 60. Probability = Favorable / Total = 60 / 220 = 6 / 22 = 3 / 11 (approx 27.27%)."
  },

  // 7. HR & BEHAVIORAL QUESTIONS
  {
    id: "hr-q1",
    type: "hr",
    category: "hr",
    role: "All Roles",
    difficulty: "medium",
    question: "Tell me about a time when you had a disagreement with a team member or technical lead over an architectural or design decision. How did you handle it, and what was the outcome?",
    context: "Assessing emotional intelligence, conflict resolution, data-driven disagreement, and commit mindset.",
    spokenPrompt: "Tell me about a time you disagreed with a colleague or technical lead on an engineering decision. How did you approach the disagreement, and what was the resolution?",
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
    modelAnswerOutline: "Situation: During a sprint, our tech lead wanted to use a synchronous REST endpoint for PDF report generation, while I proposed an asynchronous message queue with BullMQ because large PDFs took 8+ seconds. Task: We needed to deliver the feature without causing HTTP 504 timeouts. Action: Instead of arguing subjectively, I created a quick benchmark script demonstrating that 20 concurrent requests caused timeout spikes in REST, but remained responsive in BullMQ. I presented the metrics in our design sync. Result: The team adopted the async queue approach, reducing timeout rates to 0% and improving p99 response times. We delivered on time with high reliability."
  },
  {
    id: "hr-q2",
    type: "hr",
    category: "hr",
    role: "All Roles",
    difficulty: "medium",
    question: "Describe a situation where a software project or feature release was severely behind schedule or facing unexpected blockers. What specific actions did you take to bring it back on track?",
    context: "Assessing ownership, prioritization, bias for action, and transparent communication under pressure.",
    spokenPrompt: "Describe a situation where a critical software release was falling behind schedule. What steps did you personally take to realign priorities and hit the delivery goal?",
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
    modelAnswerOutline: "Situation: Two weeks before our institution's online exam rollout, our primary database migration script began corrupting historical records during test runs. Task: I was responsible for the migration pipeline and had to ensure zero data loss while hitting our firm launch deadline. Action: I immediately alerted our lead engineer, paused non-essential sprint tasks, and decoupled the migration into idempotent, verifiable batches with automatic rollback checkpoints. I worked alongside our DBA to test the dry run on staging. Result: The migration executed in 18 minutes on release day with 100% integrity, zero downtime, and the platform launched on the scheduled date."
  }
];

/**
 * Deterministically generates a customized interview question loop tailored per student and role
 */
export function getStudentInterviewQuestions(
  studentEmail: string,
  role: string,
  roundType: "technical" | "hr" | "comprehensive" = "comprehensive"
): MockQuestion[] {
  // Deterministic seed based on email
  let seed = 0;
  for (let i = 0; i < studentEmail.length; i++) {
    seed = (seed << 5) - seed + studentEmail.charCodeAt(i);
    seed |= 0;
  }
  seed = Math.abs(seed);

  const getCategorized = (cat: string) => MOCK_INTERVIEW_QUESTIONS.filter(q => q.category === cat);

  if (roundType === "hr") {
    return MOCK_INTERVIEW_QUESTIONS.filter(q => q.type === "hr");
  }

  if (roundType === "technical") {
    const codings = getCategorized("coding");
    const dsas = getCategorized("dsa");
    const sys = getCategorized("system_design");
    const os = getCategorized("os");
    const net = getCategorized("networking");

    return [
      codings[seed % codings.length],
      dsas[(seed + 1) % dsas.length],
      sys[(seed + 2) % sys.length],
      os[(seed + 3) % os.length],
      net[(seed + 4) % net.length]
    ].filter(Boolean);
  }

  // Comprehensive interview loop: Coding + DSA + System Design + OS/Net + Aptitude + HR
  const codingQ = getCategorized("coding")[seed % getCategorized("coding").length];
  const dsaQ = getCategorized("dsa")[(seed + 1) % getCategorized("dsa").length];
  const sysQ = getCategorized("system_design")[(seed + 2) % getCategorized("system_design").length];
  const osNetQ = seed % 2 === 0
    ? getCategorized("os")[(seed + 3) % getCategorized("os").length]
    : getCategorized("networking")[(seed + 3) % getCategorized("networking").length];
  const numQ = getCategorized("numerical")[(seed + 4) % getCategorized("numerical").length];
  const hrQ = getCategorized("hr")[(seed + 5) % getCategorized("hr").length];

  return [codingQ, dsaQ, sysQ, osNetQ, numQ, hrQ].filter(Boolean);
}

