ALTER TABLE "Profile" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "Profile" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Profile" ADD COLUMN "approvedBy" TEXT;
