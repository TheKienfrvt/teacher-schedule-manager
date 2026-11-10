import { getSupabase } from '../../lib/supabase'
import type { StudentDraft } from './student-form'

export type StudentRate = { id: string, effectiveFrom: string, rateVndPerHour: number }
export type StudentRecord = { id: string, name: string, contact: string | null, notes: string | null, rates: StudentRate[] }

export type StudentsGateway = {
  list: () => Promise<StudentRecord[]>
  create: (draft: StudentDraft & { contact: string, notes: string }) => Promise<void>
  update: (id: string, details: { name: string, contact: string, notes: string }) => Promise<void>
  addRate: (id: string, effectiveFrom: string, rateVndPerHour: number) => Promise<void>
}

function client() {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Chưa cấu hình Supabase')
  return supabase
}

function check(error: { message: string, code?: string } | null) {
  if (!error) return
  if (error.code === '23505') throw new Error('Ngày hiệu lực này đã có đơn giá')
  throw new Error(error.message)
}

export const supabaseStudents: StudentsGateway = {
  async list() {
    const supabase = client()
    const { data, error } = await supabase.from('students')
      .select('id,name,contact,notes,rate_history(id,effective_from,rate_vnd_per_hour)')
      .is('archived_at', null).order('name')
    check(error)
    return (data ?? []).map((student) => ({
      id: student.id, name: student.name, contact: student.contact, notes: student.notes,
      rates: (student.rate_history ?? []).map((rate) => {
        const amount = Number(rate.rate_vnd_per_hour)
        if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Đơn giá vượt giới hạn số an toàn')
        return { id: rate.id, effectiveFrom: rate.effective_from, rateVndPerHour: amount }
      }).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)),
    }))
  },
  async create(draft) {
    const { error } = await client().rpc('create_student', {
      p_name: draft.name.trim(), p_contact: draft.contact.trim() || null,
      p_notes: draft.notes.trim() || null, p_effective_from: draft.effectiveFrom,
      p_rate_vnd_per_hour: draft.rateVndPerHour,
    })
    check(error)
  },
  async update(id, details) {
    const { error } = await client().from('students').update({
      name: details.name.trim(), contact: details.contact.trim() || null, notes: details.notes.trim() || null,
    }).eq('id', id)
    check(error)
  },
  async addRate(id, effectiveFrom, rateVndPerHour) {
    const { error } = await client().rpc('add_student_rate', {
      p_student_id: id, p_effective_from: effectiveFrom, p_rate_vnd_per_hour: rateVndPerHour,
    })
    check(error)
  },
}
