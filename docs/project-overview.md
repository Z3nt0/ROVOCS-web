# ROVOCS Project Overview

## Project Name
**ROVOCS** – *Arduino-Based Breath Analyzer for VOC Detection with Web-Based Result Visualization*

## Mission
Design, implement, and evaluate a **cost-effective, portable, and user-friendly** respiratory health monitoring system.  
The platform collects exhaled-breath data through sensors connected to an **ESP32**, then visualizes results in real time on a **Next.js + Prisma + PostgreSQL** web app.

---

## General Objective
Create a system that:
- **Detects** volatile organic compounds (VOCs) and equivalent CO₂ (eCO₂) from human breath.
- **Displays** the measurements on a responsive, real-time web dashboard.
- **Evaluates** lung performance across different respiratory conditions.

---

## Specific Objectives
1. **Sensor Capability**  
   Determine the capability of **MQ-135** and **SGP30** sensors in detecting VOCs and eCO₂ levels in exhaled breath.

2. **Measurement Accuracy**  
   Assess the accuracy of the system in measuring:
   - Total VOC (TVOC)
   - Equivalent CO₂ (eCO₂)
   - Ambient temperature
   - Relative humidity

3. **Condition Analysis**  
   Analyze the variation in VOC and eCO₂ readings across:
   - Normal lung function
   - Mild respiratory distress
   - Chronic respiratory illness

4. **Environmental Correction**  
   Evaluate the effectiveness of the **BME280** sensor in correcting gas readings based on ambient temperature and humidity.


6. **Web Visualization**  
   Determine the capability of the **web-based visualization platform** in displaying sensor data in real time with clarity, responsiveness, and accessibility.

---

## System Components
- **Hardware**: ESP32 microcontroller, MQ-135, SGP30, BME280.
- **Backend**: Next.js, Prisma, PostgreSQL database.
- **Frontend**: read frontend.md
- **Connectivity**: Wi-Fi via ESP32 sending JSON packets to the web app.

---

## Key Deliverables
- 📊 **Real-Time Dashboard**: Graphs & tables for TVOC, eCO₂, temperature, and humidity.
- 📥 **Reports**: Downloadable CSV/PDF summaries of test sessions.
- 🔑 **User Accounts**: Secure login/signup with device pairing.
- 📱 **Responsive UI**: Optimized for desktop and mobile.

---

## Expected Outcome
A fully integrated system where:
- **Users blow** into the sensor device.
- **ESP32 streams** live measurements to the server.
- **Web app visualizes** the data with instant feedback.
- **Reports** can be exported for medical or personal tracking.

---

## Notes for Cursor AI
- Treat this document as the **source of truth** for project context.
- Use it to guide:
  - Code generation
  - File organization
  - Database schema decisions
  - Testing & documentation
- All features must support **real-time data**, **mobile responsiveness**, and **scalability** for future sensor additions.
