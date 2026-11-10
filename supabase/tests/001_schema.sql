begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select has_table('public', 'profiles', 'Có bảng hồ sơ giáo viên');
select has_table('public', 'students', 'Có bảng học sinh');
select has_table('public', 'rate_history', 'Có bảng lịch sử giá');
select has_table('public', 'sessions', 'Có bảng lịch học');
select has_table('public', 'session_students', 'Có bảng từng học sinh trong buổi');
select has_table('public', 'audit_events', 'Có bảng dấu vết');

select * from finish();
rollback;
