alter table public.audit_events
  drop constraint audit_events_owner_id_fkey,
  add constraint audit_events_owner_id_fkey foreign key (owner_id)
    references public.profiles(id) on delete cascade;

alter table public.audit_events
  drop constraint audit_events_actor_id_fkey,
  add constraint audit_events_actor_id_fkey foreign key (actor_id)
    references public.profiles(id) on delete cascade;
