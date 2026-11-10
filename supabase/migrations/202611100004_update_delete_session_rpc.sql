create function private.update_session(
  p_session_id uuid,
  p_planned_start_at timestamptz,
  p_planned_minutes integer,
  p_mode text,
  p_student_ids uuid[],
  p_location text default null,
  p_meeting_url text default null,
  p_notes text default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_valid_count integer;
begin
  if v_owner is null then raise exception 'Cần đăng nhập giáo viên' using errcode = '42501'; end if;
  select * into v_session from public.sessions
    where id = p_session_id and owner_id = v_owner for update;
  if not found then raise exception 'Không tìm thấy lịch thuộc tài khoản' using errcode = '42501'; end if;
  if v_session.deleted_at is not null or exists (
    select 1 from public.session_students where session_id = p_session_id and status <> 'scheduled'
  ) then raise exception 'Chỉ sửa lịch chưa chốt' using errcode = '22023'; end if;
  if p_planned_start_at is null or p_planned_minutes is null or p_planned_minutes <= 0 or p_mode is null or p_mode not in ('in_person', 'online') then
    raise exception 'Thời gian hoặc hình thức không hợp lệ' using errcode = '22023';
  end if;
  if p_student_ids is null or cardinality(p_student_ids) = 0 or
     (select count(distinct id) from unnest(p_student_ids) as id) <> cardinality(p_student_ids) then
    raise exception 'Chọn ít nhất một học sinh, không chọn trùng' using errcode = '22023';
  end if;
  select count(*) into v_valid_count from public.students
    where owner_id = v_owner and archived_at is null and id = any(p_student_ids);
  if v_valid_count <> cardinality(p_student_ids) then
    raise exception 'Học sinh không thuộc giáo viên hiện tại' using errcode = '42501';
  end if;

  v_before := to_jsonb(v_session) || jsonb_build_object('student_ids',
    (select coalesce(jsonb_agg(student_id order by student_id), '[]'::jsonb)
      from public.session_students where session_id = p_session_id));

  update public.sessions set planned_start_at = p_planned_start_at,
    planned_minutes = p_planned_minutes, mode = p_mode, location = p_location,
    meeting_url = p_meeting_url, notes = p_notes, updated_at = now()
    where id = p_session_id returning * into v_session;
  delete from public.session_students where session_id = p_session_id;
  insert into public.session_students (owner_id, session_id, student_id)
    select v_owner, p_session_id, id from unnest(p_student_ids) as id;

  v_after := to_jsonb(v_session) || jsonb_build_object('student_ids',
    (select coalesce(jsonb_agg(student_id order by student_id), '[]'::jsonb)
      from public.session_students where session_id = p_session_id));
  insert into public.audit_events (owner_id, actor_id, entity_table, entity_id, action, before_row, after_row)
    values (v_owner, v_owner, 'sessions', p_session_id, 'update', v_before, v_after);
  return true;
end;
$$;

revoke all on function private.update_session(uuid, timestamptz, integer, text, uuid[], text, text, text) from public;
grant execute on function private.update_session(uuid, timestamptz, integer, text, uuid[], text, text, text) to authenticated;

create function public.update_session(
  p_session_id uuid,
  p_planned_start_at timestamptz,
  p_planned_minutes integer,
  p_mode text,
  p_student_ids uuid[],
  p_location text default null,
  p_meeting_url text default null,
  p_notes text default null
) returns boolean
language sql security invoker set search_path = '' as $$
  select private.update_session(p_session_id, p_planned_start_at, p_planned_minutes, p_mode, p_student_ids, p_location, p_meeting_url, p_notes);
$$;
revoke all on function public.update_session(uuid, timestamptz, integer, text, uuid[], text, text, text) from public;
grant execute on function public.update_session(uuid, timestamptz, integer, text, uuid[], text, text, text) to authenticated;

create function private.soft_delete_session(p_session_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_before jsonb;
begin
  if v_owner is null then raise exception 'Cần đăng nhập giáo viên' using errcode = '42501'; end if;
  select * into v_session from public.sessions
    where id = p_session_id and owner_id = v_owner for update;
  if not found then raise exception 'Không tìm thấy lịch thuộc tài khoản' using errcode = '42501'; end if;
  if v_session.deleted_at is not null or exists (
    select 1 from public.session_students where session_id = p_session_id and status <> 'scheduled'
  ) then raise exception 'Chỉ xóa lịch chưa chốt' using errcode = '22023'; end if;
  v_before := to_jsonb(v_session);
  update public.sessions set deleted_at = now(), updated_at = now()
    where id = p_session_id returning * into v_session;
  insert into public.audit_events (owner_id, actor_id, entity_table, entity_id, action, before_row, after_row)
    values (v_owner, v_owner, 'sessions', p_session_id, 'soft_delete', v_before, to_jsonb(v_session));
  return true;
end;
$$;
revoke all on function private.soft_delete_session(uuid) from public;
grant execute on function private.soft_delete_session(uuid) to authenticated;

create function public.soft_delete_session(p_session_id uuid) returns boolean
language sql security invoker set search_path = '' as $$
  select private.soft_delete_session(p_session_id);
$$;
revoke all on function public.soft_delete_session(uuid) from public;
grant execute on function public.soft_delete_session(uuid) to authenticated;
