# 🚀 Patient Portal 

> This is a real app that is being used right now (Somewhere in the Digital World!)

## 📸 Project Showcase

<div align="center">
  <img src="docs/showcase/showcase1.png" alt="Patient Portal Screenshot 1" />
  <p><em>Sign In View</em></p>
  
  <img src="docs/showcase/showcase2.png" alt="Patient Portal Screenshot 2" />
  <p><em>Main Dashboard with Real-time Updates View</em></p>
  
  <img src="docs/showcase/showcase3.png" alt="Patient Portal Screenshot 3" />
  <p><em>History of All The Requests</em></p>
</div>

## 🎭 Welcome!

This is a full-stack application showcasing modern web development practices! This project implements CRUD operations (Create, Read, Update, Delete) with role-based access control and real-time updates through WebSocket connections. It's perfect for learning or extending into your own healthcare management system.

## ✨ Key Features

- **Role-Based Access Control**: Three-tier permission system
- **Real-time Updates**: WebSocket integration for live data
- **Modern Architecture**: REST API + WebSocket hybrid approach
- **Comprehensive Testing**: Full test coverage for backend operations
- **Production-Ready**: Currently serving patients in production

## 🛠️ Tech  

### Frontend (The Pretty Part)
- React 18 (Because 17 wasn't enough)
- Vite 
- and some other uninteresting libraries 

### Backend 
> This is the brain part of our project!
- FastAPI for high-performance async operations
- SQLAlchemy
- PostgreSQL or any other SQL database (I used SQLite at the beginning but changed it later after I did a performance test :) )
- and some other INTERESTING libraries (Obviously, I am not a backend guy :) )

## 🎮 Getting Started

### Prerequisites (Things You Need)

- Node.js (v18 or later) 
- Python (v3.8 or later) - No, Python 2 isn't retro, it's just old
- Coffee obviously ☕ 

### Installation (The Fun Part!)

1. **Clone the repo**
   ```bash
   git clone https://github.com/MohammedAlanizy/PatientPortal.git
   cd PatientPortal
   ```

2. **Frontend Setup (Where the boring stuff begins)**
    > Why did you make an additional folder inside frontend? To make your life hard 
   ```bash
   cd frontend/patientportal
   npm install  # Where your disk space will disappear :)
   touch .env.development # Windows: 
   touch .env.production # Windows: 
   ```

3. **Backend Setup (This is really the fun part!!)**
   ```bash
   cd backend/patientportal
   touch .env # Windows: 
   python -m venv venv  # Create your virtual environment
   source venv/bin/activate  # On the boring operating system (NOT Windows) use: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-test.txt  
   ```

## 🏃‍♂️ Environment Variables 
###  Frontend
```bash
VITE_PUBLIC_WS_URL=ws://127.0.0.1:8000/api/v1 # This is the WebSocket URL of your backend 
VITE_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1 # This is the endpoint URL of your backend
VITE_AUTHOR_NAME=MyName
VITE_AUTHOR_EMAIL=MyEmail@example.com
VITE_LOGO_1=https://sample.image/test.png # The first logo on the left
VITE_LOGO_2=https://sample.image/test.png # The second logo on the right
```

### Backend
```bash
PROJECT_NAME=Awesome Project
VERSION=1.0.0
API_V1_STR=/api/v1
SECRET_KEY=SUPER-SECRET
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
POSTGRES_HOST=localhost # probably you know what this is 
POSTGRES_PORT=5433 # The port of postgres
POSTGRES_USER=postgres # Your database username
POSTGRES_PASSWORD=MY-SUPER-SECRET-PASSWORD # Your database password
POSTGRES_DB=my_database # Your database name
ADMIN_USERNAME=admin # This is the default username for the web as we don't have public sign-up!
ADMIN_PASSWORD=admin # This is the default password for the web as we don't have public sign-up!
# DATABASE_URL=postgresql+asyncpg://postgres:MY-SUPER-SECRET-PASSWORD@localhost:5433/my_database # This is optional which will be created for you if you provide the host, port, user, password, database name. 
```


## 🏃‍♂️ Development 
> Don't forget the env files!
### Running the Frontend
```bash
cd frontend/patientportal
npm run dev  
```

### Running the Backend
```bash
cd backend/patientportal
uvicorn app.main:app --reload  
```

Your app will now be running on these ports (Hopefully)
- Frontend: `http://localhost:5173` 
- Backend: `http://localhost:8000` 
- API Docs: `http://localhost:8000/docs` 

## 🗄️ Project Structure 

```
PatientPortal/
├── backend/                # FastAPI application
│   └── patientportal/
│       ├── app/
│       │   ├── api/       # API endpoints
│       │   ├── core/      # Core utilities
│       │   ├── crud/      # Database operations
│       │   ├── models/    # Database models
│       │   └── schemas/   # Pydantic schemas
│       └── tests/         # Test cases
│
└── frontend/              # React application
    └── patientportal/
        ├── src/
        │   ├── components/
        │   ├── contexts/
        │   ├── hooks/
        │   └── pages/
        └── public/
```

## 🧪 Testing (Because This is a Professional App)

### Frontend Tests
```bash
NOTHING to test as I am not a big fan of frontend
```

### Backend Tests
```bash
cd backend/patientportal
pytest -v ./tests/unit_tests  # All hopes to be green ;) 
```

<div align="center">
  <h1>Happy coding! 🎮</h1>
</div>
