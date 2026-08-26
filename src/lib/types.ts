export type Mastery = 'not_started' | 'learning' | 'understands' | 'masters';
export type AssignmentStatus = 'not_started' | 'started' | 'almost_done' | 'submitted';
export type LectureStatus = 'upcoming' | 'done' | 'skipped';

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  examDate: string | null;
  ntnuUrl?: string;
  canvasUrl?: string;
  color: string;
  progress: {
    curriculumPct: number;
    lecturesDone: number;
    lecturesTotal: number;
    assignmentsDone: number;
    assignmentsTotal: number;
    topicsMastered: number;
    topicsTotal: number;
  };
}

export interface Topic {
  id: string;
  courseId: string;
  name: string;
  mastery: Mastery;
}

export interface Lecture {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  scheduledAt: string; // ISO
  durationMinutes: number;
  room?: string;
  prepInstructions?: string;
  prepMinutes?: number;
  learningGoals: string[];
  status: LectureStatus;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  dueAt: string; // ISO
  difficulty?: 'easy' | 'medium' | 'hard';
  status: AssignmentStatus;
  relatedTopics: string[];
}

export interface Exam {
  id: string;
  courseId: string;
  courseCode: string;
  examDate: string; // ISO date
}

export interface WeekFocusItem {
  courseCode: string;
  reason: string;
  priority: number;
}
