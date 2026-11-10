create policy profiles_read_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy students_read_own on public.students
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy students_insert_own on public.students
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy students_update_own on public.students
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy rates_read_own on public.rate_history
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy rates_insert_own on public.rate_history
  for insert to authenticated with check ((select auth.uid()) = owner_id);

create policy sessions_read_own on public.sessions
  for select to authenticated using ((select auth.uid()) = owner_id);

create policy session_students_read_own on public.session_students
  for select to authenticated using ((select auth.uid()) = owner_id);

create policy audit_read_own on public.audit_events
  for select to authenticated using ((select auth.uid()) = owner_id);
