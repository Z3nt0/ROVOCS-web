-- CreateTable
CREATE TABLE "public"."BreathSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "baselineTvoc" DOUBLE PRECISION,
    "baselineEco2" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreathSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BreathEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "peakTime" TIMESTAMP(3),
    "peakTvoc" DOUBLE PRECISION,
    "peakEco2" DOUBLE PRECISION,
    "baselineTvoc" DOUBLE PRECISION NOT NULL,
    "baselineEco2" DOUBLE PRECISION NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreathEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BreathMetrics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventId" TEXT,
    "metricType" TEXT NOT NULL,
    "baseline" DOUBLE PRECISION NOT NULL,
    "peak" DOUBLE PRECISION NOT NULL,
    "peakPercent" DOUBLE PRECISION NOT NULL,
    "timeToPeak" DOUBLE PRECISION,
    "slope" DOUBLE PRECISION,
    "recoveryTime" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreathMetrics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BreathSession" ADD CONSTRAINT "BreathSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BreathSession" ADD CONSTRAINT "BreathSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BreathEvent" ADD CONSTRAINT "BreathEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."BreathSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BreathMetrics" ADD CONSTRAINT "BreathMetrics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."BreathSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BreathMetrics" ADD CONSTRAINT "BreathMetrics_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."BreathEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
