-- Grant admin role to a specific user
UPDATE public.profiles 
SET role = 'admin' 
WHERE username = 'rdxtreme';
