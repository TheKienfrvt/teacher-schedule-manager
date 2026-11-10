create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.create_session(
  p_planned_start_at timestamptz,
  p_planned_minutes integer,
  p_mode text,
  p_student_ids uuid[],
  p_location text default null,
  p_meeting_url text default null,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_valid_count integer;
begin
  if v_owner is null then
    raise exception 'Cần đăng nhập giáo viên' using errcode = '42501';
  end if;
  if p_planned_start_at is null or p_planned_minutes is null or p_planned_minutes <= 0 or p_mode not in ('in_person', 'online') then
    raise exception 'Thời gian hoặc hình thức không hợp lệ' using errcode = '22023';
  end if;
  if p_student_ids is null or cardinality(p_student_ids) = 0 or
     (select count(distinct id) from unnest(p_student_ids) as id) <> cardinality(p_student_ids) then
    raise exception 'Chọn ít nhất một học sinh, không chọn trùng' using errcode = '22023';
  end if;
  select count(*) into v_valid_count
    from public.students
    where owner_id = v_owner and archived_at is null and id = any(p_student_ids);
  if v_valid_count <> cardinality(p_student_ids) then
    raise exception 'Học sinh không thuộc giáo viên hiện tại' using errcode = '42501';
  end if;

  insert into public.sessions (owner_id, planned_start_at, planned_minutes, mode, location, meeting_url, notes)
  values (v_owner, p_planned_start_at, p_planned_minutes, p_mode, p_location, p_meeting_url, p_notes)
  returning * into v_session;

  insert into public.session_students (owner_id, session_id, student_id)
  select v_owner, v_session.id, id from unnest(p_student_ids) as id;

  insert into public.audit_events (owner_id, actor_id, entity_table, entity_id, action, after_row)
  values (v_owner, v_owner, 'sessions', v_session.id, 'create', to_jsonb(v_session));

  return v_session.id;
end;
$$;

revoke all on function private.create_session(timestamptz, integer, text, uuid[], text, text, text) from public;
grant execute on function private.create_session(timestamptz, integer, text, uuid[], text, text, text) to authenticated;

create function public.create_session(
  p_planned_start_at timestamptz,
  p_planned_minutes integer,
  p_mode text,
  p_student_ids uuid[],
  p_location text default null,
  p_meeting_url text default null,
  p_notes text default null
) returns uuid
language sql security invoker set search_path = '' as $$
  select private.create_session(p_planned_start_at, p_planned_minutes, p_mode, p_student_ids, p_location, p_meeting_url, p_notes);
$$;

revoke all on function public.create_session(timestamptz, integer, text, uuid[], text, text, text) from public;
grant execute on function public.create_session(timestamptz, integer, text, uuid[], text, text, text) to authenticated;
