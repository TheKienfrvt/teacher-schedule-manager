create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  contact text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.rate_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  student_id uuid not null,
  effective_from date not null,
  rate_vnd_per_hour bigint not null check (rate_vnd_per_hour >= 0),
  created_at timestamptz not null default now(),
  unique (student_id, effective_from),
  foreign key (student_id, owner_id) references public.students(id, owner_id) on delete cascade
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  planned_start_at timestamptz not null,
  planned_minutes integer not null check (planned_minutes > 0),
  mode text not null check (mode in ('in_person', 'online')),
  location text,
  meeting_url text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.session_students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  session_id uuid not null,
  student_id uuid not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'absent', 'cancelled')),
  actual_start_at timestamptz,
  actual_minutes integer check (actual_minutes > 0),
  rate_snapshot_vnd_per_hour bigint check (rate_snapshot_vnd_per_hour >= 0),
  charge_vnd bigint not null default 0 check (charge_vnd >= 0),
  override_reason text,
  makeup_for_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id),
  unique (id, owner_id),
  foreign key (session_id, owner_id) references public.sessions(id, owner_id) on delete cascade,
  foreign key (student_id, owner_id) references public.students(id, owner_id),
  foreign key (makeup_for_id, owner_id) references public.session_students(id, owner_id),
  check (
    (status = 'completed' and actual_start_at is not null and actual_minutes is not null and rate_snapshot_vnd_per_hour is not null)
    or
    (status <> 'completed' and charge_vnd = 0 and actual_start_at is null and actual_minutes is null and rate_snapshot_vnd_per_hour is null)
  )
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  actor_id uuid not null references public.profiles(id),
  entity_table text not null,
  entity_id uuid not null,
  action text not null,
  before_row jsonb,
  after_row jsonb,
  reason text,
  occurred_at timestamptz not null default now()
);

create index students_owner_idx on public.students(owner_id);
create index rates_owner_student_date_idx on public.rate_history(owner_id, student_id, effective_from desc);
create index sessions_owner_start_idx on public.sessions(owner_id, planned_start_at);
create index session_students_owner_session_idx on public.session_students(owner_id, session_id);
create index session_students_owner_student_idx on public.session_students(owner_id, student_id);
create index audit_owner_time_idx on public.audit_events(owner_id, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.rate_history enable row level security;
alter table public.sessions enable row level security;
alter table public.session_students enable row level security;
alter table public.audit_events enable row level security;

create function public.create_teacher_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_teacher_created
after insert on auth.users
for each row execute function public.create_teacher_profile();
