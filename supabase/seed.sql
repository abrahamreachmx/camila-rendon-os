-- =====================================================================
-- ATENCIÓN: este archivo BORRA TODAS LAS TABLAS antes de insertar.
-- Desde la carga de los datos reales (septiembre 2026) correrlo contra la
-- base de producción destruye la operación de Camila. Úsalo sólo para
-- levantar un entorno limpio de pruebas.
-- =====================================================================
-- Datos demo (BLUEPRINT.md §4). Re-ejecutable: limpia y vuelve a insertar.
-- Fecha de referencia del set: 18 de septiembre de 2026.
-- No crea usuarios de auth; la usuaria Ana se crea aparte.

begin;

truncate table reports, quotes, invoices, payment_schedules, campaign_items,
               campaigns, gifting, contacts, companies, services,
               campaign_statuses, settings restart identity cascade;

-- ---------------------------------------------------------------- settings
insert into settings (id, commission_pct, default_currency, brand_name, brand_handle,
                      brand_email, brand_phone, quote_footer, quote_validity_days, payment_presets)
values (
  1, 20.00, 'MXN', 'Camila Rendón', '@camilarendon',
  'ana@ejemplo.com', '+52 55 1234 5678',
  'Precios antes de impuestos. Cotización válida 15 días.',
  15,
  '[
    { "key": "contado", "label": "Contado (a la firma)",             "parts": [{ "pct": 100, "days": 0 }] },
    { "key": "30",      "label": "30 días",                          "parts": [{ "pct": 100, "days": 30 }] },
    { "key": "60",      "label": "60 días",                          "parts": [{ "pct": 100, "days": 60 }] },
    { "key": "90",      "label": "90 días",                          "parts": [{ "pct": 100, "days": 90 }] },
    { "key": "50-50",   "label": "50 % firma / 50 % a 30 días",      "parts": [{ "pct": 50, "days": 0 }, { "pct": 50, "days": 30 }] }
  ]'::jsonb
);

-- -------------------------------------------------------- campaign_statuses
insert into campaign_statuses (id, name, color, sort_order, is_default, is_closed) values
  ('11111111-0000-4000-8000-000000000001', 'En aprobación',         '#C08A2E', 1, true,  false),
  ('11111111-0000-4000-8000-000000000002', 'Pendiente de ejecutar', '#6B2D4F', 2, false, false),
  ('11111111-0000-4000-8000-000000000003', 'Ejecutada',             '#3E7C5A', 3, false, true),
  ('11111111-0000-4000-8000-000000000004', 'Cancelada',             '#8B8079', 4, false, true);

-- ---------------------------------------------------------------- services
insert into services (id, name, default_price, currency, paid_media_default, description, active, sort_order) values
  ('22222222-0000-4000-8000-000000000001', 'Reel de Instagram',                18000, 'MXN', false, 'Reel de hasta 60 segundos, guion y edición incluidos.',        true, 1),
  ('22222222-0000-4000-8000-000000000002', 'TikTok',                           15000, 'MXN', false, 'Video nativo para TikTok, formato vertical.',                  true, 2),
  ('22222222-0000-4000-8000-000000000003', 'Historias de Instagram (set de 3)',  6000, 'MXN', false, 'Tres historias con liga y sticker de mención.',                true, 3),
  ('22222222-0000-4000-8000-000000000004', 'Carrusel de Instagram',            12000, 'MXN', false, 'Carrusel de hasta 8 imágenes con copy.',                       true, 4),
  ('22222222-0000-4000-8000-000000000005', 'Reel con pauta',                   25000, 'MXN', true,  'Reel más autorización de pauta por 30 días.',                  true, 5),
  ('22222222-0000-4000-8000-000000000006', 'Colaboración (publicación en colab)', 20000, 'MXN', false, 'Publicación en colaboración, aparece en ambos perfiles.',   true, 6),
  ('22222222-0000-4000-8000-000000000007', 'Asistencia a evento',              30000, 'MXN', false, 'Asistencia de hasta 3 horas con cobertura en historias.',      true, 7);

-- --------------------------------------------------------------- companies
insert into companies (id, name, stage, industry, website, notes, created_at) values
  ('33333333-0000-4000-8000-000000000001', 'Lumière Beauty',     'cliente',    'Belleza',    'https://lumierebeauty.mx',  'Marca ancla. Renueva por trimestre.',            '2026-05-04 10:00:00-06'),
  ('33333333-0000-4000-8000-000000000002', 'Vera Moda',          'cliente',    'Moda',       'https://veramoda.mx',      'Pagan puntual. Piden factura el mismo día.',     '2026-06-02 11:30:00-06'),
  ('33333333-0000-4000-8000-000000000003', 'Peso Fintech',       'negociando', 'Fintech',    'https://peso.finance',     'Cotizan en dólares. Compliance revisa el guion.', '2026-08-11 09:15:00-06'),
  ('33333333-0000-4000-8000-000000000004', 'Botánica Bebidas',   'negociando', 'Bebidas',    'https://botanica.co',      'Equipo en Bogotá, facturan en pesos colombianos.', '2026-07-21 16:40:00-06'),
  ('33333333-0000-4000-8000-000000000005', 'Nube Viajes',        'prospecto',  'Viajes',     'https://nubeviajes.mx',    'Interesados en un viaje de prensa en noviembre.', '2026-09-02 12:00:00-06'),
  ('33333333-0000-4000-8000-000000000006', 'Tesela Tech',        'prospecto',  'Tecnología', 'https://tesela.io',        'Llegaron por recomendación. Sin propuesta aún.',  '2026-09-12 18:20:00-06');

-- ---------------------------------------------------------------- contacts
insert into contacts (company_id, name, role, phone, email, linkedin, is_primary) values
  ('33333333-0000-4000-8000-000000000001', 'Renata Salas',   'Brand Manager',        '+52 55 2211 0099', 'renata@lumierebeauty.mx', 'https://linkedin.com/in/renatasalas', true),
  ('33333333-0000-4000-8000-000000000001', 'Iván Cortés',    'Coordinador digital',  '+52 55 2211 0100', 'ivan@lumierebeauty.mx',   null,                                  false),
  ('33333333-0000-4000-8000-000000000002', 'Paulina Reyes',  'Directora de Marca',   '+52 55 4455 7788', 'paulina@veramoda.mx',     'https://linkedin.com/in/paulinareyes', true),
  ('33333333-0000-4000-8000-000000000003', 'Diego Márquez',  'Head of Growth',       '+1 305 555 0142',  'diego@peso.finance',      null,                                  true),
  ('33333333-0000-4000-8000-000000000003', 'Sofía Beltrán',  'Compliance',           null,               'sofia@peso.finance',      null,                                  false),
  ('33333333-0000-4000-8000-000000000004', 'Camilo Duque',   'Gerente de Mercadeo',  '+57 320 555 1188', 'camilo@botanica.co',      null,                                  true),
  ('33333333-0000-4000-8000-000000000005', 'Mariana Ortiz',  'Marketing',            '+52 55 8899 1122', 'mariana@nubeviajes.mx',   null,                                  true),
  ('33333333-0000-4000-8000-000000000006', 'Andrés Pineda',  'Fundador',             null,               'andres@tesela.io',        'https://linkedin.com/in/andrespineda', true);

-- --------------------------------------------------------------- campaigns
-- gross_amount y net_amount los calcula el trigger a partir de campaign_items.
insert into campaigns (id, company_id, contact_id, name, status_id, currency, fx_rate_mxn,
                       commission_pct, commission_paid, commission_paid_at, produced,
                       content_due_date, publish_date, signed_at, contract_signed, brief, notes, created_at)
select v.id, v.company_id,
       (select c.id from contacts c where c.company_id = v.company_id and c.is_primary limit 1),
       v.name, v.status_id, v.currency, v.fx_rate_mxn, v.commission_pct, v.commission_paid,
       v.commission_paid_at, v.produced, v.content_due_date, v.publish_date, v.signed_at,
       v.contract_signed, v.brief, v.notes, v.created_at
from (values
  ('44444444-0000-4000-8000-000000000001'::uuid, '33333333-0000-4000-8000-000000000001'::uuid,
   'Lanzamiento Sérum Aurora', '11111111-0000-4000-8000-000000000003'::uuid, 'MXN', 1::numeric,
   20.00::numeric, true, '2026-07-10'::date, true, '2026-06-05'::date, '2026-06-12'::date, '2026-05-28'::date, true,
   'Presentar el sérum como paso final de la rutina de noche. Tono cálido, sin tecnicismos.',
   'Aprobaron guion en la primera vuelta.', '2026-05-26 09:00:00-06'::timestamptz),

  ('44444444-0000-4000-8000-000000000002'::uuid, '33333333-0000-4000-8000-000000000002'::uuid,
   'Cápsula Otoño', '11111111-0000-4000-8000-000000000003'::uuid, 'MXN', 1,
   20.00, true, '2026-08-05', true, '2026-07-02', '2026-07-08', '2026-06-20', true,
   'Tres looks de la cápsula, uno por clima. Locación en casa.',
   'Pidieron no mostrar la etiqueta de precio.', '2026-06-18 15:30:00-06'),

  ('44444444-0000-4000-8000-000000000003'::uuid, '33333333-0000-4000-8000-000000000001'::uuid,
   'Rutina de noche · 3 TikToks', '11111111-0000-4000-8000-000000000003'::uuid, 'MXN', 1,
   20.00, false, null, true, '2026-08-08', '2026-08-14', '2026-07-30', true,
   'Serie de tres TikToks: limpieza, sérum y humectante.',
   'Se negoció descuento por volumen: 42 000 netos sobre 45 000.', '2026-07-28 11:00:00-06'),

  ('44444444-0000-4000-8000-000000000004'::uuid, '33333333-0000-4000-8000-000000000003'::uuid,
   'Educación financiera Q3', '11111111-0000-4000-8000-000000000002'::uuid, 'USD', 18.20,
   20.00, false, null, false, '2026-09-20', '2026-09-25', '2026-09-01', false,
   'Dos reels explicando ahorro automático. Compliance revisa el guion antes de grabar.',
   'Pagan en dólares por transferencia internacional.', '2026-08-28 10:20:00-06'),

  ('44444444-0000-4000-8000-000000000005'::uuid, '33333333-0000-4000-8000-000000000002'::uuid,
   'Evento apertura Polanco', '11111111-0000-4000-8000-000000000001'::uuid, 'MXN', 1,
   20.00, false, null, false, null, null, null, false,
   'Asistencia a la apertura de la tienda con cobertura en historias.',
   'Falta confirmar fecha; tentativo para la última semana de octubre.', '2026-09-10 17:45:00-06'),

  ('44444444-0000-4000-8000-000000000006'::uuid, '33333333-0000-4000-8000-000000000004'::uuid,
   'Verano sin azúcar', '11111111-0000-4000-8000-000000000003'::uuid, 'COP', 0.0045,
   20.00, false, null, true, '2026-08-22', '2026-08-28', '2026-08-10', false,
   'Un reel mostrando la bebida en una tarde de playa.',
   'Facturan desde Colombia; el pago se atrasó.', '2026-08-05 08:30:00-05'),

  ('44444444-0000-4000-8000-000000000007'::uuid, '33333333-0000-4000-8000-000000000003'::uuid,
   'Remesas · noviembre', '11111111-0000-4000-8000-000000000001'::uuid, 'USD', 18.20,
   20.00, false, null, false, '2026-11-05', '2026-11-10', '2026-09-16', false,
   'Reel con pauta sobre envío de remesas + set de historias con la liga.',
   'Pendiente de firma de contrato.', '2026-09-14 13:10:00-06'),

  ('44444444-0000-4000-8000-000000000008'::uuid, '33333333-0000-4000-8000-000000000005'::uuid,
   'Escapada Valle de Bravo', '11111111-0000-4000-8000-000000000002'::uuid, 'MXN', 1,
   20.00, false, null, false, '2026-10-12', '2026-10-20', '2026-09-15', false,
   'Reel y carrusel del fin de semana en Valle. Hospedaje cubierto por la marca.',
   'Confirmaron fechas por WhatsApp.', '2026-09-08 19:00:00-06')
) as v(id, company_id, name, status_id, currency, fx_rate_mxn, commission_pct, commission_paid,
       commission_paid_at, produced, content_due_date, publish_date, signed_at, contract_signed,
       brief, notes, created_at);

-- ---------------------------------------------------------- campaign_items
insert into campaign_items (campaign_id, service_id, description, quantity, unit_price, paid_media, collab, sort_order) values
  -- 1. Lanzamiento Sérum Aurora — 24 000 MXN
  ('44444444-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Reel de Instagram',                 1, 18000, false, false, 1),
  ('44444444-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000003', 'Historias de Instagram (set de 3)', 1,  6000, false, false, 2),
  -- 2. Cápsula Otoño — 27 000 MXN
  ('44444444-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000004', 'Carrusel de Instagram',             1, 12000, false, true,  1),
  ('44444444-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000002', 'TikTok',                            1, 15000, false, false, 2),
  -- 3. Rutina de noche — 45 000 bruto / 42 000 neto
  ('44444444-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000002', 'TikTok',                            3, 15000, false, false, 1),
  -- 4. Educación financiera Q3 — 2 000 USD
  ('44444444-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000005', 'Reel con pauta',                    2,  1000, true,  false, 1),
  -- 5. Evento apertura Polanco — 30 000 MXN
  ('44444444-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000007', 'Asistencia a evento',               1, 30000, false, false, 1),
  -- 6. Verano sin azúcar — 4 000 000 COP (≈18 000 MXN)
  ('44444444-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000001', 'Reel de Instagram',                 1, 4000000, false, false, 1),
  -- 7. Remesas · noviembre — 1 600 USD
  ('44444444-0000-4000-8000-000000000007', '22222222-0000-4000-8000-000000000005', 'Reel con pauta',                    1,  1200, true,  false, 1),
  ('44444444-0000-4000-8000-000000000007', '22222222-0000-4000-8000-000000000003', 'Historias de Instagram (set de 3)', 1,   400, false, false, 2),
  -- 8. Escapada Valle de Bravo — 30 000 MXN
  ('44444444-0000-4000-8000-000000000008', '22222222-0000-4000-8000-000000000001', 'Reel de Instagram',                 1, 18000, false, false, 1),
  ('44444444-0000-4000-8000-000000000008', '22222222-0000-4000-8000-000000000004', 'Carrusel de Instagram',             1, 12000, false, false, 2);

-- Descuento por volumen negociado en la campaña 3
update campaigns set net_amount = 42000 where id = '44444444-0000-4000-8000-000000000003';

-- ------------------------------------------------------- payment_schedules
insert into payment_schedules (campaign_id, due_date, amount, status, paid_at, notes, sort_order) values
  -- 1. 30 días sobre 24 000 — pagado
  ('44444444-0000-4000-8000-000000000001', '2026-06-27',   24000, 'pagado',     '2026-06-30', 'Transferencia SPEI.', 1),
  -- 2. 50 % firma / 50 % a 30 días sobre 27 000 — ambos pagados
  ('44444444-0000-4000-8000-000000000002', '2026-06-20',   13500, 'pagado',     '2026-06-22', null, 1),
  ('44444444-0000-4000-8000-000000000002', '2026-07-20',   13500, 'pagado',     '2026-07-25', 'Entró con 5 días de retraso.', 2),
  -- 3. 60 días sobre 42 000 netos — en proceso, vence pronto
  ('44444444-0000-4000-8000-000000000003', '2026-09-28',   42000, 'en_proceso', null, 'Facturado, en revisión de cuentas por pagar.', 1),
  -- 4. 50/50 sobre 2 000 USD — primero pagado, segundo pendiente
  ('44444444-0000-4000-8000-000000000004', '2026-09-01',    1000, 'pagado',     '2026-09-03', null, 1),
  ('44444444-0000-4000-8000-000000000004', '2026-10-01',    1000, 'pendiente',  null, null, 2),
  -- 6. 30 días sobre 4 000 000 COP — VENCIDO
  ('44444444-0000-4000-8000-000000000006', '2026-09-09', 4000000, 'pendiente',  null, 'Sin respuesta del área de pagos desde el 5 de septiembre.', 1),
  -- 7. 90 días sobre 1 600 USD
  ('44444444-0000-4000-8000-000000000007', '2026-12-15',    1600, 'pendiente',  null, null, 1),
  -- 8. 30 días sobre 30 000 MXN
  ('44444444-0000-4000-8000-000000000008', '2026-10-15',   30000, 'pendiente',  null, null, 1);

-- ------------------------------------------------------------------ quotes
insert into quotes (campaign_id, folio, issued_at, valid_until, currency, items_snapshot, total, payment_terms_label, notes)
select c.id,
       'COT-2026-001', '2026-08-26', '2026-09-10', 'USD',
       (select jsonb_agg(jsonb_build_object(
                 'description', i.description, 'quantity', i.quantity,
                 'unit_price', i.unit_price, 'line_total', i.line_total,
                 'paid_media', i.paid_media, 'collab', i.collab) order by i.sort_order)
          from campaign_items i where i.campaign_id = c.id),
       2000, '50 % firma / 50 % a 30 días', 'Incluye una ronda de ajustes.'
  from campaigns c where c.id = '44444444-0000-4000-8000-000000000004';

insert into quotes (campaign_id, folio, issued_at, valid_until, currency, items_snapshot, total, payment_terms_label, notes)
select c.id,
       'COT-2026-002', '2026-09-08', '2026-09-23', 'MXN',
       (select jsonb_agg(jsonb_build_object(
                 'description', i.description, 'quantity', i.quantity,
                 'unit_price', i.unit_price, 'line_total', i.line_total,
                 'paid_media', i.paid_media, 'collab', i.collab) order by i.sort_order)
          from campaign_items i where i.campaign_id = c.id),
       30000, '30 días', 'Hospedaje y traslados corren por cuenta de la marca.'
  from campaigns c where c.id = '44444444-0000-4000-8000-000000000008';

-- ----------------------------------------------------------------- gifting
insert into gifting (company_id, company_name, contact_email, products, tracking_links, status, received_at, notes, created_at) values
  ('33333333-0000-4000-8000-000000000006', 'Tesela Tech',    'andres@tesela.io',        'Audífonos inalámbricos modelo T2', '{}',                                                                      'propuesto', null,         'Ofrecieron producto a cambio de una historia.', '2026-09-13 10:00:00-06'),
  ('33333333-0000-4000-8000-000000000001', 'Lumière Beauty', 'renata@lumierebeauty.mx', 'Kit de la nueva línea corporal',   '{"https://rastreo.ejemplo.mx/LB-8842"}',                                  'enviado',   null,         'Sale de CDMX, 2 días hábiles.',                 '2026-09-11 09:30:00-06'),
  (null,                                   'Casa Nômade',    'hola@casanomade.mx',      'Dos velas y un difusor',           '{"https://rastreo.ejemplo.mx/CN-1190","https://rastreo.ejemplo.mx/CN-1191"}', 'recibido',  '2026-09-05', 'Llegó una vela rota; avisaron que reponen.',    '2026-08-30 14:20:00-06'),
  ('33333333-0000-4000-8000-000000000002', 'Vera Moda',      'paulina@veramoda.mx',     'Abrigo de la cápsula otoño',       '{"https://rastreo.ejemplo.mx/VM-3321"}',                                  'publicado', '2026-08-18', 'Se publicó en historias el 20 de agosto.',      '2026-08-14 11:00:00-06');

commit;
