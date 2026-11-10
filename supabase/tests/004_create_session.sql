begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('55555555-5555-4555-8555-555555555555', 'teacher-e@test.local'),
  ('66666666-6666-4666-8666-666666666666', 'teacher-f@test.local');
insert into public.students (id, owner_id, name) values
  ('eeeeeeee-0001-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'An'),
  ('eeeeeeee-0002-4000-8000-000000000002', '55555555-5555-4555-8555-555555555555', 'Bình'),
  ('ffffffff-0001-4000-8000-000000000001', '66666666-6666-4666-8666-666666666666', 'Em khác');

set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';

select results_eq(
  $$select public.create_session('2026-11-10 11:00+00', 90, 'online',
    array['eeeeeeee-0001-4000-8000-000000000001', 'eeeeeeee-0002-4000-8000-000000000002']::uuid[], null, 'https://example.com/class', 'Nhóm') is not null$$,
  array[true], 'Tạo được một mục lịch nhóm');
select results_eq(
  $$select count(*) from public.sessions where owner_id = '55555555-5555-4555-8555-555555555555'$$,
  array[1::bigint], 'Lịch nhóm chỉ là một mục');
select results_eq(
  $$select count(*) from public.session_students where owner_id = '55555555-5555-4555-8555-555555555555'$$,
  array[2::bigint], 'Mỗi em có một dòng tham gia');
select results_eq(
  $$select sum(charge_vnd) from public.session_students where owner_id = '55555555-5555-4555-8555-555555555555'$$,
  array[0::numeric], 'Lịch mới chưa phát sinh tiền');
select results_eq(
  $$select count(*) from public.audit_events where owner_id = '55555555-5555-4555-8555-555555555555' and action = 'create'$$,
  array[1::bigint], 'Tạo lịch có dấu vết');

select throws_ok(
  $$select public.create_session('2026-11-10 11:00+00', 60, 'online',
    array['eeeeeeee-0001-4000-8000-000000000001', 'ffffffff-0001-4000-8000-000000000001']::uuid[], null, null, null)$$,
  '42501', null, 'Không ghép học sinh khác chủ vào lịch nhóm');
select results_eq(
  $$select count(*) from public.sessions where owner_id = '55555555-5555-4555-8555-555555555555'$$,
  array[1::bigint], 'Thao tác sai chủ không lưu dở dang');

select results_eq(
  $$select public.create_session('2026-11-10 11:30+00', 60, 'in_person',
    array['eeeeeeee-0001-4000-8000-000000000001']::uuid[], 'Tại nhà', null, null) is not null$$,
  array[true], 'Trùng giờ vẫn lưu được');
select results_eq(
  $$select count(*) from public.sessions where owner_id = '55555555-5555-4555-8555-555555555555'$$,
  array[2::bigint], 'Hai mục chồng giờ cùng tồn tại');

set local role anon;
set local request.jwt.claim.sub = '';
select throws_ok(
  $$select public.create_session('2026-11-10 11:00+00', 60, 'online',
    array['eeeeeeee-0001-4000-8000-000000000001']::uuid[], null, null, null)$$,
  '42501', null, 'Khách không gọi được RPC tạo lịch');

select * from finish();
rollback;
