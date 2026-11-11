begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, email) values
  ('99999999-9999-4999-8999-999999999999', 'attendance-a@test.local'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'attendance-b@test.local');
insert into public.students (id, owner_id, name) values
  ('99999999-0001-4000-8000-000000000001', '99999999-9999-4999-8999-999999999999', 'An'),
  ('99999999-0002-4000-8000-000000000002', '99999999-9999-4999-8999-999999999999', 'Bình');
insert into public.rate_history (owner_id, student_id, effective_from, rate_vnd_per_hour) values
  ('99999999-9999-4999-8999-999999999999', '99999999-0001-4000-8000-000000000001', '2026-11-01', 100000),
  ('99999999-9999-4999-8999-999999999999', '99999999-0002-4000-8000-000000000002', '2026-11-01', 120000),
  ('99999999-9999-4999-8999-999999999999', '99999999-0001-4000-8000-000000000001', '2026-11-15', 100001);
insert into public.sessions (id, owner_id, planned_start_at, planned_minutes, mode) values
  ('99999999-1000-4000-8000-000000000001', '99999999-9999-4999-8999-999999999999', '2026-11-10 11:00+00', 90, 'online'),
  ('99999999-1000-4000-8000-000000000002', '99999999-9999-4999-8999-999999999999', '2026-11-16 11:00+00', 60, 'online'),
  ('99999999-1000-4000-8000-000000000003', '99999999-9999-4999-8999-999999999999', '2026-11-30 16:30+00', 60, 'online');
insert into public.session_students (owner_id, session_id, student_id) values
  ('99999999-9999-4999-8999-999999999999', '99999999-1000-4000-8000-000000000001', '99999999-0001-4000-8000-000000000001'),
  ('99999999-9999-4999-8999-999999999999', '99999999-1000-4000-8000-000000000001', '99999999-0002-4000-8000-000000000002'),
  ('99999999-9999-4999-8999-999999999999', '99999999-1000-4000-8000-000000000002', '99999999-0001-4000-8000-000000000001'),
  ('99999999-9999-4999-8999-999999999999', '99999999-1000-4000-8000-000000000003', '99999999-0001-4000-8000-000000000001');

set local role authenticated;
set local request.jwt.claim.sub = '99999999-9999-4999-8999-999999999999';
select results_eq($$select sum(charge_vnd) from public.session_students where session_id = '99999999-1000-4000-8000-000000000001'$$,
  array[0::numeric], 'Lịch nhóm chưa chốt có 0đ');
select lives_ok($$select public.finalize_attendance('99999999-1000-4000-8000-000000000001', '99999999-0001-4000-8000-000000000001', 'completed', '2026-11-10 11:00+00', 90)$$, 'Chốt An học 90 phút');
select lives_ok($$select public.finalize_attendance('99999999-1000-4000-8000-000000000001', '99999999-0002-4000-8000-000000000002', 'absent')$$, 'Chốt Bình nghỉ');
select results_eq($$select charge_vnd from public.session_students where session_id = '99999999-1000-4000-8000-000000000001' order by student_id$$,
  array[150000::bigint, 0::bigint], 'Chỉ An có 150.000đ');
select results_eq($$select rate_snapshot_vnd_per_hour from public.session_students where student_id = '99999999-0001-4000-8000-000000000001' and session_id = '99999999-1000-4000-8000-000000000001'$$,
  array[100000::bigint], 'Giá tương lai không sửa snapshot cũ');
select lives_ok($$select public.finalize_attendance('99999999-1000-4000-8000-000000000002', '99999999-0001-4000-8000-000000000001', 'completed', '2026-11-16 11:00+00', 30)$$, 'Chốt giá mới 30 phút');
select results_eq($$select charge_vnd from public.session_students where session_id = '99999999-1000-4000-8000-000000000002'$$,
  array[50001::bigint], '100.001đ × 30 phút làm tròn thành 50.001đ');
select throws_ok($$select public.finalize_attendance('99999999-1000-4000-8000-000000000002', '99999999-0001-4000-8000-000000000001', 'completed', '2026-11-16 11:00+00', 30)$$,
  '22023', null, 'Không chốt lại dòng đã chốt');
select throws_ok($$select public.finalize_attendance('99999999-1000-4000-8000-000000000003', '99999999-0001-4000-8000-000000000001', 'completed', '2026-11-30 16:30+00', 60, 200000)$$,
  '22023', null, 'Giá riêng thiếu lý do bị từ chối');
select lives_ok($$select public.finalize_attendance('99999999-1000-4000-8000-000000000003', '99999999-0001-4000-8000-000000000001', 'completed', '2026-11-30 16:30+00', 60, 200000, 'Ưu đãi riêng')$$,
  'Giá riêng có lý do được chốt');
select results_eq($$select rate_snapshot_vnd_per_hour from public.session_students where session_id = '99999999-1000-4000-8000-000000000003'$$,
  array[200000::bigint], 'Snapshot giữ giá riêng đã chốt');
select results_eq($$select charge_vnd from public.session_students where session_id = '99999999-1000-4000-8000-000000000003'$$,
  array[200000::bigint], 'Buổi qua nửa đêm tính trọn tiền theo 60 phút');
select results_eq($$select count(*) from public.audit_events where entity_table = 'session_students' and action = 'finalize'$$,
  array[4::bigint], 'Mỗi lần chốt có audit');
select throws_ok($$select public.soft_delete_session('99999999-1000-4000-8000-000000000001')$$,
  '22023', null, 'Không xóa mềm buổi đã chốt');
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select throws_ok($$select public.finalize_attendance('99999999-1000-4000-8000-000000000001', '99999999-0001-4000-8000-000000000001', 'completed', '2026-11-10 11:00+00', 90)$$,
  '42501', null, 'Giáo viên B không chốt buổi A');
select results_eq($$select count(*) from public.session_students where owner_id = '99999999-9999-4999-8999-999999999999'$$,
  array[0::bigint], 'RLS không lộ dòng học của A cho B');
set local role anon;
set local request.jwt.claim.sub = '';
select throws_ok($$select public.finalize_attendance('99999999-1000-4000-8000-000000000001', '99999999-0001-4000-8000-000000000001', 'absent')$$,
  '42501', null, 'Khách không gọi được RPC');
select results_eq($$select count(*) from public.session_students where charge_vnd < 0$$,
  array[0::bigint], 'Không có dòng tiền âm');
select * from finish();
rollback;
