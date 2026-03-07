# EcoMentor: AI-Driven Environmental Education & Gamification Platform

## 🌍 Project Overview
**EcoMentor** is an innovative digital ecosystem designed to bridge the gap between environmental education and real-world sustainability actions. By leveraging Artificial Intelligence (Generative AI) and gamification principles, the platform transforms abstract climate concepts into engaging, actionable, and measurable experiences for students and educators.

---

## 🚀 Thesis Statement
The current educational landscape lacks an integrated tool that not only educates students about environmental issues but also incentivizes and verifies real-world impact. **EcoMentor** addresses this by providing a personalized learning experience driven by AI, a robust verification system for teachers, and a scientific impact estimation engine that translates student actions into tangible environmental metrics.

---

## 🛠️ Technical Architecture

### 1. Frontend: Next.js + Tailwind CSS
- **Framework**: Built with React/Next.js for a high-performance, responsive user experience.
- **UI/UX**: Features a premium, dark-themed interface with glassmorphic elements and micro-animations to engage a younger demographic.
- **State Management**: Utilizes React Hooks and Context API for seamless dashboard navigation.

### 2. Backend: Supabase (PostgreSQL + Real-time)
- **Database**: PostgreSQL serves as the primary data store for student profiles, learning progress, and impact metrics.
- **Authentication**: Built-in Supabase Auth for secure login and role-based access (Student vs. Teacher).
- **Real-time Engine**: Materialized views and database triggers automate the global leaderboard and notification systems.

### 3. Intelligence Layer: Google Gemini AI
- **Generative Quizzes**: Dynamically creates educational assessments tailored to specific topics and difficulty levels.
- **AI Lesson Planner**: Assists teachers in generating comprehensive, objective-driven educational content.
- **Natural Language Processing**: Powers **EcoBot**, an AI assistant providing 24/7 guidance to students.

---

## 🎯 Key Features

### 🎓 For Students (The Learners)
- **AI Learning Paths**: Personalized modules that adapt to the user's education level (School/College).
- **Eco-Points & Gamification**: A points-based reward system with global and classroom leaderboards.
- **Real-world Impact Tracking**: Scientific conversion of actions (e.g., recycling, saving water) into CO2 saved, trees planted, and plastic reduced.
- **Educational Games Hub**: Interactive waste-sorting simulations and carbon footprint calculators.

### 👩‍🏫 For Teachers (The Mentors)
- **AI-Powered Tools**: Automatic generation of lesson plans and assessment rubrics.
- **Verification Portal**: A dedicated queue for reviewing student submissions, awarding points, and providing feedback.
- **Classroom Analytics**: Real-time monitoring of student engagement and cumulative environmental impact.

---

## 📊 Impact Estimation Model
The platform uses a specialized scientific model to estimate environmental impact:
- **CO2 Reduction**: Calculated based on energy-saving tasks and waste management.
- **Tree Equivalency**: 1 Tree = ~21kg of CO2 absorbed per year.
- **Resource Recovery**: Tracking of plastic reduction (kg) and water conservation (liters).

---

## 📂 Project Structure
```text
Ecomentor/
├── Frontend/           # Next.js Application
│   ├── src/app/        # Core Dashboard Logic (Student & Teacher)
│   ├── src/api/        # AI Integration & Points Engine
│   └── src/lib/        # Supabase Client & Utilities
├── database/           # SQL Schemas (Impact, Teacher, Progress)
└── README.md           # Project Thesis & Overview
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account & Project
- Google Gemini API Key

### Installation
1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/ecomentor.git
   cd ecomentor/Frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `Frontend` directory with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   GEMINI_API_KEY=your_api_key
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

---

## 📜 Acknowledgments
This project was developed as a comprehensive thesis project focusing on the intersection of **AI in Education** and **Sustainability Gamification**.
