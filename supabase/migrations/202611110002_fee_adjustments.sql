create table public.fee_adjustments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null,
  session_student_id uuid not null,
  period_month date not null check (period_month = date_trunc('month', period_month)::date),
  amount_vnd bigint not null check (amount_vnd <> 0),
  reason text not null check (length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now(),
  foreign key (student_id, owner_id) references public.students(id, owner_id) on delete cascade,
  foreign key (session_student_id, owner_id) references public.session_students(id, owner_id) on delete cascade
);
create index fee_adjustments_owner_student_period_idx on public.fee_adjustments(owner_id, student_id, period_month);
create index fee_adjustments_session_student_idx on public.fee_adjustments(session_student_id);
alter table public.fee_adjustments enable row level security;
create policy fee_adjustments_read_own on public.fee_adjustments
  for select to authenticated using ((select auth.uid()) = owner_id);

create function private.add_fee_adjustment(
  p_student_id uuid, p_session_student_id uuid, p_amount_vnd bigint, p_reason text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_row public.session_students%rowtype;
  v_session public.sessions%rowtype;
  v_previous numeric;
  v_period date;
  v_adjustment public.fee_adjustments%rowtype;
begin
  if v_owner is null then raise exception 'Cần đăng nhập giáo viên' using errcode = '42501'; end if;
  select * into v_row from public.session_students
    where id = p_session_student_id and student_id = p_student_id and owner_id = v_owner for update;
  if not found then raise exception 'Dòng học không thuộc tài khoản' using errcode = '42501'; end if;
  if v_row.status = 'scheduled' then raise exception 'Chưa chốt buổi học' using errcode = '22023'; end if;
  if p_amount_vnd is null or p_amount_vnd = 0 or p_amount_vnd < -9007199254740991 or
     p_amount_vnd > 9007199254740991 or p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
    raise exception 'Khoản điều chỉnh hoặc lý do không hợp lệ' using errcode = '22023';
  end if;
  select * into v_session from public.sessions where id = v_row.session_id and owner_id = v_owner;
  v_period := date_trunc('month', coalesce(v_row.actual_start_at, v_session.planned_start_at)
    at time zone 'Asia/Ho_Chi_Minh')::date;
  select coalesce(sum(amount_vnd), 0) into v_previous from public.fee_adjustments
    where session_student_id = v_row.id and owner_id = v_owner;
  if v_row.charge_vnd::numeric + v_previous + p_amount_vnd < 0 or
     v_row.charge_vnd::numeric + v_previous + p_amount_vnd > 9007199254740991 then
    raise exception 'Tổng tiền của dòng học vượt giới hạn' using errcode = '22023';
  end if;
  insert into public.fee_adjustments (owner_id, actor_id, student_id, session_student_id, period_month, amount_vnd, reason)
    values (v_owner, v_owner, p_student_id, p_session_student_id, v_period, p_amount_vnd, btrim(p_reason))
    returning * into v_adjustment;
  insert into public.audit_events (owner_id, actor_id, entity_table, entity_id, action, after_row, reason)
    values (v_owner, v_owner, 'fee_adjustments', v_adjustment.id, 'create', to_jsonb(v_adjustment), v_adjustment.reason);
  return v_adjustment.id;
end;
$$;
revoke all on function private.add_fee_adjustment(uuid, uuid, bigint, text) from public;
grant execute on function private.add_fee_adjustment(uuid, uuid, bigint, text) to authenticated;

create function public.add_fee_adjustment(
  p_student_id uuid, p_session_student_id uuid, p_amount_vnd bigint, p_reason text
) returns uuid language sql security invoker set search_path = '' as $$
  select private.add_fee_adjustment(p_student_id, p_session_student_id, p_amount_vnd, p_reason);
$$;
revoke all on function public.add_fee_adjustment(uuid, uuid, bigint, text) from public;
grant execute on function public.add_fee_adjustment(uuid, uuid, bigint, text) to authenticated;
