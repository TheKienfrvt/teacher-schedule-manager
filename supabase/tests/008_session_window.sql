begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'teacher-window-a@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'teacher-window-b@test.local');
insert into public.sessions (id, owner_id, planned_start_at, planned_minutes, mode) values
  ('aaaaaaaa-0001-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-11-09 16:30+00', 90, 'online'),
  ('aaaaaaaa-0002-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-11-10 11:00+00', 60, 'online'),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2026-11-10 11:00+00', 60, 'online');

select has_column('public', 'sessions', 'planned_end_at', 'Có giờ kết thúc dự kiến để lọc giao nhau');
select results_eq(
  $$select planned_end_at from public.sessions where id = 'aaaaaaaa-0001-4000-8000-000000000001'$$,
  array['2026-11-09 18:00+00'::timestamptz], '90 phút qua nửa đêm Việt Nam tính đúng giờ kết thúc');
update public.sessions set planned_minutes = 120 where id = 'aaaaaaaa-0001-4000-8000-000000000001';
select results_eq(
  $$select planned_end_at from public.sessions where id = 'aaaaaaaa-0001-4000-8000-000000000001'$$,
  array['2026-11-09 18:30+00'::timestamptz], 'Sửa phút thì giờ kết thúc được cập nhật');
update public.sessions set planned_minutes = 90 where id = 'aaaaaaaa-0001-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select results_eq(
  $$select count(*) from public.sessions where planned_start_at < '2026-11-09 18:00+00' and planned_end_at > '2026-11-09 17:00+00'$$,
  array[1::bigint], 'Khoảng xem bắt được buổi bắt đầu trước đó và giao nhau');
select results_eq(
  $$select count(*) from public.sessions where planned_start_at < '2026-11-10 11:00+00' and planned_end_at > '2026-11-10 10:00+00'$$,
  array[0::bigint], 'Chỉ chạm đầu mút không tính là giao nhau');

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select results_eq(
  $$select count(*) from public.sessions where planned_start_at < '2026-11-10 12:00+00' and planned_end_at > '2026-11-10 11:00+00'$$,
  array[1::bigint], 'Giáo viên B chỉ thấy lịch của mình');

select * from finish();
rollback;
