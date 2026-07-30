-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "amountPaid" DECIMAL(65,30),
ADD COLUMN     "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "MembershipRenewal" ADD COLUMN     "amountPaid" DECIMAL(65,30),
ADD COLUMN     "paymentMethod" TEXT;
