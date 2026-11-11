create function private.finalize_attendance(
  p_session_id uuid, p_student_id uuid, p_status text,
  p_actual_start_at timestamptz default null, p_actual_minutes integer default null,
  p_override_rate_vnd_per_hour bigint default null, p_override_reason text default null,
  p_makeup_for_id uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_row public.session_students%rowtype;
  v_before jsonb;
  v_rate bigint;
  v_charge numeric;
  v_source public.session_students%rowtype;
begin
  if v_owner is null then raise exception 'Cần đăng nhập giáo viên' using errcode = '42501'; end if;
  select * into v_session from public.sessions where id = p_session_id and owner_id = v_owner for update;
  if not found then raise exception 'Không tìm thấy lịch thuộc tài khoản' using errcode = '42501'; end if;
  if v_session.deleted_at is not null then raise exception 'Lịch đã xóa' using errcode = '22023'; end if;
  select * into v_row from public.session_students
    where session_id = p_session_id and student_id = p_student_id and owner_id = v_owner for update;
  if not found then raise exception 'Học sinh không thuộc lịch' using errcode = '42501'; end if;
  if v_row.status <> 'scheduled' then raise exception 'Dòng học đã chốt; hãy thêm điều chỉnh có lý do' using errcode = '22023'; end if;
  if p_status is null or p_status not in ('completed', 'absent', 'cancelled') then
    raise exception 'Trạng thái tham gia không hợp lệ' using errcode = '22023';
  end if;
  if p_makeup_for_id is not null then
    if p_status <> 'completed' then raise exception 'Chỉ buổi đã học mới là buổi bù' using errcode = '22023'; end if;
    select * into v_source from public.session_students
      where id = p_makeup_for_id and owner_id = v_owner and student_id = p_student_id for update;
    if not found or v_source.status not in ('absent', 'cancelled') then
      raise exception 'Buổi cần bù phải là buổi nghỉ/hủy của cùng học sinh' using errcode = '22023';
    end if;
  end if;
  v_before := to_jsonb(v_row);
  if p_status = 'completed' then
    if p_actual_start_at is null or p_actual_minutes is null or p_actual_minutes <= 0 then
      raise exception 'Giờ và phút thực học không hợp lệ' using errcode = '22023';
    end if;
    if p_override_rate_vnd_per_hour is not null then
      if p_override_rate_vnd_per_hour < 0 or nullif(btrim(p_override_reason), '') is null then
        raise exception 'Giá riêng cần số tiền hợp lệ và lý do' using errcode = '22023';
      end if;
      v_rate := p_override_rate_vnd_per_hour;
    else
      if nullif(btrim(p_override_reason), '') is not null then
        raise exception 'Lý do giá riêng cần có giá riêng' using errcode = '22023';
      end if;
      select rate_vnd_per_hour into v_rate from public.rate_history
        where owner_id = v_owner and student_id = p_student_id
          and effective_from <= (p_actual_start_at at time zone 'Asia/Ho_Chi_Minh')::date
        order by effective_from desc limit 1;
      if not found then raise exception 'Chưa có đơn giá hiệu lực' using errcode = '22023'; end if;
    end if;
    v_charge := floor((v_rate::numeric * p_actual_minutes + 30) / 60);
    if v_rate > 9007199254740991 or v_charge > 9007199254740991 then
      raise exception 'Số tiền vượt giới hạn an toàn' using errcode = '22003';
    end if;
    update public.session_students set status = 'completed', actual_start_at = p_actual_start_at,
      actual_minutes = p_actual_minutes, rate_snapshot_vnd_per_hour = v_rate,
      charge_vnd = v_charge::bigint, override_reason = nullif(btrim(p_override_reason), ''),
      makeup_for_id = p_makeup_for_id, updated_at = now()
      where id = v_row.id returning * into v_row;
  else
    if p_actual_start_at is not null or p_actual_minutes is not null or
       p_override_rate_vnd_per_hour is not null or p_makeup_for_id is not null then
      raise exception 'Dòng nghỉ/hủy không có giờ, giá hoặc liên kết bù' using errcode = '22023';
    end if;
    update public.session_students set status = p_status, updated_at = now()
      where id = v_row.id returning * into v_row;
  end if;
  insert into public.audit_events (owner_id, actor_id, entity_table, entity_id, action, before_row, after_row, reason)
    values (v_owner, v_owner, 'session_students', v_row.id, 'finalize', v_before, to_jsonb(v_row), v_row.override_reason);
  return v_row.id;
end;
$$;

create unique index session_students_makeup_once_idx on public.session_students(makeup_for_id)
  where makeup_for_id is not null;

revoke all on function private.finalize_attendance(uuid, uuid, text, timestamptz, integer, bigint, text, uuid) from public;
grant execute on function private.finalize_attendance(uuid, uuid, text, timestamptz, integer, bigint, text, uuid) to authenticated;

create function public.finalize_attendance(
  p_session_id uuid, p_student_id uuid, p_status text,
  p_actual_start_at timestamptz default null, p_actual_minutes integer default null,
  p_override_rate_vnd_per_hour bigint default null, p_override_reason text default null,
  p_makeup_for_id uuid default null
) returns uuid language sql security invoker set search_path = '' as $$
  select private.finalize_attendance(p_session_id, p_student_id, p_status, p_actual_start_at,
    p_actual_minutes, p_override_rate_vnd_per_hour, p_override_reason, p_makeup_for_id);
$$;
revoke all on function public.finalize_attendance(uuid, uuid, text, timestamptz, integer, bigint, text, uuid) from public;
grant execute on function public.finalize_attendance(uuid, uuid, text, timestamptz, integer, bigint, text, uuid) to authenticated;
