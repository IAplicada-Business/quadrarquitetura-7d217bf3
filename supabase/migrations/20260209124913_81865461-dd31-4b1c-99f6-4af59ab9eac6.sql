
-- Fix the overly permissive INSERT on lead_form_submissions
-- Drop and recreate with anon role check
DROP POLICY "Anyone can submit lead form" ON public.lead_form_submissions;
CREATE POLICY "Anon and authenticated can submit lead form" ON public.lead_form_submissions 
  FOR INSERT WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' IN ('anon', 'authenticated')
  );
