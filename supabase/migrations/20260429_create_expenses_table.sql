create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  date date not null default current_date,
  category text not null,
  custom_category text null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null default 'UPI',
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_business_id_idx on public.expenses (business_id);
create index if not exists expenses_date_idx on public.expenses (date);

alter table public.expenses enable row level security;

drop policy if exists "Owners can view their expenses" on public.expenses;
create policy "Owners can view their expenses"
on public.expenses
for select
using (
  exists (
    select 1
    from public.business_accounts b
    where b.id = expenses.business_id
      and b.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can insert their expenses" on public.expenses;
create policy "Owners can insert their expenses"
on public.expenses
for insert
with check (
  exists (
    select 1
    from public.business_accounts b
    where b.id = expenses.business_id
      and b.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can update their expenses" on public.expenses;
create policy "Owners can update their expenses"
on public.expenses
for update
using (
  exists (
    select 1
    from public.business_accounts b
    where b.id = expenses.business_id
      and b.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.business_accounts b
    where b.id = expenses.business_id
      and b.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can delete their expenses" on public.expenses;
create policy "Owners can delete their expenses"
on public.expenses
for delete
using (
  exists (
    select 1
    from public.business_accounts b
    where b.id = expenses.business_id
      and b.owner_id = auth.uid()
  )
);
