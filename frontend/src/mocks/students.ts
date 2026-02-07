export const studentsData = [
  {
    id: 1,
    firstName: "Emma",
    lastName: "Johnson",
    email: "emma.johnson@email.com",
    phone: "+1 555-0101",
    enrollmentDate: "2024-01-15",
    status: "active",
    trainingId: 1,
    currentLevel: 2,
    completedSessions: 12,
    totalSessions: 24,
    attendanceRate: 95,
    eligibleForCertification: false
  },
  {
    id: 2,
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@email.com",
    phone: "+1 555-0102",
    enrollmentDate: "2024-01-20",
    status: "active",
    trainingId: 1,
    currentLevel: 4,
    completedSessions: 24,
    totalSessions: 24,
    attendanceRate: 100,
    eligibleForCertification: true
  },
  {
    id: 3,
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.williams@email.com",
    phone: "+1 555-0103",
    enrollmentDate: "2024-02-01",
    status: "active",
    trainingId: 2,
    currentLevel: 3,
    completedSessions: 16,
    totalSessions: 24,
    attendanceRate: 88,
    eligibleForCertification: false
  },
  {
    id: 4,
    firstName: "James",
    lastName: "Martinez",
    email: "james.martinez@email.com",
    phone: "+1 555-0104",
    enrollmentDate: "2024-01-10",
    status: "active",
    trainingId: 1,
    currentLevel: 4,
    completedSessions: 23,
    totalSessions: 24,
    attendanceRate: 96,
    eligibleForCertification: false
  },
  {
    id: 5,
    firstName: "Olivia",
    lastName: "Brown",
    email: "olivia.brown@email.com",
    phone: "+1 555-0105",
    enrollmentDate: "2024-02-15",
    status: "active",
    trainingId: 2,
    currentLevel: 1,
    completedSessions: 5,
    totalSessions: 24,
    attendanceRate: 83,
    eligibleForCertification: false
  },
  {
    id: 6,
    firstName: "David",
    lastName: "Lee",
    email: "david.lee@email.com",
    phone: "+1 555-0106",
    enrollmentDate: "2024-01-25",
    status: "active",
    trainingId: 3,
    currentLevel: 2,
    completedSessions: 11,
    totalSessions: 24,
    attendanceRate: 92,
    eligibleForCertification: false
  }
];

export const attendanceHistory = [
  {
    id: 1,
    studentId: 1,
    sessionId: 1,
    date: "2024-01-15",
    status: "present",
    level: 1,
    sessionNumber: 1
  },
  {
    id: 2,
    studentId: 1,
    sessionId: 2,
    date: "2024-01-17",
    status: "present",
    level: 1,
    sessionNumber: 2
  },
  {
    id: 3,
    studentId: 1,
    sessionId: 3,
    date: "2024-01-19",
    status: "late",
    level: 1,
    sessionNumber: 3
  },
  {
    id: 4,
    studentId: 2,
    sessionId: 1,
    date: "2024-01-20",
    status: "present",
    level: 1,
    sessionNumber: 1
  }
];