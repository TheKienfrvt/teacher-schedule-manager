begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'teacher-a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'teacher-b@test.local');

insert into public.students (id, owner_id, name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'An'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'Bình');

insert into public.rate_history (id, owner_id, student_id, effective_from, rate_vnd_per_hour) values
  ('aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-11-01', 100000),
  ('bbbbbbbb-0001-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2026-11-01', 120000);

insert into public.sessions (id, owner_id, planned_start_at, planned_minutes, mode) values
  ('aaaaaaaa-0002-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '2026-11-09 11:00:00+00', 90, 'online'),
  ('bbbbbbbb-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '2026-11-09 11:00:00+00', 90, 'online');

insert into public.session_students (id, owner_id, session_id, student_id) values
  ('aaaaaaaa-0003-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0002-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-0003-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0002-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

insert into public.audit_events (id, owner_id, actor_id, entity_table, entity_id, action) values
  ('aaaaaaaa-0004-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'sessions', 'aaaaaaaa-0002-4000-8000-000000000002', 'create'),
  ('bbbbbbbb-0004-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'sessions', 'bbbbbbbb-0002-4000-8000-000000000002', 'create');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select results_eq('select count(*) from public.profiles where id in (''11111111-1111-4111-8111-111111111111'', ''22222222-2222-4222-8222-222222222222'')', array[1::bigint], 'A chỉ thấy hồ sơ của mình');
select results_eq('select count(*) from public.students where id in (''aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'', ''bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'')', array[1::bigint], 'A chỉ thấy học sinh của mình');
select results_eq('select count(*) from public.rate_history where id in (''aaaaaaaa-0001-4000-8000-000000000001'', ''bbbbbbbb-0001-4000-8000-000000000001'')', array[1::bigint], 'A chỉ thấy giá của mình');
select results_eq('select count(*) from public.sessions where id in (''aaaaaaaa-0002-4000-8000-000000000002'', ''bbbbbbbb-0002-4000-8000-000000000002'')', array[1::bigint], 'A chỉ thấy lịch của mình');
select results_eq('select count(*) from public.session_students where id in (''aaaaaaaa-0003-4000-8000-000000000003'', ''bbbbbbbb-0003-4000-8000-000000000003'')', array[1::bigint], 'A chỉ thấy dòng tham gia của mình');
select results_eq('select count(*) from public.audit_events where id in (''aaaaaaaa-0004-4000-8000-000000000004'', ''bbbbbbbb-0004-4000-8000-000000000004'')', array[1::bigint], 'A chỉ thấy audit của mình');

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select results_eq('select count(*) from public.students where id in (''aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'', ''bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'')', array[1::bigint], 'B chỉ thấy học sinh của mình');

set local role anon;
set local request.jwt.claim.sub = '';
select results_eq('select count(*) from public.students where id in (''aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'', ''bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'')', array[0::bigint], 'Khách không thấy học sinh');

select * from finish();
rollback;
