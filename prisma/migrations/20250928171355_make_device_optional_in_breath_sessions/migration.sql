-- DropForeignKey
ALTER TABLE "public"."BreathSession" DROP CONSTRAINT "BreathSession_deviceId_fkey";

-- AlterTable
ALTER TABLE "public"."BreathSession" ALTER COLUMN "deviceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."BreathSession" ADD CONSTRAINT "BreathSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
