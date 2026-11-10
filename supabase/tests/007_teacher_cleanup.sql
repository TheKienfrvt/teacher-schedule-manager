begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values ('99999999-9999-4999-8999-999999999999', 'teacher-cleanup@test.local');
set local role authenticated;
set local request.jwt.claim.sub = '99999999-9999-4999-8999-999999999999';
select public.create_student('Em thử', null, null, '2026-11-01', 100000);
select public.create_session('2026-11-10 11:00+00', 60, 'online',
  array[(select id from public.students where owner_id = '99999999-9999-4999-8999-999999999999')]::uuid[]);
reset role;

savepoint keep_history;
delete from public.students where owner_id = '99999999-9999-4999-8999-999999999999';
select throws_ok(
  $$set constraints session_students_student_id_owner_id_fkey immediate$$,
  '23503', null, 'Không xóa cứng học sinh có lịch khi tài khoản còn hoạt động');
rollback to savepoint keep_history;

select lives_ok(
  $$delete from auth.users where id = '99999999-9999-4999-8999-999999999999'$$,
  'Xóa tài khoản thử đã có học sinh, lịch và audit');
select results_eq(
  $$select count(*) from public.profiles where id = '99999999-9999-4999-8999-999999999999'$$,
  array[0::bigint], 'Hồ sơ giáo viên bị xóa cùng tài khoản');
select results_eq(
  $$select count(*) from public.students where owner_id = '99999999-9999-4999-8999-999999999999'$$,
  array[0::bigint], 'Dữ liệu học sinh thử được dọn');
select results_eq(
  $$select count(*) from public.audit_events where owner_id = '99999999-9999-4999-8999-999999999999'$$,
  array[0::bigint], 'Audit thử được dọn');

select * from finish();
rollback;
