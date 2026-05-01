
DROP VIEW IF EXISTS public.audit_logs;
CREATE VIEW public.audit_logs WITH (security_invoker = true) AS
  SELECT id, event_type, actor_id, target_type, target_id, ip_address, metadata, created_at
  FROM public.event_logs;
