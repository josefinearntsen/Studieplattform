import { addDays, subDays } from 'date-fns';
import type { Assignment, Course, Exam, Lecture, Topic } from './types';

const now = new Date();

export const demoCourses: Course[] = [
  {
    id: 'demo-tdt4172',
    code: 'TDT4172',
    name: 'Introduksjon til maskinlæring',
    semester: 'Høst 2026',
    examDate: '2026-12-02',
    color: '#3F5B87',
    progress: {
      curriculumPct: 32,
      lecturesDone: 6,
      lecturesTotal: 14,
      assignmentsDone: 1,
      assignmentsTotal: 6,
      topicsMastered: 1,
      topicsTotal: 5,
    },
  },
  {
    id: 'demo-tdt4117',
    code: 'TDT4117',
    name: 'Informasjonsteknologi, grunnkurs',
    semester: 'Høst 2026',
    examDate: '2026-12-10',
    color: '#6E5A94',
    progress: {
      curriculumPct: 18,
      lecturesDone: 3,
      lecturesTotal: 12,
      assignmentsDone: 1,
      assignmentsTotal: 6,
      topicsMastered: 1,
      topicsTotal: 4,
    },
  },
  {
    id: 'demo-tdt4195',
    code: 'TDT4195',
    name: 'Visuell databehandling',
    semester: 'Høst 2026',
    examDate: '2026-12-15',
    color: '#3F7A5B',
    progress: {
      curriculumPct: 10,
      lecturesDone: 2,
      lecturesTotal: 13,
      assignmentsDone: 0,
      assignmentsTotal: 5,
      topicsMastered: 0,
      topicsTotal: 6,
    },
  },
];

export const demoTopics: Topic[] = [
  { id: 't1', courseId: 'demo-tdt4172', name: 'Introduction', mastery: 'masters' },
  { id: 't2', courseId: 'demo-tdt4172', name: 'Linear Regression', mastery: 'understands' },
  { id: 't3', courseId: 'demo-tdt4172', name: 'Logistic Regression', mastery: 'learning' },
  { id: 't4', courseId: 'demo-tdt4172', name: 'Classification', mastery: 'not_started' },
  { id: 't5', courseId: 'demo-tdt4172', name: 'Decision Trees', mastery: 'not_started' },
];

export const demoLectures: Lecture[] = [
  {
    id: 'l1',
    courseId: 'demo-tdt4172',
    courseCode: 'TDT4172',
    title: 'Logistic Regression',
    scheduledAt: addDays(new Date(now.setHours(10, 15, 0, 0)), 1).toISOString(),
    durationMinutes: 105,
    room: 'R1',
    prepInstructions: 'Les kapittel 4.1–4.3 og repeter sigmoid-funksjonen',
    prepMinutes: 40,
    learningGoals: [
      'Forklare forskjellen på input og target',
      'Forstå logistic regression intuitivt',
      'Vite hva en loss function er',
    ],
    status: 'upcoming',
  },
  {
    id: 'l2',
    courseId: 'demo-tdt4117',
    courseCode: 'TDT4117',
    title: 'Indekseringsstrukturer',
    scheduledAt: addDays(new Date(now.setHours(12, 15, 0, 0)), 1).toISOString(),
    durationMinutes: 90,
    prepInstructions: 'Les kapittel 5, avsnitt 2 – ca 20 min',
    prepMinutes: 20,
    learningGoals: ['Forstå B-trær på et intuitivt nivå'],
    status: 'upcoming',
  },
  {
    id: 'l0',
    courseId: 'demo-tdt4172',
    courseCode: 'TDT4172',
    title: 'Linear Regression',
    scheduledAt: subDays(now, 6).toISOString(),
    durationMinutes: 105,
    learningGoals: ['Forstå lineær regresjon'],
    status: 'done',
  },
];

export const demoAssignments: Assignment[] = [
  {
    id: 'a1',
    courseId: 'demo-tdt4172',
    courseCode: 'TDT4172',
    title: 'Øving 2',
    dueAt: addDays(now, 8).toISOString(),
    difficulty: 'medium',
    status: 'not_started',
    relatedTopics: ['Linear Regression', 'Loss functions', 'Gradient descent'],
  },
  {
    id: 'a2',
    courseId: 'demo-tdt4117',
    courseCode: 'TDT4117',
    title: 'Exercise 1',
    dueAt: addDays(now, 11).toISOString(),
    difficulty: 'easy',
    status: 'started',
    relatedTopics: ['Indeksering'],
  },
];

export const demoExams: Exam[] = demoCourses
  .filter((c) => c.examDate)
  .map((c) => ({
    id: `exam-${c.id}`,
    courseId: c.id,
    courseCode: c.code,
    examDate: c.examDate as string,
  }));
