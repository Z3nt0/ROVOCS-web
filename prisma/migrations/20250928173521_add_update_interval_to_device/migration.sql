/*
  Warnings:

  - Made the column `deviceId` on table `BreathSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `deviceId` on table `Report` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."BreathSession" DROP CONSTRAINT "BreathSession_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_deviceId_fkey";

-- AlterTable
ALTER TABLE "public"."BreathSession" ALTER COLUMN "deviceId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Device" ADD COLUMN     "updateInterval" INTEGER DEFAULT 30;

-- AlterTable
ALTER TABLE "public"."Report" ALTER COLUMN "deviceId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BreathSession" ADD CONSTRAINT "BreathSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
