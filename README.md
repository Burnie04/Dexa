🧠 Dexa
Dexa is a full-stack AI project that combines a Flask Backend and a React + Tailwind frontend seamless modernAI assistant experience. It's built to be simple enough for beginners to set up, yet scalable for real-world use cases.

✨ Features

⚡ Frontend (React + Tailwind)

Clean, responsive UI

Dark / Light mode toggle for accessibility

Interactive chat interface to talk to the AI

🛠 Backend (Flask)

REST API endpoints for AI processing

Modular structure (utils/ai_logic.py) for easy extension

CORS enabled for frontend–backend communication

🤖 AI Logic

Pluggable architecture (replace with OpenAI, Hugging Face, or custom ML models)

Currently supports a simple text response engine

🗂 Tech Stack

Frontend: React, TailwindCSS, JavaScript

Backend: Python, Flask, Flask-CORS

AI: Custom logic in Python (extendable with any AI API or model)

🚀 Getting Started
1️⃣ Clone the repo
git clone https://github.com/your-username/deccanai.git
cd deccanai

2️⃣ Setup Backend
cd backend
python -m venv venv
venv\Scripts\activate   # On Windows
pip install -r requirements.txt
python app.py

3️⃣ Setup Frontend
cd frontend
npm install
npm start

4️⃣ Open in browser

Frontend: http://localhost:3000

Backend: http://localhost:5000

📌 Future Improvements

🔑 User authentication

📊 Personalized dashboard with history & analytics

🌐 Deployment (Docker / Vercel / AWS)
