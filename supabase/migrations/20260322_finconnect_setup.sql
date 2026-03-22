create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  full_name text not null,
  email text not null,
  phone text not null,
  province text not null,
  services text[] not null default '{}',
  message text,
  consent text not null default 'Yes',
  status text not null default 'New',
  verification_token text not null unique,
  verification_sent_at timestamptz,
  email_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint leads_status_check check (status in ('New', 'Contacted', 'Closed')),
  constraint leads_consent_check check (consent in ('Yes', 'No'))
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_email_verified_at_idx on public.leads (email_verified_at);
create index if not exists leads_province_idx on public.leads (province);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

 drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute procedure public.set_updated_at();

alter table public.leads enable row level security;

create policy "Admins can view leads"
on public.leads
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update leads"
on public.leads
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete leads"
on public.leads
for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke all on public.leads from anon;
grant select, update, delete on public.leads to authenticated;

comment on table public.leads is 'Lead enquiries submitted by the public website and verified by email before admin action.';
