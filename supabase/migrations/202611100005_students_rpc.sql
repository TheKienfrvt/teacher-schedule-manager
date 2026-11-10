create function private.create_student(
  p_name text, p_contact text, p_notes text,
  p_effective_from date, p_rate_vnd_per_hour bigint
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_student public.students%rowtype;
begin
  if v_owner is null then
    raise exception 'Cần đăng nhập giáo viên' using errcode = '42501';
  end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 160 or
     p_effective_from is null or p_rate_vnd_per_hour is null or p_rate_vnd_per_hour < 0 then
    raise exception 'Hồ sơ hoặc đơn giá không hợp lệ' using errcode = '22023';
  end if;
  insert into public.students (owner_id, name, contact, notes)
  values (v_owner, btrim(p_name), p_contact, p_notes) returning * into v_student;
  insert into public.rate_history (owner_id, student_id, effective_from, rate_vnd_per_hour)
  values (v_owner, v_student.id, p_effective_from, p_rate_vnd_per_hour);
  insert into public.audit_events (owner_id, actor_id, entity_table, entity_id, action, after_row)
  values (v_owner, v_owner, 'students', v_student.id, 'create', to_jsonb(v_student));
  return v_student.id;
end;
$$;

revoke all on function private.create_student(text, text, text, date, bigint) from public;
grant execute on function private.create_student(text, text, text, date, bigint) to authenticated;

create function public.create_student(
  p_name text, p_contact text, p_notes text,
  p_effective_from date, p_rate_vnd_per_hour bigint
) returns uuid
language sql security invoker set search_path = '' as $$
  select private.create_student(p_name, p_contact, p_notes, p_effective_from, p_rate_vnd_per_hour);
$$;
revoke all on function public.create_student(text, text, text, date, bigint) from public;
grant execute on function public.create_student(text, text, text, date, bigint) to authenticated;

create function private.add_student_rate(
  p_student_id uuid, p_effective_from date, p_rate_vnd_per_hour bigint
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_rate_id uuid;
begin
  if v_owner is null then
    raise exception 'Cần đăng nhập giáo viên' using errcode = '42501';
  end if;
  if not exists (select 1 from public.students where id = p_student_id and owner_id = v_owner and archived_at is null) then
    raise exception 'Học sinh không thuộc giáo viên hiện tại' using errcode = '42501';
  end if;
  if p_effective_from is null or p_rate_vnd_per_hour is null or p_rate_vnd_per_hour < 0 then
    raise exception 'Đơn giá không hợp lệ' using errcode = '22023';
  end if;
  insert into public.rate_history (owner_id, student_id, effective_from, rate_vnd_per_hour)
  values (v_owner, p_student_id, p_effective_from, p_rate_vnd_per_hour)
  returning id into v_rate_id;
  insert into public.audit_events (owner_id, actor_id, entity_table, entity_id, action, after_row)
  values (v_owner, v_owner, 'rate_history', v_rate_id, 'create',
    jsonb_build_object('student_id', p_student_id, 'effective_from', p_effective_from, 'rate_vnd_per_hour', p_rate_vnd_per_hour));
  return v_rate_id;
end;
$$;
revoke all on function private.add_student_rate(uuid, date, bigint) from public;
grant execute on function private.add_student_rate(uuid, date, bigint) to authenticated;

create function public.add_student_rate(
  p_student_id uuid, p_effective_from date, p_rate_vnd_per_hour bigint
) returns uuid
language sql security invoker set search_path = '' as $$
  select private.add_student_rate(p_student_id, p_effective_from, p_rate_vnd_per_hour);
$$;
revoke all on function public.add_student_rate(uuid, date, bigint) from public;
grant execute on function public.add_student_rate(uuid, date, bigint) to authenticated;
