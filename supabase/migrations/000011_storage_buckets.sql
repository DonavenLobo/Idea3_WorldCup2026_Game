insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'card-uploads',
    'card-uploads',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'card-generated',
    'card-generated',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'card-final',
    'card-final',
    true,
    10485760,
    array['image/png', 'image/webp']
  ),
  (
    'card-assets',
    'card-assets',
    true,
    10485760,
    array['image/png', 'image/webp', 'image/svg+xml']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their own card source images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'card-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own card source images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'card-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own generated card images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'card-generated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Final card images are public readable"
  on storage.objects for select
  using (bucket_id in ('card-final', 'card-assets'));
