-- Drop the existing plain indexes (replaced by unique constraints below)
DROP INDEX IF EXISTS "Member_mobile_idx";
DROP INDEX IF EXISTS "Member_email_idx";

-- CreateIndex: unique constraint on mobile (required field)
CREATE UNIQUE INDEX "Member_mobile_key" ON "Member"("mobile");

-- CreateIndex: unique constraint on email (optional field — PostgreSQL treats
-- each NULL as distinct so multiple members without an email remain valid)
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
