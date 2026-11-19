-- Plataforma de Ponto — estrutura do banco no Supabase.
-- Como usar: Supabase › SQL Editor › New query › cole este arquivo inteiro › Run.
-- Pode rodar de novo sem problema (usa "if not exists" / "or replace").

-- Hora oficial do servidor (o app usa para corrigir o relógio do celular).
create or replace function public.agora() returns timestamptz
language sql stable set search_path = '' as $$ select now() $$;

-- Atualiza "sincronizado_em" sempre que uma linha chega ou muda no servidor.
create or replace function public.marcar_sincronizado() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.sincronizado_em := now();
  return new;
end $$;

-- Registros de ponto (só são acrescentados; remoção é lógica, campo "removido").
create table if not exists public.registros (
  user_id        uuid        not null references auth.users(id) on delete cascade,
  id             uuid        not null,
  data           date        not null,
  tipo           text        not null,
  ts             timestamptz not null,   -- horário corrigido pelo relógio do servidor
  ts_dispositivo timestamptz not null,   -- horário do celular no momento do registro
  offset_ms      integer     not null default 0,
  offline        boolean     not null default false,
  manual         boolean     not null default false,
  removido       boolean     not null default false,
  criado_em      timestamptz not null,
  atualizado_em  timestamptz not null,
  recebido_em    timestamptz not null default now(),
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists registros_sync_idx on public.registros (user_id, sincronizado_em);

-- Feriados cadastrados (e ajustes nos nacionais, com id "nac:<nome>").
create table if not exists public.feriados (
  user_id        uuid        not null references auth.users(id) on delete cascade,
  id             text        not null,
  data           date        not null,
  nome           text        not null default '',
  tipo           text        not null check (tipo in ('federal','estadual','municipal','religioso','mundial')),
  recorrente     boolean     not null default false,
  removido       boolean     not null default false,
  atualizado_em  timestamptz not null,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists feriados_sync_idx on public.feriados (user_id, sincronizado_em);

-- Cadastro e configurações (regime, horários, salário, histórico).
create table if not exists public.config (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  dados          jsonb       not null,
  atualizado_em  timestamptz not null,
  sincronizado_em timestamptz not null default now()
);

drop trigger if exists registros_sinc on public.registros;
create trigger registros_sinc before insert or update on public.registros
  for each row execute function public.marcar_sincronizado();
drop trigger if exists feriados_sinc on public.feriados;
create trigger feriados_sinc before insert or update on public.feriados
  for each row execute function public.marcar_sincronizado();
drop trigger if exists config_sinc on public.config;
create trigger config_sinc before insert or update on public.config
  for each row execute function public.marcar_sincronizado();

-- Segurança: cada usuário só enxerga e altera os próprios dados.
alter table public.registros enable row level security;
alter table public.feriados  enable row level security;
alter table public.config    enable row level security;

drop policy if exists "dono_registros" on public.registros;
create policy "dono_registros" on public.registros for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "dono_feriados" on public.feriados;
create policy "dono_feriados" on public.feriados for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "dono_config" on public.config;
create policy "dono_config" on public.config for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.registros, public.feriados, public.config to authenticated;
grant execute on function public.agora() to anon, authenticated;
