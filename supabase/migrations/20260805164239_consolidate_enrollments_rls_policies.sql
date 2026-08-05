begin;

drop policy if exists "Admin full access to enrollments" on public.enrollments;
drop policy if exists "Allow admins to manage enrollments" on public.enrollments;
drop policy if exists "Users can insert their own enrollments" on public.enrollments;
drop policy if exists "Allow users to read their own enrollments or admins to read all" on public.enrollments;
drop policy if exists "Students can view own enrollments" on public.enrollments;
drop policy if exists "Users can view their own enrollments" on public.enrollments;
drop policy if exists "Admins can decide pending enrollments" on public.enrollments;

create policy "enrollments_select_authenticated"
on public.enrollments
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.users
    where users.id = (select auth.uid())
      and users.role = 'admin'::user_role
  )
);

create policy "enrollments_insert_authenticated"
on public.enrollments
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.users
    where users.id = (select auth.uid())
      and users.role = 'admin'::user_role
  )
);

create policy "enrollments_update_admin"
on public.enrollments
for update
to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = (select auth.uid())
      and users.role = 'admin'::user_role
  )
)
with check (
  exists (
    select 1 from public.users
    where users.id = (select auth.uid())
      and users.role = 'admin'::user_role
  )
);

create policy "enrollments_delete_admin"
on public.enrollments
for delete
to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = (select auth.uid())
      and users.role = 'admin'::user_role
  )
);

commit;
