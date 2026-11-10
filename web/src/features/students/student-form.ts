export type StudentDraft = { name: string, rateVndPerHour: number, effectiveFrom: string }

export function validateStudentDraft(draft: StudentDraft): string | null {
  if (!draft.name.trim()) return 'Nhập tên học sinh'
  if (!Number.isSafeInteger(draft.rateVndPerHour) || draft.rateVndPerHour < 0) return 'Đơn giá phải là số nguyên VND không âm'
  const date = new Date(`${draft.effectiveFrom}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.effectiveFrom) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== draft.effectiveFrom) return 'Ngày hiệu lực không hợp lệ'
  return null
}
