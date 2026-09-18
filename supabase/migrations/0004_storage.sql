-- Bucket privado para facturas (PDF/XML) y el logo del PDF (carpeta brand/).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'facturas', 'facturas', false, 10485760,
  array['application/pdf','application/xml','text/xml','image/png','image/jpeg','image/svg+xml']
)
on conflict (id) do nothing;

create policy "facturas_auth_read"   on storage.objects for select to authenticated using (bucket_id = 'facturas');
create policy "facturas_auth_insert" on storage.objects for insert to authenticated with check (bucket_id = 'facturas');
create policy "facturas_auth_update" on storage.objects for update to authenticated using (bucket_id = 'facturas');
create policy "facturas_auth_delete" on storage.objects for delete to authenticated using (bucket_id = 'facturas');
