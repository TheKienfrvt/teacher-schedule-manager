begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('77777777-7777-4777-8777-777777777777', 'teacher-g@test.local'),
  ('88888888-8888-4888-8888-888888888888', 'teacher-h@test.local');

set local role authenticated;
set local request.jwt.claim.sub = '77777777-7777-4777-8777-777777777777';

select lives_ok(
  $$select public.create_student('An', 'Phụ huynh', null, '2026-11-01', 100000)$$,
  'Tạo học sinh và giá ban đầu');
select results_eq(
  $$select rate_vnd_per_hour from public.rate_history where owner_id = '77777777-7777-4777-8777-777777777777'$$,
  array[100000::bigint], 'Giá được tạo cùng hồ sơ');
select results_eq(
  $$select count(*) from public.audit_events where entity_table = 'students' and action = 'create'$$,
  array[1::bigint], 'Có audit khi tạo hồ sơ');
select throws_ok(
  $$select public.create_student('Bình', null, null, '2026-11-01', -1)$$,
  '22023', null, 'Không nhận giá âm');
select results_eq(
  $$select count(*) from public.students where owner_id = '77777777-7777-4777-8777-777777777777'$$,
  array[1::bigint], 'Giá sai không lưu hồ sơ dở dang');

select lives_ok(
  $$select public.add_student_rate((select id from public.students where name = 'An'), '2026-12-01', 120000)$$,
  'Thêm giá có ngày hiệu lực');
select results_eq(
  $$select count(*) from public.rate_history where owner_id = '77777777-7777-4777-8777-777777777777'$$,
  array[2::bigint], 'Giá cũ vẫn còn trong lịch sử');
select throws_ok(
  $$select public.add_student_rate((select id from public.students where name = 'An'), '2026-12-01', 130000)$$,
  '23505', null, 'Không nhận ngày hiệu lực trùng');

set local request.jwt.claim.sub = '88888888-8888-4888-8888-888888888888';
select throws_ok(
  $$select public.add_student_rate((select id from public.students where owner_id = '77777777-7777-4777-8777-777777777777'), '2027-01-01', 999999)$$,
  '42501', null, 'Giáo viên B không thay giá của A');

set local role anon;
set local request.jwt.claim.sub = '';
select throws_ok(
  $$select public.create_student('Khách', null, null, '2026-11-01', 0)$$,
  '42501', null, 'Khách không tạo học sinh');

select * from finish();
rollback;
