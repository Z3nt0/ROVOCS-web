-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_deviceId_fkey";

-- AlterTable
ALTER TABLE "public"."Report" ALTER COLUMN "deviceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
