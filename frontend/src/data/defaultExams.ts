/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Exam } from "../types";

export const DEFAULT_EXAMS: Exam[] = [
  {
    id: "exam-sample-polyglot",
    title: "★ Sample Practical Coding Exam ★",
    description:
      "This is a sample examination designed to test the platform's multi-language compiler support and real-time proctoring features. It includes quick questions assessing algorithmic logic and language concepts.",
    subject: "Computer Science & Software Engineering",
    durationMinutes: 20,
    integrityThreshold: 45,
    requireCamera: true,
    lockdownBrowsing: true,
    entryPassword: "password123",
    adminExitPassword: "admin",
    createdAt: "2026-06-18",
    author: "HonorShield Exam System",
    questions: [
      {
        id: "q-sample-1",
        type: "coding",
        title: "Live Coding Challenge: Reverse a String",
        points: 50,
        questionText:
          'Write a function named `reverseString(s)` that takes a string `s` and returns the reversed string.\n\nExample:\nInput: s = "hello"\nOutput: "olleh"',
        language: "javascript",
        codeBoilerplate: `function reverseString(s) {
  // Write your code here
  return s.split('').reverse().join('');
}
`,
        testCases: [
          {
            input: '["hello"]',
            expectedOutput: '"olleh"',
          },
          {
            input: '["world"]',
            expectedOutput: '"dlrow"',
          },
          {
            name: "Hidden Edge Case",
            input: '["racecar"]',
            expectedOutput: '"racecar"',
            isHidden: true,
          },
        ],
      },
      {
        id: "q-sample-2",
        type: "mcq",
        title: "Compiler & Execution Theory",
        points: 20,
        questionText:
          "Which of the following modern programming languages implements fully compile-time memory safety using an ownership tracking mechanism (borrow checker) instead of reliance on a traditional runtime Garbage Collector (GC)?",
        options: ["Go", "Java", "Rust", "Swift"],
        correctOptionIndex: 2,
      },
    ],
  },
  {
    id: "exam-js-core",
    title: "JavaScript System Programming & Algorithms",
    description:
      "This exam tests your understanding of JavaScript core primitives, closures, asynchronous resolution, and simple algorithm structuring. Real-time proctoring and focus tracking are strictly enabled.",
    subject: "Computer Science & Software Engineering",
    durationMinutes: 45,
    integrityThreshold: 45,
    requireCamera: true,
    lockdownBrowsing: true,
    createdAt: "2026-06-18",
    author: "Prof. Katherine Vance",
    questions: [
      {
        id: "q-js-1",
        type: "mcq",
        title: "Primitive Types & Identity",
        points: 10,
        questionText:
          'What is the exact result value of the operation: typeof null === "object" && null instanceof Object?',
        options: [
          "true && true resulting in true",
          "true && false resulting in false",
          "false && true resulting in false",
          "undefined and throws a TypeError",
        ],
        correctOptionIndex: 1,
      },
      {
        id: "q-js-2",
        type: "mcq",
        title: "Event Loop & Phase Execution",
        points: 10,
        questionText:
          "Given standard execution order, when is a function inside a microtask queue (e.g. queueMicrotask or resolved Promise) processed compared to a macroTask (e.g. setTimeout)?",
        options: [
          "Directly after the current script executes, before releasing the event loop to macrotasks",
          "During the next paint rendering loop, after macrotask execution",
          "In parallel with other active setTimeout operations",
          "Only when the call stack size becomes zero and macrotask queue completes",
        ],
        correctOptionIndex: 0,
      },
      {
        id: "q-js-3",
        type: "coding",
        title: "Live Coding Challenge: Target Sum Identifiers",
        points: 40,
        questionText:
          "Write a JavaScript function named `twoSum(nums, target)` that takes an array of integers `nums` and an integer `target`, and returns an array containing the indices of the two numbers such that they add up to `target`.\n\nYou can assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.\n\nExample:\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]",
        language: "javascript",
        codeBoilerplate: `function twoSum(nums, target) {
  // Write your code here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
}
`,
        testCases: [
          {
            input: "[[2,7,11,15], 9]",
            expectedOutput: "[0,1]",
          },
          {
            input: "[[3,2,4], 6]",
            expectedOutput: "[1,2]",
          },
          {
            input: "[[3,3], 6]",
            expectedOutput: "[0,1]",
          },
        ],
      },
      {
        id: "q-js-4",
        type: "coding",
        title: "Live Coding Challenge: Palindrome Sifter",
        points: 40,
        questionText:
          'Write a JavaScript function named `isPalindrome(s)` that returns true if a given phrase is a palindrome, ignoring cases, spaces, and non-alphanumeric characters. Otherwise, return false.\n\nExample:\nInput: s = "A man, a plan, a canal: Panama"\nOutput: true',
        language: "javascript",
        codeBoilerplate: `function isPalindrome(s) {
  // Write your code here
  
}
`,
        testCases: [
          {
            input: '["A man, a plan, a canal: Panama"]',
            expectedOutput: "true",
          },
          {
            input: '["race a car"]',
            expectedOutput: "false",
          },
          {
            input: '[" "]',
            expectedOutput: "true",
          },
        ],
      },
    ],
  },
  {
    id: "exam-py-algo",
    title: "Python Language Structures & Dynamic Algorithms",
    description:
      "Covers core Python principles like list comprehensions, mutability, and dictionary algorithms with quick interactive puzzles.",
    subject: "Data Structures & Python Basics",
    durationMinutes: 30,
    integrityThreshold: 60,
    requireCamera: true,
    lockdownBrowsing: true,
    createdAt: "2026-06-18",
    author: "Dr. Raymond Carver",
    questions: [
      {
        id: "q-p-1",
        type: "mcq",
        title: "List Mutability & Defaults",
        points: 10,
        questionText:
          "What is the consequence of specifying a mutable default argument in a Python function definition, like `def appendTo(element, items=[])`?",
        options: [
          "A brand new empty list is created every single time the function begins execution",
          "Python throws a compilation SyntaxError immediately",
          "The exact same list object is shared across all calls that omit the items parameter, accumulating changes",
          "The items list is instantly converted into an immutable tuple",
        ],
        correctOptionIndex: 2,
      },
      {
        id: "q-p-2",
        type: "coding",
        title: "Coding Task: FizzBuzz Matrix",
        points: 40,
        questionText:
          'Write a Python function `fizz_buzz(n)` that returns an array of strings representing the numbers from 1 to `n` as follows:\n- "FizzBuzz" if the index is divisible by 3 and 5\n- "Fizz" if divisible by 3\n- "Buzz" if divisible by 5\n- The string number itself otherwise.\n\nExample:\nInput: n = 5\nOutput: ["1", "2", "Fizz", "4", "Buzz"]',
        language: "python",
        codeBoilerplate: `def fizz_buzz(n):
    # Enter Python code
    result = []
    for i in range(1, n + 1):
        if i % 3 == 0 and i % 5 == 0:
            result.append("FizzBuzz")
        elif i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(str(i))
    return result
`,
        testCases: [
          {
            input: "3",
            expectedOutput: '["1", "2", "Fizz"]',
          },
          {
            input: "5",
            expectedOutput: '["1", "2", "Fizz", "4", "Buzz"]',
          },
          {
            input: "15",
            expectedOutput:
              '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]',
          },
        ],
      },
    ],
  },
];
