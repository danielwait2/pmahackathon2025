export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface AvailabilitySlot {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start: string; // "HH:MM" format
  end: string; // "HH:MM" format
}

export interface Availability {
  id: string;
  project_id: string;
  user_id: string;
  slots: AvailabilitySlot[];
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: 'todo' | 'in_progress' | 'done';
  due_date: string | null;
  order_index: number;
  created_at: string;
  assignee?: Profile;
}

export interface TeamAgreement {
  id: string;
  project_id: string;
  response_time_hours: number;
  meeting_frequency: string | null;
  communication_channel: string | null;
  quality_standards: string | null;
  agreed_by: string[];
  updated_at: string;
}

export interface MeetingSuggestion {
  day: number;
  dayName: string;
  start: string;
  end: string;
  duration: number; // in minutes
  availableMembers: string[];
  totalMembers: number;
}

export interface AISuggestedTask {
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'high' | 'medium' | 'low';
}
