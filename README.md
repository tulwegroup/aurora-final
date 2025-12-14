# Aurora OSI v3

This is the repository for the Aurora OSI v3, a planetary-scale subsurface intelligence platform. The project is a modern web application with a React frontend and a Python (FastAPI) backend.

## Project Structure

- **`/` (Root)**: Contains the Vite-based React frontend application.
- **`/backend`**: Contains the Dockerized Python backend, which includes:
  - A FastAPI web server (`main.py`).
  - A background job processor (`worker.py`).
  - A `Dockerfile` for containerization.

## Local Development

### Prerequisites

- Node.js (v18+) and npm
- Python (v3.9+) and pip
- Docker

### 1. Frontend Setup

From the project root directory:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 2. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# Install Python dependencies
pip install -r requirements.txt

# Create a 'jobs' directory for the worker
mkdir -p jobs/artifacts

# Run the API server
uvicorn main:app --reload
```

In a **separate terminal**, navigate to `backend` and run the worker:

```bash
cd backend
source venv/bin/activate
python worker.py
```

The backend API will be available at `http://localhost:8000`. The frontend is pre-configured to connect to this address for local development.

## Deployment to Render

This project is configured for a multi-service deployment on Render from a single Git repository.

1.  **Create a Persistent Disk:**
    - Name: `aurora-jobs-disk`
    - Mount Path: `/data/jobs`

2.  **Deploy the API (Web Service):**
    - Environment: `Docker`
    - Root Directory: `backend`
    - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
    - Add the Persistent Disk created in step 1.

3.  **Deploy the Worker (Background Worker):**
    - Environment: `Docker`
    - Root Directory: `backend`
    - Start Command: `python worker.py`
    - Add the *same* Persistent Disk.

4.  **Deploy the Frontend (Static Site):**
    - Root Directory: (leave blank)
    - Build Command: `npm install && npm run build`
    - Publish Directory: `dist`
    - **Environment Variable:**
      - Key: `VITE_API_URL`
      - Value: The URL of your Render Web Service (e.g., `https://aurora-api.onrender.com`)
