# ROVOCS Web App – Database Schema
Tech: **Next.js 14**, **Prisma 5.14**, **PostgreSQL**, **shadcn/ui**, **Framer Motion**

## Overview
The schema stores sensor readings streamed from an **ESP32** and supports:
- User authentication
- Device pairing
- Real-time breath analysis
- Report generation

## Models

### User
```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  devices       Device[]
  reports       Report[]
}


model Device {
  id          String   @id @default(cuid())
  name        String
  serial      String   @unique
  user        User?    @relation(fields: [userId], references: [id])
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  readings    Reading[]
}


model Reading {
  id          String   @id @default(cuid())
  device      Device   @relation(fields: [deviceId], references: [id])
  deviceId    String
  tvoc        Float    // ppb
  eco2        Float    // ppm
  temperature Float    // °C
  humidity    Float    // %
  statusMsg   String?  // e.g. "Data received"
  recordedAt  DateTime @default(now())
}


model Report {
  id         String   @id @default(cuid())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  device     Device   @relation(fields: [deviceId], references: [id])
  deviceId   String
  from       DateTime
  to         DateTime
  fileUrl    String   // Storage path (S3/Cloud)
  createdAt  DateTime @default(now())
}


Relationships

User 1-n Device
Device 1-n Reading
User 1-n Report
Device 1-n Report

Notes
- Add indexing on Reading.deviceId and Reading.recordedAt for fast time-series queries.
- Use pgvector or TimescaleDB extension if high-volume streaming is expected.