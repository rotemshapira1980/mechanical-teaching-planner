create table if not exists public.teaching_courses (
  id text primary key,
  code text not null unique,
  title text not null,
  level text not null,
  points numeric check (points is null or points >= 0)
);

create table if not exists public.teaching_requests (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.teaching_courses(id),
  semester text not null check (semester in ('fall', 'spring')),
  lecturer text not null check (length(trim(lecturer)) between 1 and 150),
  teaching_role text not null check (teaching_role in ('lecturer', 'assistant')),
  day text not null check (day in ('ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי')),
  starts_at time not null,
  ends_at time not null,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

alter table public.teaching_courses enable row level security;
alter table public.teaching_requests enable row level security;
revoke all on public.teaching_courses, public.teaching_requests from anon, authenticated;
grant select on public.teaching_courses to anon, authenticated;
grant insert on public.teaching_requests to anon, authenticated;
grant insert, update, delete on public.teaching_courses to authenticated;
grant select, delete on public.teaching_requests to authenticated;

create policy teaching_courses_public_read on public.teaching_courses for select to anon, authenticated using (true);
create policy teaching_courses_admin_insert on public.teaching_courses for insert to authenticated with check ((select auth.uid()) = 'e6045942-5fdf-4e8d-b607-cd7a1280e056'::uuid);
create policy teaching_courses_admin_update on public.teaching_courses for update to authenticated using ((select auth.uid()) = 'e6045942-5fdf-4e8d-b607-cd7a1280e056'::uuid) with check ((select auth.uid()) = 'e6045942-5fdf-4e8d-b607-cd7a1280e056'::uuid);
create policy teaching_courses_admin_delete on public.teaching_courses for delete to authenticated using ((select auth.uid()) = 'e6045942-5fdf-4e8d-b607-cd7a1280e056'::uuid);
create policy teaching_requests_submit on public.teaching_requests for insert to anon, authenticated with check (true);
create policy teaching_requests_admin_read on public.teaching_requests for select to authenticated using ((select auth.uid()) = 'e6045942-5fdf-4e8d-b607-cd7a1280e056'::uuid);
create policy teaching_requests_admin_delete on public.teaching_requests for delete to authenticated using ((select auth.uid()) = 'e6045942-5fdf-4e8d-b607-cd7a1280e056'::uuid);