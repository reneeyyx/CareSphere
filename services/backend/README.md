# CareSphere Backend

Backend API for the CareSphere patient monitoring system.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### GET /api/patients

Get all patients

### GET /api/patients/:id

Get a specific patient by ID

### PUT /api/patients/:id

Update a patient's data

### POST /api/patients/:id/checkin

Record a check-in for a patient

### GET /api/health

Health check endpoint

## Data Storage

Patient data is stored in `data/patients.json`. This file is automatically created if it doesn't exist.
