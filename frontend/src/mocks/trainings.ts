export const trainingsData = [
  {
    id: 1,
    name: "Advanced Web Development",
    description: "Comprehensive training covering modern web development practices, frameworks, and deployment strategies",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    status: "active",
    totalLevels: 4,
    sessionsPerLevel: 6,
    enrolledEleves: 12,
    completedEleves: 2
  },
  {
    id: 2,
    name: "Data Science Fundamentals",
    description: "Introduction to data analysis, statistical methods, and machine learning basics for beginners",
    startDate: "2024-02-01",
    endDate: "2024-07-15",
    status: "active",
    totalLevels: 4,
    sessionsPerLevel: 6,
    enrolledEleves: 8,
    completedEleves: 0
  },
  {
    id: 3,
    name: "Digital Marketing Strategy",
    description: "Master digital marketing channels, SEO, content strategy, and analytics for business growth",
    startDate: "2024-01-20",
    endDate: "2024-06-20",
    status: "active",
    totalLevels: 4,
    sessionsPerLevel: 6,
    enrolledEleves: 15,
    completedEleves: 1
  },
  {
    id: 4,
    name: "Project Management Professional",
    description: "Learn agile methodologies, project planning, risk management, and team leadership skills",
    startDate: "2024-03-01",
    endDate: "2024-08-30",
    status: "upcoming",
    totalLevels: 4,
    sessionsPerLevel: 6,
    enrolledEleves: 0,
    completedEleves: 0
  }
];

export const levelsData = [
  {
    id: 1,
    trainingId: 1,
    levelNumber: 1,
    name: "Foundation",
    description: "Basic concepts and introduction to core principles",
    totalSessions: 6
  },
  {
    id: 2,
    trainingId: 1,
    levelNumber: 2,
    name: "Intermediate",
    description: "Building on fundamentals with practical applications",
    totalSessions: 6
  },
  {
    id: 3,
    trainingId: 1,
    levelNumber: 3,
    name: "Advanced",
    description: "Complex topics and real-world problem solving",
    totalSessions: 6
  },
  {
    id: 4,
    trainingId: 1,
    levelNumber: 4,
    name: "Expert",
    description: "Mastery level with capstone projects",
    totalSessions: 6
  }
];

export const sessionsData = [
  // Training 1 - Advanced Web Development
  // Level 1
  { id: 1, trainingId: 1, level: 1, sessionNumber: 1, title: "Introduction to Web Technologies", date: "2024-01-15", duration: 120, completed: true },
  { id: 2, trainingId: 1, level: 1, sessionNumber: 2, title: "HTML5 and Semantic Markup", date: "2024-01-17", duration: 120, completed: true },
  { id: 3, trainingId: 1, level: 1, sessionNumber: 3, title: "CSS Fundamentals and Layout", date: "2024-01-19", duration: 120, completed: true },
  { id: 4, trainingId: 1, level: 1, sessionNumber: 4, title: "Responsive Design Principles", date: "2024-01-22", duration: 120, completed: false },
  { id: 5, trainingId: 1, level: 1, sessionNumber: 5, title: "JavaScript Basics", date: "2024-01-24", duration: 120, completed: false },
  { id: 6, trainingId: 1, level: 1, sessionNumber: 6, title: "DOM Manipulation", date: "2024-01-26", duration: 120, completed: false },
  // Level 2
  { id: 7, trainingId: 1, level: 2, sessionNumber: 1, title: "Advanced CSS Techniques", date: "2024-01-29", duration: 120, completed: true },
  { id: 8, trainingId: 1, level: 2, sessionNumber: 2, title: "CSS Grid and Flexbox", date: "2024-01-31", duration: 120, completed: true },
  { id: 9, trainingId: 1, level: 2, sessionNumber: 3, title: "JavaScript ES6+ Features", date: "2024-02-02", duration: 120, completed: false },
  { id: 10, trainingId: 1, level: 2, sessionNumber: 4, title: "Async Programming", date: "2024-02-05", duration: 120, completed: false },
  { id: 11, trainingId: 1, level: 2, sessionNumber: 5, title: "API Integration", date: "2024-02-07", duration: 120, completed: false },
  { id: 12, trainingId: 1, level: 2, sessionNumber: 6, title: "Error Handling", date: "2024-02-09", duration: 120, completed: false },
  // Level 3
  { id: 13, trainingId: 1, level: 3, sessionNumber: 1, title: "React Fundamentals", date: "2024-02-16", duration: 120, completed: true },
  { id: 14, trainingId: 1, level: 3, sessionNumber: 2, title: "State Management", date: "2024-02-19", duration: 120, completed: false },
  { id: 15, trainingId: 1, level: 3, sessionNumber: 3, title: "React Hooks Deep Dive", date: "2024-02-21", duration: 120, completed: false },
  { id: 16, trainingId: 1, level: 3, sessionNumber: 4, title: "Component Patterns", date: "2024-02-23", duration: 120, completed: false },
  { id: 17, trainingId: 1, level: 3, sessionNumber: 5, title: "Testing React Apps", date: "2024-02-26", duration: 120, completed: false },
  { id: 18, trainingId: 1, level: 3, sessionNumber: 6, title: "Performance Optimization", date: "2024-02-28", duration: 120, completed: false },
  // Level 4
  { id: 19, trainingId: 1, level: 4, sessionNumber: 1, title: "Advanced Patterns", date: "2024-03-01", duration: 120, completed: false },
  { id: 20, trainingId: 1, level: 4, sessionNumber: 2, title: "Server-Side Rendering", date: "2024-03-04", duration: 120, completed: false },
  { id: 21, trainingId: 1, level: 4, sessionNumber: 3, title: "Deployment Strategies", date: "2024-03-06", duration: 120, completed: false },
  { id: 22, trainingId: 1, level: 4, sessionNumber: 4, title: "CI/CD Pipelines", date: "2024-03-08", duration: 120, completed: false },
  { id: 23, trainingId: 1, level: 4, sessionNumber: 5, title: "Security Best Practices", date: "2024-03-11", duration: 120, completed: false },
  { id: 24, trainingId: 1, level: 4, sessionNumber: 6, title: "Capstone Project", date: "2024-03-13", duration: 120, completed: false },

  // Training 2 - Data Science Fundamentals
  // Level 1
  { id: 25, trainingId: 2, level: 1, sessionNumber: 1, title: "Introduction to Data Science", date: "2024-02-01", duration: 90, completed: true },
  { id: 26, trainingId: 2, level: 1, sessionNumber: 2, title: "Python Basics", date: "2024-02-03", duration: 90, completed: true },
  { id: 27, trainingId: 2, level: 1, sessionNumber: 3, title: "Data Types and Structures", date: "2024-02-05", duration: 90, completed: true },
  { id: 28, trainingId: 2, level: 1, sessionNumber: 4, title: "NumPy Fundamentals", date: "2024-02-07", duration: 90, completed: true },
  { id: 29, trainingId: 2, level: 1, sessionNumber: 5, title: "Pandas Introduction", date: "2024-02-09", duration: 90, completed: false },
  { id: 30, trainingId: 2, level: 1, sessionNumber: 6, title: "Data Cleaning", date: "2024-02-12", duration: 90, completed: false },
  // Level 2
  { id: 31, trainingId: 2, level: 2, sessionNumber: 1, title: "Statistical Analysis", date: "2024-02-14", duration: 90, completed: true },
  { id: 32, trainingId: 2, level: 2, sessionNumber: 2, title: "Probability Theory", date: "2024-02-16", duration: 90, completed: false },
  { id: 33, trainingId: 2, level: 2, sessionNumber: 3, title: "Hypothesis Testing", date: "2024-02-19", duration: 90, completed: false },
  { id: 34, trainingId: 2, level: 2, sessionNumber: 4, title: "Regression Analysis", date: "2024-02-21", duration: 90, completed: false },
  { id: 35, trainingId: 2, level: 2, sessionNumber: 5, title: "Data Visualization", date: "2024-02-23", duration: 90, completed: false },
  { id: 36, trainingId: 2, level: 2, sessionNumber: 6, title: "Matplotlib and Seaborn", date: "2024-02-26", duration: 90, completed: false },
  // Level 3
  { id: 37, trainingId: 2, level: 3, sessionNumber: 1, title: "Machine Learning Intro", date: "2024-02-28", duration: 90, completed: false },
  { id: 38, trainingId: 2, level: 3, sessionNumber: 2, title: "Supervised Learning", date: "2024-03-01", duration: 90, completed: false },
  { id: 39, trainingId: 2, level: 3, sessionNumber: 3, title: "Classification Algorithms", date: "2024-03-04", duration: 90, completed: false },
  { id: 40, trainingId: 2, level: 3, sessionNumber: 4, title: "Model Evaluation", date: "2024-03-06", duration: 90, completed: false },
  { id: 41, trainingId: 2, level: 3, sessionNumber: 5, title: "Feature Engineering", date: "2024-03-08", duration: 90, completed: false },
  { id: 42, trainingId: 2, level: 3, sessionNumber: 6, title: "Cross-Validation", date: "2024-03-11", duration: 90, completed: false },
  // Level 4
  { id: 43, trainingId: 2, level: 4, sessionNumber: 1, title: "Deep Learning Basics", date: "2024-03-13", duration: 90, completed: false },
  { id: 44, trainingId: 2, level: 4, sessionNumber: 2, title: "Neural Networks", date: "2024-03-15", duration: 90, completed: false },
  { id: 45, trainingId: 2, level: 4, sessionNumber: 3, title: "Natural Language Processing", date: "2024-03-18", duration: 90, completed: false },
  { id: 46, trainingId: 2, level: 4, sessionNumber: 4, title: "Computer Vision", date: "2024-03-20", duration: 90, completed: false },
  { id: 47, trainingId: 2, level: 4, sessionNumber: 5, title: "Model Deployment", date: "2024-03-22", duration: 90, completed: false },
  { id: 48, trainingId: 2, level: 4, sessionNumber: 6, title: "Capstone Data Project", date: "2024-03-25", duration: 90, completed: false },

  // Training 3 - Digital Marketing Strategy
  // Level 1
  { id: 49, trainingId: 3, level: 1, sessionNumber: 1, title: "Digital Marketing Overview", date: "2024-01-20", duration: 90, completed: true },
  { id: 50, trainingId: 3, level: 1, sessionNumber: 2, title: "SEO Fundamentals", date: "2024-01-22", duration: 90, completed: true },
  { id: 51, trainingId: 3, level: 1, sessionNumber: 3, title: "Content Strategy", date: "2024-01-24", duration: 90, completed: true },
  { id: 52, trainingId: 3, level: 1, sessionNumber: 4, title: "Social Media Marketing", date: "2024-01-26", duration: 90, completed: true },
  { id: 53, trainingId: 3, level: 1, sessionNumber: 5, title: "Email Marketing", date: "2024-01-29", duration: 90, completed: true },
  { id: 54, trainingId: 3, level: 1, sessionNumber: 6, title: "Analytics Basics", date: "2024-01-31", duration: 90, completed: true },
  // Level 2
  { id: 55, trainingId: 3, level: 2, sessionNumber: 1, title: "Advanced SEO", date: "2024-02-02", duration: 90, completed: true },
  { id: 56, trainingId: 3, level: 2, sessionNumber: 2, title: "PPC Advertising", date: "2024-02-05", duration: 90, completed: true },
  { id: 57, trainingId: 3, level: 2, sessionNumber: 3, title: "Google Ads Mastery", date: "2024-02-07", duration: 90, completed: false },
  { id: 58, trainingId: 3, level: 2, sessionNumber: 4, title: "Facebook Ads Strategy", date: "2024-02-09", duration: 90, completed: false },
  { id: 59, trainingId: 3, level: 2, sessionNumber: 5, title: "Conversion Optimization", date: "2024-02-12", duration: 90, completed: false },
  { id: 60, trainingId: 3, level: 2, sessionNumber: 6, title: "A/B Testing", date: "2024-02-14", duration: 90, completed: false },
  // Level 3
  { id: 61, trainingId: 3, level: 3, sessionNumber: 1, title: "Brand Strategy", date: "2024-02-16", duration: 90, completed: false },
  { id: 62, trainingId: 3, level: 3, sessionNumber: 2, title: "Influencer Marketing", date: "2024-02-19", duration: 90, completed: false },
  { id: 63, trainingId: 3, level: 3, sessionNumber: 3, title: "Video Marketing", date: "2024-02-21", duration: 90, completed: false },
  { id: 64, trainingId: 3, level: 3, sessionNumber: 4, title: "Marketing Automation", date: "2024-02-23", duration: 90, completed: false },
  { id: 65, trainingId: 3, level: 3, sessionNumber: 5, title: "CRM Integration", date: "2024-02-26", duration: 90, completed: false },
  { id: 66, trainingId: 3, level: 3, sessionNumber: 6, title: "Campaign Management", date: "2024-02-28", duration: 90, completed: false },
  // Level 4
  { id: 67, trainingId: 3, level: 4, sessionNumber: 1, title: "Growth Hacking", date: "2024-03-01", duration: 90, completed: false },
  { id: 68, trainingId: 3, level: 4, sessionNumber: 2, title: "Marketing Analytics", date: "2024-03-04", duration: 90, completed: false },
  { id: 69, trainingId: 3, level: 4, sessionNumber: 3, title: "ROI Measurement", date: "2024-03-06", duration: 90, completed: false },
  { id: 70, trainingId: 3, level: 4, sessionNumber: 4, title: "Multi-Channel Strategy", date: "2024-03-08", duration: 90, completed: false },
  { id: 71, trainingId: 3, level: 4, sessionNumber: 5, title: "Crisis Communication", date: "2024-03-11", duration: 90, completed: false },
  { id: 72, trainingId: 3, level: 4, sessionNumber: 6, title: "Capstone Marketing Plan", date: "2024-03-13", duration: 90, completed: false },

  // Training 4 - Project Management Professional
  // Level 1
  { id: 73, trainingId: 4, level: 1, sessionNumber: 1, title: "Project Management Basics", date: "2024-03-01", duration: 120, completed: false },
  { id: 74, trainingId: 4, level: 1, sessionNumber: 2, title: "Project Life Cycle", date: "2024-03-04", duration: 120, completed: false },
  { id: 75, trainingId: 4, level: 1, sessionNumber: 3, title: "Stakeholder Management", date: "2024-03-06", duration: 120, completed: false },
  { id: 76, trainingId: 4, level: 1, sessionNumber: 4, title: "Scope Definition", date: "2024-03-08", duration: 120, completed: false },
  { id: 77, trainingId: 4, level: 1, sessionNumber: 5, title: "Work Breakdown Structure", date: "2024-03-11", duration: 120, completed: false },
  { id: 78, trainingId: 4, level: 1, sessionNumber: 6, title: "Project Charter", date: "2024-03-13", duration: 120, completed: false },
  // Level 2
  { id: 79, trainingId: 4, level: 2, sessionNumber: 1, title: "Schedule Management", date: "2024-03-15", duration: 120, completed: false },
  { id: 80, trainingId: 4, level: 2, sessionNumber: 2, title: "Cost Estimation", date: "2024-03-18", duration: 120, completed: false },
  { id: 81, trainingId: 4, level: 2, sessionNumber: 3, title: "Resource Planning", date: "2024-03-20", duration: 120, completed: false },
  { id: 82, trainingId: 4, level: 2, sessionNumber: 4, title: "Risk Assessment", date: "2024-03-22", duration: 120, completed: false },
  { id: 83, trainingId: 4, level: 2, sessionNumber: 5, title: "Quality Management", date: "2024-03-25", duration: 120, completed: false },
  { id: 84, trainingId: 4, level: 2, sessionNumber: 6, title: "Communication Planning", date: "2024-03-27", duration: 120, completed: false },
  // Level 3
  { id: 85, trainingId: 4, level: 3, sessionNumber: 1, title: "Agile Methodology", date: "2024-03-29", duration: 120, completed: false },
  { id: 86, trainingId: 4, level: 3, sessionNumber: 2, title: "Scrum Framework", date: "2024-04-01", duration: 120, completed: false },
  { id: 87, trainingId: 4, level: 3, sessionNumber: 3, title: "Kanban Systems", date: "2024-04-03", duration: 120, completed: false },
  { id: 88, trainingId: 4, level: 3, sessionNumber: 4, title: "Sprint Planning", date: "2024-04-05", duration: 120, completed: false },
  { id: 89, trainingId: 4, level: 3, sessionNumber: 5, title: "Retrospectives", date: "2024-04-08", duration: 120, completed: false },
  { id: 90, trainingId: 4, level: 3, sessionNumber: 6, title: "Hybrid Approaches", date: "2024-04-10", duration: 120, completed: false },
  // Level 4
  { id: 91, trainingId: 4, level: 4, sessionNumber: 1, title: "Leadership Skills", date: "2024-04-12", duration: 120, completed: false },
  { id: 92, trainingId: 4, level: 4, sessionNumber: 2, title: "Team Dynamics", date: "2024-04-15", duration: 120, completed: false },
  { id: 93, trainingId: 4, level: 4, sessionNumber: 3, title: "Conflict Resolution", date: "2024-04-17", duration: 120, completed: false },
  { id: 94, trainingId: 4, level: 4, sessionNumber: 4, title: "Change Management", date: "2024-04-19", duration: 120, completed: false },
  { id: 95, trainingId: 4, level: 4, sessionNumber: 5, title: "Portfolio Management", date: "2024-04-22", duration: 120, completed: false },
  { id: 96, trainingId: 4, level: 4, sessionNumber: 6, title: "Capstone Project Plan", date: "2024-04-24", duration: 120, completed: false }
];