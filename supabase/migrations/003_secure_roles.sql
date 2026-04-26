-- 1. Restore the original update policy for general fields
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id);

-- 2. Add a trigger to prevent non-admins from changing protected columns
create or replace function public.protect_profile_roles()
returns trigger as $$
begin
  -- If the user is NOT an admin, prevent them from changing their role or points
  if (not public.is_admin()) then
    -- Revert role to old value if it was changed
    if (new.role is distinct from old.role) then
      new.role := old.role;
    end if;
    
    -- Revert points to old value if it was changed
    if (new.points is distinct from old.points) then
      new.points := old.points;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- 3. Apply the trigger
drop trigger if exists on_profile_update_security on public.profiles;
create trigger on_profile_update_security
  before update on public.profiles
  for each row execute procedure public.protect_profile_roles();
