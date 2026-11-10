alter table public.sessions
  add column planned_end_at timestamptz;

update public.sessions
  set planned_end_at = planned_start_at + planned_minutes * interval '1 minute';

alter table public.sessions alter column planned_end_at set not null;

create function private.set_session_planned_end()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.planned_end_at := new.planned_start_at + new.planned_minutes * interval '1 minute';
  return new;
end;
$$;

create trigger session_planned_end
before insert or update of planned_start_at, planned_minutes on public.sessions
for each row execute function private.set_session_planned_end();

create index sessions_owner_active_window_idx
  on public.sessions (owner_id, planned_start_at, planned_end_at)
  where deleted_at is null;
