-- ════════════════════════════════════════════════════════════════════
-- جدولة جلب الفيديوهات يومياً — شغّل هذا الملف مرة واحدة في SQL Editor
-- بعد نشر الدالة (npx supabase functions deploy fetch-videos).
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1) احفظ رابط المشروع ومفتاح الخدمة في Vault (مرة واحدة). استبدل القيم ثم احذف علامة التعليق:
-- select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
-- select vault.create_secret('<service_role أو secret key>', 'service_role_key');

-- 2) جدولة يومية الساعة 04:17 بتوقيت مسقط (00:17 UTC)
select cron.unschedule('fetch-videos-daily') where exists (select 1 from cron.job where jobname = 'fetch-videos-daily');
select cron.schedule(
  'fetch-videos-daily',
  '17 0 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/fetch-videos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- للتحقق: select * from cron.job_run_details order by start_time desc limit 5;
-- ونتائج الجلب: select * from public.video_fetch_runs order by started_at desc limit 5;
