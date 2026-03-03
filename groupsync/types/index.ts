// Type definitions for the app
export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  classId: string | null;
  className: string | null;
  isPersonal: boolean;
  created_by: string;
  invite_code: string;
  created_at: string;
  member_count: number;
  members: ProjectMemberPreview[];
  total_tasks: number;
  completed_tasks: number;
}

export interface ProjectMemberPreview {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  classId: string | null;
  class: Class | null;
  isPersonal: boolean;
  createdById: string;
  inviteCode: string;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  reminderDate: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface DashboardAssignedTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  reminderDate: string | null;
  projectId: string;
  projectName: string;
}
