import { getSupabase } from '../../lib/supabase'

export type AttendanceStatus = 'scheduled' | 'completed' | 'absent' | 'cancelled'
export type Adjustment = { id: string, amountVnd: number, reason: string, createdAt: string }
export type AttendanceRecord = {
  id: string, studentId: string, status: AttendanceStatus,
  actualStartAt: string | null, actualMinutes: number | null,
  rateSnapshotVndPerHour: number | null, chargeVnd: number,
  makeupForId: string | null, adjustments: Adjustment[],
}
export type MissedAttendance = { id: string, studentId: string, plannedStartAt: string }
export type FinalizeDraft = {
  sessionId: string, studentId: string, status: 'completed' | 'absent' | 'cancelled',
  actualStartAt: string | null, actualMinutes: number | null,
  overrideRateVndPerHour: number | null, overrideReason: string | null,
  makeupForId: string | null,
}
export type AttendanceGateway = {
  listForSession: (sessionId: string) => Promise<AttendanceRecord[]>
  listMissed: () => Promise<MissedAttendance[]>
  finalize: (draft: FinalizeDraft) => Promise<void>
  addAdjustment: (studentId: string, sessionStudentId: string, amountVnd: number, reason: string) => Promise<void>
}

function client() {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Chưa cấu hình Supabase')
  return supabase
}
function safeMoney(value: number | string | null): number | null {
  if (value === null) return null
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) throw new Error('Số tiền vượt giới hạn an toàn')
  return parsed
}

export const supabaseAttendance: AttendanceGateway = {
  async listForSession(sessionId) {
    const { data, error } = await client().from('session_students')
      .select('id,student_id,status,actual_start_at,actual_minutes,rate_snapshot_vnd_per_hour,charge_vnd,makeup_for_id,fee_adjustments(id,amount_vnd,reason,created_at)')
      .eq('session_id', sessionId).order('created_at')
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id, studentId: row.student_id, status: row.status as AttendanceStatus,
      actualStartAt: row.actual_start_at, actualMinutes: row.actual_minutes,
      rateSnapshotVndPerHour: safeMoney(row.rate_snapshot_vnd_per_hour),
      chargeVnd: safeMoney(row.charge_vnd)!, makeupForId: row.makeup_for_id,
      adjustments: (row.fee_adjustments ?? []).map((item) => ({
        id: item.id, amountVnd: safeMoney(item.amount_vnd)!, reason: item.reason, createdAt: item.created_at,
      })),
    }))
  },
  async listMissed() {
    const { data, error } = await client().from('session_students')
      .select('id,student_id,sessions!inner(planned_start_at)')
      .in('status', ['absent', 'cancelled'])
    if (error) throw error
    return (data ?? []).map((row) => ({ id: row.id, studentId: row.student_id,
      plannedStartAt: (Array.isArray(row.sessions) ? row.sessions[0] : row.sessions)?.planned_start_at ?? '' }))
  },
  async finalize(draft) {
    const { error } = await client().rpc('finalize_attendance', {
      p_session_id: draft.sessionId, p_student_id: draft.studentId, p_status: draft.status,
      p_actual_start_at: draft.actualStartAt, p_actual_minutes: draft.actualMinutes,
      p_override_rate_vnd_per_hour: draft.overrideRateVndPerHour,
      p_override_reason: draft.overrideReason, p_makeup_for_id: draft.makeupForId,
    })
    if (error) throw error
  },
  async addAdjustment(studentId, sessionStudentId, amountVnd, reason) {
    const { error } = await client().rpc('add_fee_adjustment', {
      p_student_id: studentId, p_session_student_id: sessionStudentId,
      p_amount_vnd: amountVnd, p_reason: reason,
    })
    if (error) throw error
  },
}
