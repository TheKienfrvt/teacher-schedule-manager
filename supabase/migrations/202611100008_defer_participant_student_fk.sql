alter table public.session_students
  drop constraint session_students_student_id_owner_id_fkey,
  add constraint session_students_student_id_owner_id_fkey
    foreign key (student_id, owner_id)
    references public.students(id, owner_id)
    deferrable initially deferred;
