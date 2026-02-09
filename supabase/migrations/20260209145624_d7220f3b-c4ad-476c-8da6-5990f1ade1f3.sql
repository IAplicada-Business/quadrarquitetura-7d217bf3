INSERT INTO public.user_roles (user_id, role)
VALUES ('627f2b18-2233-4595-9081-d658874e9e7d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;