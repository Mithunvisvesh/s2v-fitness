-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_fullName_idx" ON "Member"("fullName");

-- CreateIndex
CREATE INDEX "Member_mobile_idx" ON "Member"("mobile");

-- CreateIndex
CREATE INDEX "Member_email_idx" ON "Member"("email");

-- CreateIndex
CREATE INDEX "Member_counsellorId_idx" ON "Member"("counsellorId");

-- CreateIndex
CREATE INDEX "Member_trainerId_idx" ON "Member"("trainerId");
