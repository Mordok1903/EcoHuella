create table if not exists public.detalle_fuentes (
  id uuid primary key default gen_random_uuid(),

  calculo_id uuid not null
    references public.calculos(id)
    on delete cascade,

  fuente text not null
    check (
      fuente in (
        'gasolina',
        'diesel',
        'glp',
        'electricidad',
        'vuelos',
        'residuos'
      )
    ),

  cantidad numeric not null
    check (cantidad >= 0),

  unidad text not null,

  factor numeric not null
    check (factor >= 0),

  emisiones_tco2eq numeric not null
    check (emisiones_tco2eq >= 0),

  fecha_creacion timestamptz not null default now(),

  unique (calculo_id, fuente)
);

create index if not exists detalle_fuentes_calculo_id_idx
  on public.detalle_fuentes(calculo_id);

grant select, insert, update, delete
  on public.detalle_fuentes
  to anon, authenticated;

comment on table public.detalle_fuentes is
  'Consumos y emisiones por fuente para trazabilidad y comparación de mediciones.';