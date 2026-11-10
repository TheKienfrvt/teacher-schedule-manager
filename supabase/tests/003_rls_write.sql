begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('33333333-3333-4333-8333-333333333333', 'teacher-c@test.local'),
  ('44444444-4444-4444-8444-444444444444', 'teacher-d@test.local');
insert into public.students (id, owner_id, name) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '33333333-3333-4333-8333-333333333333', 'Cúc'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '44444444-4444-4444-8444-444444444444', 'Dung');

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

select results_eq(
  $$insert into public.students (id, owner_id, name) values ('cccccccc-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Chi') returning name$$,
  array['Chi'], 'Giáo viên được thêm học sinh của mình');

select throws_ok(
  $$insert into public.students (owner_id, name) values ('44444444-4444-4444-8444-444444444444', 'Sai chủ')$$,
  '42501', null, 'Không được thêm học sinh cho giáo viên khác');

select is_empty(
  $$update public.students set name = 'Đã sửa lén' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' returning id$$,
  'Không sửa được học sinh của giáo viên khác');

select results_eq(
  $$update public.students set name = 'Cúc mới' where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' returning name$$,
  array['Cúc mới'], 'Được sửa học sinh của mình');

select results_eq(
  $$insert into public.rate_history (owner_id, student_id, effective_from, rate_vnd_per_hour)
    values ('33333333-3333-4333-8333-333333333333', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '2026-11-10', 100000)
    returning rate_vnd_per_hour$$,
  array[100000::bigint], 'Được thêm giá cho học sinh của mình');

select throws_ok(
  $$insert into public.rate_history (owner_id, student_id, effective_from, rate_vnd_per_hour)
    values ('33333333-3333-4333-8333-333333333333', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '2026-11-10', 100000)$$,
  '23503', null, 'Không ghép giá với học sinh khác chủ');

select throws_ok(
  $$insert into public.sessions (owner_id, planned_start_at, planned_minutes, mode)
    values ('33333333-3333-4333-8333-333333333333', '2026-11-10 11:00+00', 90, 'online')$$,
  '42501', null, 'Không ghi lịch trực tiếp ngoài giao dịch');

select throws_ok(
  $$insert into public.audit_events (owner_id, actor_id, entity_table, entity_id, action)
    values ('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'students', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'fake')$$,
  '42501', null, 'Không tự ghi audit giả');

select ok(to_regprocedure('public.create_session(timestamp with time zone,integer,text,uuid[],text,text,text)') is not null, 'Có RPC tạo lịch nguyên tử');
select ok(to_regprocedure('public.update_session(uuid,timestamp with time zone,integer,text,uuid[],text,text,text)') is not null, 'Có RPC sửa lịch nguyên tử');
select ok(to_regprocedure('public.soft_delete_session(uuid)') is not null, 'Có RPC xóa mềm lịch');

select * from finish();
rollback;
