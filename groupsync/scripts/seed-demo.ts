import { createClient } from '@supabase/supabase-js';

type TaskStatus = 'todo' | 'in_progress' | 'done';

interface DemoUser {
  id: string;
  name: string;
  role: 'owner' | 'member';
}

const DEMO_PROJECT = {
  name: 'CS 401 Final Project - Research Paper',
  description:
    'Group research paper on machine learning applications in healthcare. 15 pages, APA format, due end of semester.',
  deadline: '2026-02-25',
};

const DEMO_TASKS: Array<{ title: string; status: TaskStatus; assignedTo: string | null; description?: string }> = [
  { title: 'Research ML healthcare papers', status: 'done', assignedTo: 'Alex Chen' },
  { title: 'Write literature review section', status: 'done', assignedTo: 'Jordan Kim' },
  { title: 'Collect dataset examples', status: 'in_progress', assignedTo: 'Sam Patel' },
  { title: 'Draft methodology section', status: 'in_progress', assignedTo: 'Alex Chen' },
  { title: 'Create data visualizations', status: 'todo', assignedTo: 'Taylor Rodriguez' },
  { title: 'Write results and analysis', status: 'todo', assignedTo: null },
  { title: 'Peer review all sections', status: 'todo', assignedTo: null },
  { title: 'Final formatting and submission', status: 'todo', assignedTo: null },
];

const DEMO_AVAILABILITY: Record<string, Array<{ day: number; start: string; end: string }>> = {
  'Alex Chen': [
    { day: 1, start: '09:00', end: '12:00' },
    { day: 1, start: '14:00', end: '17:00' },
    { day: 3, start: '10:00', end: '15:00' },
    { day: 5, start: '09:00', end: '13:00' },
  ],
  'Jordan Kim': [
    { day: 1, start: '11:00', end: '16:00' },
    { day: 2, start: '13:00', end: '18:00' },
    { day: 3, start: '11:00', end: '16:00' },
    { day: 4, start: '13:00', end: '18:00' },
  ],
  'Sam Patel': [
    { day: 1, start: '10:00', end: '14:00' },
    { day: 2, start: '10:00', end: '14:00' },
    { day: 3, start: '10:00', end: '14:00' },
    { day: 5, start: '10:00', end: '16:00' },
  ],
  'Taylor Rodriguez': [
    { day: 2, start: '09:00', end: '12:00' },
    { day: 3, start: '09:00', end: '13:00' },
    { day: 4, start: '14:00', end: '20:00' },
    { day: 5, start: '10:00', end: '15:00' },
  ],
};

function getArgValue(flag: string) {
  const entry = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return entry?.slice(flag.length + 1);
}

function parseUsers(raw: string): DemoUser[] {
  // Format: id:name:role,id:name:role
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, name, role] = entry.split(':');
      if (!id || !name || (role !== 'owner' && role !== 'member')) {
        throw new Error(`Invalid user entry: "${entry}"`);
      }
      return { id, name, role };
    });
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const usersArg = getArgValue('--users');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }
  if (!usersArg) {
    throw new Error(
      'Missing --users argument. Example: --users=<id1>:Alex Chen:owner,<id2>:Jordan Kim:member,<id3>:Sam Patel:member,<id4>:Taylor Rodriguez:member'
    );
  }

  const demoUsers = parseUsers(usersArg);
  const owner = demoUsers.find((user) => user.role === 'owner');
  if (!owner) {
    throw new Error('At least one owner is required in --users.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      ...DEMO_PROJECT,
      created_by: owner.id,
    })
    .select('id, invite_code')
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? 'Failed to create demo project.');
  }

  const memberRows = demoUsers.map((user) => ({
    project_id: project.id,
    user_id: user.id,
    role: user.role,
  }));
  const { error: membersError } = await supabase.from('project_members').insert(memberRows);
  if (membersError) {
    throw new Error(membersError.message);
  }

  const idByName = Object.fromEntries(demoUsers.map((user) => [user.name, user.id]));

  const taskRows = DEMO_TASKS.map((task, index) => ({
    project_id: project.id,
    title: task.title,
    description: task.description ?? null,
    assigned_to: task.assignedTo ? idByName[task.assignedTo] ?? null : null,
    status: task.status,
    order_index: index,
  }));
  const { error: tasksError } = await supabase.from('tasks').insert(taskRows);
  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const availabilityRows = demoUsers.map((user) => ({
    project_id: project.id,
    user_id: user.id,
    slots: DEMO_AVAILABILITY[user.name] ?? [],
  }));
  const { error: availabilityError } = await supabase.from('availability').upsert(availabilityRows, {
    onConflict: 'project_id,user_id',
  });
  if (availabilityError) {
    throw new Error(availabilityError.message);
  }

  const agreedBy = demoUsers
    .filter((user) => ['Alex Chen', 'Jordan Kim', 'Sam Patel'].includes(user.name))
    .map((user) => user.id);

  const { error: agreementError } = await supabase.from('team_agreements').upsert(
    {
      project_id: project.id,
      response_time_hours: 24,
      meeting_frequency: 'Twice a week',
      communication_channel: 'Discord',
      quality_standards:
        "Review each other's sections before merging. Cite all sources in APA format. Proofread for grammar and clarity.",
      agreed_by: agreedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'project_id' }
  );
  if (agreementError) {
    throw new Error(agreementError.message);
  }

  console.log('Demo seed complete.');
  console.log(`Project ID: ${project.id}`);
  console.log(`Invite code: ${project.invite_code}`);
}

main().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
