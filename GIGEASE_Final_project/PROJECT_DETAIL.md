# 🛡️ GigEase: Next-Gen Parametric Income Protection

> **Empowering the Backbone of the Digital Economy through Real-Time ML and Automated Insurance.**

GigEase is a sophisticated, full-stack parametric insurance platform designed specifically for food delivery partners and gig workers. Built for the **Guidewire DEVTrails 2026**, it solves the critical problem of income volatility by providing automated, transparent, and instant financial protection against urban and environmental disruptions.

---

## 🚩 The Problem
Gig workers (Zomato, Swiggy, Uber, etc.) are highly vulnerable to external factors. A heavy storm, a sudden riot, or extreme traffic congestion can prevent them from working, leading to immediate income loss. Traditional insurance is too slow, too expensive, and too bureaucratic for this workforce.

## 🚀 The GigEase Solution
GigEase replaces traditional claims with **Parametric Triggers**. 
- **No Manual Claims**: If our sensors and models detect a disruption and your income drops, we trigger a payout automatically.
- **Dynamic Pricing**: Premiums adjust in real-time based on live risk data (weather, news, congestion).
- **AI Transparency**: Using RAG (Retrieval-Augmented Generation), every decision is explained to the worker in plain language.

---

## 🧠 Technical Architecture

### 1. The Unified 3-Model ML Pipeline
GigEase features a custom-built ML Orchestrator that manages three distinct machine learning layers:

| Model | Technique | Purpose |
| :--- | :--- | :--- |
| **Risk Prediction** | XGBoost + Prophet Ensemble | Forecasts zone-level risk scores based on historic weather patterns and live alerts (STFI). |
| **Income Prediction** | Tiered LightGBM | Benchmarks "Expected Income" for each worker based on their history and current platform demand. |
| **Fraud Detection** | Isolation Forest + L1 Rules | A 4-layer pipeline (Rules, Anomaly Detection, Network Analysis, Clustering) to block spoofing and manual exploitation. |

### 2. Explainable AI (XAI)
- **RAG Narrative**: Integrates **LangChain** and **ChromaDB** to generate natural language explanations for "Why did my premium increase?" or "Why was my claim approved?".
- **SHAP Importance**: Provides visual feature importance (e.g., "Rainfall was the 40% driver for this payout").

### 3. Real-Time Reality Engine
The platform ingests live data from:
- **Weather**: Real-time rainfall and storm severity.
- **News**: GDELT-based sentiment and event tracking for RSMD (Riot/Strike/Malicious Damage) confirmed events.
- **Maps**: Real-time traffic congestion indices.

---

## 🛠️ Key Features

### 👨‍💻 Worker Experience
- **Interactive Dashboard**: Premium dark-themed UI showing real-time earnings vs. safety floor.
- **Premium Toggle**: Seamlessly switch between "Base Protection" and "Monsoon Guard".
- **WhatsApp OTP**: Secure, mobile-first authentication tailored for workers on the move.
- **Interactive Timeline**: A historical simulation of past claims and premium payments with instant-load caching.

### 👩‍💼 Admin Intelligence
- **Fraud Heatmap**: Interactive Mapbox visualization of high-risk and anomalous activity zones.
- **Audit History**: Deep-dive into every ML prediction, including raw features and SHAP values.
- **Policy Management**: Centralised control for setting base rates and disruption thresholds.

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Framer Motion.
- **Backend**: FastAPI (Python 3.10+), Uvicorn.
- **Database**: PostgreSQL (Store) / SQLite (Prototype fallback).
- **Machine Learning**: 
  - **Frameworks**: Scikit-Learn, XGBoost, LightGBM, TensorFlow.
  - **Explainability**: SHAP, LangChain, HuggingFace Embeddings.
- **Communication**: WhatsApp API (WATI) & Telegram Bot integration.

---

## 🏃‍♂️ Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡️ Future Roadmap
- **Guidewire PolicyCenter Integration**: Direct bridging as a parametric "Edge" system.
- **On-Device Telemetry**: Integration with smartphone sensors for localized pothole/vibration risk.
- **Multi-Platform Support**: Aggregating data across Zomato, Swiggy, and Dunzo for a unified earning profile.

---
*Built with ❤️ for Guidewire DEVTrails 2026.*
