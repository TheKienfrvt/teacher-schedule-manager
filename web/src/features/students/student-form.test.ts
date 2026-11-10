import { describe, expect, it } from 'vitest'
import { validateStudentDraft } from './student-form'

describe('validateStudentDraft', () => {
  it('requires a student name', () => {
    expect(validateStudentDraft({ name: '  ', rateVndPerHour: 100_000, effectiveFrom: '2026-11-10' })).toBe('Nhập tên học sinh')
  })

  it('rejects negative or fractional VND rates', () => {
    expect(validateStudentDraft({ name: 'An', rateVndPerHour: -1, effectiveFrom: '2026-11-10' })).toBe('Đơn giá phải là số nguyên VND không âm')
    expect(validateStudentDraft({ name: 'An', rateVndPerHour: 100_000.5, effectiveFrom: '2026-11-10' })).toBe('Đơn giá phải là số nguyên VND không âm')
  })

  it('rejects an impossible effective date', () => {
    expect(validateStudentDraft({ name: 'An', rateVndPerHour: 100_000, effectiveFrom: '2026-02-30' })).toBe('Ngày hiệu lực không hợp lệ')
  })

  it('accepts a named student with a valid date and rate', () => {
    expect(validateStudentDraft({ name: ' An ', rateVndPerHour: 100_000, effectiveFrom: '2026-11-10' })).toBeNull()
  })
})
