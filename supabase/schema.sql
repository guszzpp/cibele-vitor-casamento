-- Cibele & Vitor — banco exclusivo do casamento.
-- Execute SOMENTE em um novo projeto Supabase dedicado.
-- Tabelas públicas têm RLS ativado; dados de RSVP e intenções são privados.
-- Não inclui cobranças, pagamentos ou webhooks financeiros.

create extension if not exists pgcrypto;

create table if not exists public.wedding_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(btrim(guest_name)) between 2 and 120),
  email text check (email is null or char_length(email) <= 180),
  attending boolean not null,
  companions smallint not null default 0 check (companions between 0 and 4),
  dietary text check (dietary is null or char_length(dietary) <= 240),
  created_at timestamptz not null default now(),
  constraint no_companions_if_absent check (attending or companions = 0)
);

create table if not exists public.wedding_messages (
  id uuid primary key default gen_random_uuid(),
  author text not null check (char_length(btrim(author)) between 2 and 100),
  body text not null check (char_length(btrim(body)) between 6 and 700),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  description text not null check (char_length(description) <= 300),
  price_cents integer not null check (price_cents between 100 and 100000000),
  category text not null check (category in ('lar','momentos','viagem')),
  symbol text not null default '♡',
  color text not null default 'sage' check (color in ('sage','rose','sand','blue')),
  display_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.gift_intents (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete restrict,
  buyer_name text not null check (char_length(btrim(buyer_name)) between 2 and 100),
  buyer_email text check (buyer_email is null or char_length(buyer_email) <= 180),
  note text check (note is null or char_length(note) <= 240),
  status text not null default 'interest' check (status in ('interest','contacted','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists rsvps_created_idx on public.rsvps(created_at desc);
create index if not exists messages_approved_created_idx on public.wedding_messages(approved,created_at desc);
create index if not exists gift_intents_created_idx on public.gift_intents(created_at desc);
create index if not exists gifts_order_idx on public.gifts(active,display_order);

alter table public.wedding_admins enable row level security;
alter table public.rsvps enable row level security;
alter table public.wedding_messages enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_intents enable row level security;

-- Remove permissões herdadas; conceda apenas as estritamente necessárias.
revoke all on public.wedding_admins from anon,authenticated;
revoke all on public.rsvps from anon,authenticated;
revoke all on public.wedding_messages from anon,authenticated;
revoke all on public.gifts from anon,authenticated;
revoke all on public.gift_intents from anon,authenticated;

grant select on public.wedding_admins to authenticated;
grant insert(guest_name,email,attending,companions,dietary) on public.rsvps to anon,authenticated;
grant select on public.rsvps to authenticated;
grant select on public.wedding_messages to anon,authenticated;
grant insert(author,body) on public.wedding_messages to anon,authenticated;
grant update(approved) on public.wedding_messages to authenticated;
grant select on public.gifts to anon,authenticated;
grant insert(gift_id,buyer_name,buyer_email,note) on public.gift_intents to anon,authenticated;
grant select on public.gift_intents to authenticated;

-- Administradores: UID em tabela protegida, sem confiar em metadados editáveis.
create policy "admin can read own membership" on public.wedding_admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "public may submit rsvp" on public.rsvps
  for insert to anon,authenticated with check (true);
create policy "admins see rsvp" on public.rsvps
  for select to authenticated using (exists (
    select 1 from public.wedding_admins a where a.user_id=(select auth.uid())
  ));

create policy "approved messages only or admin" on public.wedding_messages
  for select to anon,authenticated using (approved or exists (
    select 1 from public.wedding_admins a where a.user_id=(select auth.uid())
  ));
create policy "public may submit unapproved message" on public.wedding_messages
  for insert to anon,authenticated with check (approved = false);
create policy "admins moderate" on public.wedding_messages
  for update to authenticated using (exists (
    select 1 from public.wedding_admins a where a.user_id=(select auth.uid())
  )) with check (exists (
    select 1 from public.wedding_admins a where a.user_id=(select auth.uid())
  ));

create policy "public can see active gifts and admins all" on public.gifts
  for select to anon,authenticated using (active or exists (
    select 1 from public.wedding_admins a where a.user_id=(select auth.uid())
  ));

create policy "public may register interest in active gift" on public.gift_intents
  for insert to anon,authenticated with check (
    status = 'interest' and exists (
      select 1 from public.gifts g where g.id=gift_id and g.active
    )
  );
create policy "admins see gift interest" on public.gift_intents
  for select to authenticated using (exists (
    select 1 from public.wedding_admins a where a.user_id=(select auth.uid())
  ));

-- Exemplo de catálogo (valores fictícios). ON CONFLICT não duplica itens.
insert into public.gifts (id,title,description,price_cents,category,symbol,color,display_order) values
('11111111-1111-4111-8111-111111111111','Nosso primeiro café','Para as manhãs preguiçosas a dois.',8900,'lar','☕','sand',1),
('22222222-2222-4222-8222-222222222222','Jantar sob as estrelas','Uma noite só nossa, com muito amor.',25000,'momentos','🍷','rose',2),
('33333333-3333-4333-8333-333333333333','Um cantinho especial','Pequenos detalhes para o nosso novo lar.',18900,'lar','🪴','sage',3),
('44444444-4444-4444-8444-444444444444','Passeio na lua de mel','Uma aventura para lembrar para sempre.',35000,'viagem','🏝️','blue',4),
('55555555-5555-4555-8555-555555555555','Brinde à vida','Uma taça erguida ao nosso futuro.',12000,'momentos','🥂','sand',5),
('66666666-6666-4666-8666-666666666666','Noites de sonhos','Uma noite especial durante a viagem.',49000,'viagem','🧳','rose',6)
on conflict (id) do nothing;

-- Administradores: após criar usuário via Supabase Auth, substitua EMAIL_REAL:
-- insert into public.wedding_admins(user_id)
-- select id from auth.users where email = 'EMAIL_REAL' on conflict do nothing;

-- Produção: formularios públicos precisam de CAPTCHA e controle de abuso
-- (por exemplo, Edge Functions com verificação de token). O modo atual é piloto.