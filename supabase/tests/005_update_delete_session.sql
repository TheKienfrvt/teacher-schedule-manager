begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('77777777-7777-4777-8777-777777777777', 'teacher-g@test.local'),
  ('88888888-8888-4888-8888-888888888888', 'teacher-h@test.local');
insert into public.students (id, owner_id, name) values
  ('77777777-0001-4000-8000-000000000001', '77777777-7777-4777-8777-777777777777', 'An'),
  ('77777777-0002-4000-8000-000000000002', '77777777-7777-4777-8777-777777777777', 'Bình');
insert into public.sessions (id, owner_id, planned_start_at, planned_minutes, mode)
  values ('77777777-0003-4000-8000-000000000003', '77777777-7777-4777-8777-777777777777', '2026-11-09 11:00+00', 60, 'online');
insert into public.session_students (owner_id, session_id, student_id, status, actual_start_at, actual_minutes, rate_snapshot_vnd_per_hour, charge_vnd)
  values ('77777777-7777-4777-8777-777777777777', '77777777-0003-4000-8000-000000000003', '77777777-0001-4000-8000-000000000001', 'completed', '2026-11-09 11:00+00', 60, 100000, 100000);

set local role authenticated;
set local request.jwt.claim.sub = '77777777-7777-4777-8777-777777777777';

select results_eq(
  $$select public.create_session('2026-11-10 11:00+00', 90, 'online',
    array['77777777-0001-4000-8000-000000000001', '77777777-0002-4000-8000-000000000002']::uuid[], null, null, null) is not null$$,
  array[true], 'Tạo lịch nhóm dự kiến để sửa');

select results_eq(
  $$select public.update_session((select id from public.sessions where planned_start_at = '2026-11-10 11:00+00' limit 1),
    '2026-11-10 12:00+00', 60, 'in_person', array['77777777-0001-4000-8000-000000000001']::uuid[], 'Tại nhà', null, 'Đổi giờ')$$,
  array[true], 'Sửa được lịch dự kiến');
select results_eq(
  $$select count(*) from public.sessions where planned_start_at = '2026-11-10 12:00+00' and mode = 'in_person'$$,
  array[1::bigint], 'Giờ và hình thức đã đổi');
select results_eq(
  $$select count(*) from public.session_students where session_id = (select id from public.sessions where planned_start_at = '2026-11-10 12:00+00' limit 1)$$,
  array[1::bigint], 'Danh sách tham gia đã cập nhật');

set local request.jwt.claim.sub = '88888888-8888-4888-8888-888888888888';
select throws_ok(
  $$select public.update_session('77777777-0003-4000-8000-000000000003',
    '2026-11-10 13:00+00', 60, 'online', array['77777777-0001-4000-8000-000000000001']::uuid[], null, null, null)$$,
  '42501', null, 'B không sửa được lịch A');
select throws_ok(
  $$select public.soft_delete_session('77777777-0003-4000-8000-000000000003')$$,
  '42501', null, 'B không xóa được lịch A');

set local request.jwt.claim.sub = '77777777-7777-4777-8777-777777777777';
select results_eq(
  $$select public.soft_delete_session((select id from public.sessions where planned_start_at = '2026-11-10 12:00+00' limit 1))$$,
  array[true], 'A xóa mềm được lịch dự kiến');
select results_eq(
  $$select count(*) from public.sessions where planned_start_at = '2026-11-10 12:00+00' and deleted_at is not null$$,
  array[1::bigint], 'Lịch được đánh dấu đã xóa');
select results_eq(
  $$select count(*) from public.audit_events where owner_id = '77777777-7777-4777-8777-777777777777' and action in ('create', 'update', 'soft_delete')$$,
  array[3::bigint], 'Tạo, sửa, xóa đều có dấu vết');
select throws_ok(
  $$select public.update_session((select id from public.sessions where planned_start_at = '2026-11-10 12:00+00' limit 1),
    '2026-11-10 14:00+00', 60, 'online', array['77777777-0001-4000-8000-000000000001']::uuid[], null, null, null)$$,
  '22023', null, 'Không sửa lịch đã xóa');
select throws_ok(
  $$select public.soft_delete_session('77777777-0003-4000-8000-000000000003')$$,
  '22023', null, 'Không xóa buổi đã chốt tiền');

select * from finish();
rollback;
