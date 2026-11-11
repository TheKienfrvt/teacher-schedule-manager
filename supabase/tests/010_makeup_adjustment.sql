begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'makeup-a@test.local'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'makeup-b@test.local');
insert into public.students (id, owner_id, name) values
  ('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'An'),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Bình');
insert into public.rate_history (owner_id, student_id, effective_from, rate_vnd_per_hour) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-0001-4000-8000-000000000001', '2026-11-01', 100000),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-0002-4000-8000-000000000002', '2026-11-01', 120000);
insert into public.sessions (id, owner_id, planned_start_at, planned_minutes, mode) values
  ('bbbbbbbb-1000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2026-11-10 11:00+00', 60, 'online'),
  ('bbbbbbbb-1000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2026-11-20 11:00+00', 60, 'online'),
  ('bbbbbbbb-1000-4000-8000-000000000003', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2026-11-21 11:00+00', 60, 'online');
insert into public.session_students (id, owner_id, session_id, student_id) values
  ('bbbbbbbb-2000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-1000-4000-8000-000000000001', 'bbbbbbbb-0001-4000-8000-000000000001'),
  ('bbbbbbbb-2000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-1000-4000-8000-000000000001', 'bbbbbbbb-0002-4000-8000-000000000002'),
  ('bbbbbbbb-2000-4000-8000-000000000003', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-1000-4000-8000-000000000002', 'bbbbbbbb-0001-4000-8000-000000000001'),
  ('bbbbbbbb-2000-4000-8000-000000000004', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-1000-4000-8000-000000000003', 'bbbbbbbb-0001-4000-8000-000000000001');

set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select lives_ok($$select public.finalize_attendance('bbbbbbbb-1000-4000-8000-000000000001', 'bbbbbbbb-0001-4000-8000-000000000001', 'absent')$$, 'An nghỉ buổi gốc');
select lives_ok($$select public.finalize_attendance('bbbbbbbb-1000-4000-8000-000000000001', 'bbbbbbbb-0002-4000-8000-000000000002', 'completed', '2026-11-10 11:00+00', 60)$$, 'Bình vẫn học và có tiền');
select lives_ok($$select public.finalize_attendance('bbbbbbbb-1000-4000-8000-000000000002', 'bbbbbbbb-0001-4000-8000-000000000001', 'completed', '2026-11-20 11:00+00', 60, null, null, 'bbbbbbbb-2000-4000-8000-000000000001')$$, 'An học bù đúng em');
select results_eq($$select charge_vnd from public.session_students where id in ('bbbbbbbb-2000-4000-8000-000000000001', 'bbbbbbbb-2000-4000-8000-000000000003') order by id$$,
  array[0::bigint, 100000::bigint], 'Buổi nghỉ 0đ, buổi bù tính một lần');
select results_eq($$select charge_vnd from public.session_students where id = 'bbbbbbbb-2000-4000-8000-000000000002'$$,
  array[120000::bigint], 'Bình không mất tiền khi An nghỉ');
select throws_ok($$select public.finalize_attendance('bbbbbbbb-1000-4000-8000-000000000003', 'bbbbbbbb-0001-4000-8000-000000000001', 'completed', '2026-11-21 11:00+00', 60, null, null, 'bbbbbbbb-2000-4000-8000-000000000001')$$,
  '23505', null, 'Một buổi nghỉ không được gắn hai buổi bù');
select lives_ok($$select public.add_fee_adjustment('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-2000-4000-8000-000000000001', 20000, 'Phí hủy theo thỏa thuận')$$,
  'Có thể nhập phí đặc biệt cho buổi nghỉ với lý do');
select results_eq($$select amount_vnd from public.fee_adjustments where session_student_id = 'bbbbbbbb-2000-4000-8000-000000000001'$$,
  array[20000::bigint], 'Phí nghỉ là khoản điều chỉnh tách riêng');
select lives_ok($$select public.add_fee_adjustment('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-2000-4000-8000-000000000003', -10000, 'Sửa tiền sau chốt')$$,
  'Sửa giảm tiền bằng điều chỉnh có lý do');
select results_eq($$select charge_vnd + (select sum(amount_vnd) from public.fee_adjustments where session_student_id = s.id)
  from public.session_students s where id = 'bbbbbbbb-2000-4000-8000-000000000003'$$,
  array[90000::numeric], 'Tiền hiệu lực là tiền chốt cộng điều chỉnh');
select throws_ok($$select public.add_fee_adjustment('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-2000-4000-8000-000000000003', 1000, '')$$,
  '22023', null, 'Điều chỉnh thiếu lý do bị từ chối');
select throws_ok($$select public.add_fee_adjustment('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-2000-4000-8000-000000000003', -200000, 'Giảm quá mức')$$,
  '22023', null, 'Không tạo phải thu âm cho một dòng');
set local request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select throws_ok($$select public.add_fee_adjustment('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-2000-4000-8000-000000000003', 1000, 'Truy cập chéo')$$,
  '42501', null, 'B không điều chỉnh dòng của A');
select results_eq($$select count(*) from public.fee_adjustments$$,
  array[0::bigint], 'RLS không lộ điều chỉnh của A cho B');
select * from finish();
rollback;
