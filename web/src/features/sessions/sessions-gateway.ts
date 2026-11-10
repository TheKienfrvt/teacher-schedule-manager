import { getSupabase } from '../../lib/supabase'

export type SessionRecord = {
  id: string, startAt: string, minutes: number, mode: 'online' | 'in_person',
  location: string | null, meetingUrl: string | null, notes: string | null,
  studentIds: string[], statuses: string[],
}
export type SessionDraft = Omit<SessionRecord, 'id' | 'statuses'>
export type SessionWindow = { startAt: string, endAt: string }
export type SessionsGateway = {
  list: (window: SessionWindow) => Promise<SessionRecord[]>
  create: (draft: SessionDraft) => Promise<void>
  update: (id: string, draft: SessionDraft) => Promise<void>
  softDelete: (id: string) => Promise<void>
}

function client() {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Chưa cấu hình Supabase')
  return supabase
}

function args(draft: SessionDraft) {
  return {
    p_planned_start_at: draft.startAt, p_planned_minutes: draft.minutes,
    p_mode: draft.mode, p_student_ids: draft.studentIds,
    p_location: draft.location, p_meeting_url: draft.meetingUrl, p_notes: draft.notes,
  }
}

export const supabaseSessions: SessionsGateway = {
  async list(window) {
    const { data, error } = await client().from('sessions')
      .select('id,planned_start_at,planned_minutes,mode,location,meeting_url,notes,session_students(student_id,status)')
      .is('deleted_at', null)
      .lt('planned_start_at', window.endAt).gt('planned_end_at', window.startAt)
      .order('planned_start_at')
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id, startAt: row.planned_start_at, minutes: row.planned_minutes,
      mode: row.mode as 'online' | 'in_person', location: row.location,
      meetingUrl: row.meeting_url, notes: row.notes,
      studentIds: row.session_students.map((item) => item.student_id),
      statuses: row.session_students.map((item) => item.status),
    }))
  },
  async create(draft) {
    const { error } = await client().rpc('create_session', args(draft))
    if (error) throw error
  },
  async update(id, draft) {
    const { error } = await client().rpc('update_session', { p_session_id: id, ...args(draft) })
    if (error) throw error
  },
  async softDelete(id) {
    const { error } = await client().rpc('soft_delete_session', { p_session_id: id })
    if (error) throw error
  },
}
