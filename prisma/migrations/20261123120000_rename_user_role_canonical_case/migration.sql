-- Rename user_role enum values to canonical casing.
-- ALTER TYPE ... RENAME VALUE updates all dependent columns automatically
-- (user_roles.role, invitations.role).
ALTER TYPE "public"."user_role" RENAME VALUE 'DRIVER' TO 'Driver';
ALTER TYPE "public"."user_role" RENAME VALUE 'MECHANIC' TO 'Mechanic';
ALTER TYPE "public"."user_role" RENAME VALUE 'ADMIN_L1' TO 'Admin_L1';
ALTER TYPE "public"."user_role" RENAME VALUE 'ADMIN_L2' TO 'Admin_L2';
ALTER TYPE "public"."user_role" RENAME VALUE 'SUPER_ADMIN' TO 'Super_Admin';

-- auth.users.role is a varchar column, so update stored values manually.
UPDATE "auth"."users" SET "role" = 'Driver' WHERE "role" = 'DRIVER';
UPDATE "auth"."users" SET "role" = 'Mechanic' WHERE "role" = 'MECHANIC';
UPDATE "auth"."users" SET "role" = 'Admin_L1' WHERE "role" = 'ADMIN_L1';
UPDATE "auth"."users" SET "role" = 'Admin_L2' WHERE "role" = 'ADMIN_L2';
UPDATE "auth"."users" SET "role" = 'Super_Admin' WHERE "role" = 'SUPER_ADMIN';
