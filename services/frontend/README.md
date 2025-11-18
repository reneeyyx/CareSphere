# CareSphere Frontend

React-based patient delirium risk monitoring dashboard for the CareSphere healthcare platform.

## Features

- **Patient Risk Dashboard**: Visual ranking of patients by delirium risk level (High, Medium, Low)
- **Real-time Filtering**: Filter patients by risk level
- **Flexible Sorting**: Sort by risk level, patient name, or room number
- **Patient Cards**: Detailed view of patient information including:
  - Risk level and score
  - Room assignment
  - Age and admission date
  - Risk factors
  - Last check time
- **Responsive Design**: Mobile-friendly interface with smooth animations

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **CSS3** - Styling with modern gradients and animations
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Getting Started

### Prerequisites

- Node.js >= 16.x
- npm >= 8.x

### Installation

```powershell
# Navigate to frontend directory
cd services\frontend

# Install dependencies
npm install
```

### Development

```powershell
# Start dev server (runs on http://localhost:3000)
npm run dev
```

The app will automatically reload when you make changes to the source code.

### Build for Production

```powershell
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

The build output will be in the `dist/` directory.

### Linting and Formatting

```powershell
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Project Structure

```
services/frontend/
├── public/               # Static assets
├── src/
│   ├── components/
│   │   ├── PatientRiskDashboard/  # Main dashboard component
│   │   ├── PatientCard/           # Individual patient card
│   │   └── RiskFilter/            # Risk level filter controls
│   ├── data/
│   │   └── mockPatients.js        # Mock patient data
│   ├── App.jsx           # Root component
│   ├── main.jsx          # App entry point
│   ├── index.css         # Global styles
│   └── App.css           # App-level styles
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies and scripts
├── .eslintrc.cjs         # ESLint configuration
├── .prettierrc           # Prettier configuration
├── Dockerfile            # Docker build config
└── README.md             # This file
```

## Mock Data

The app currently uses mock patient data from `src/data/mockPatients.js`. To connect to a real backend:

1. Update the API endpoint in `vite.config.js` proxy settings
2. Replace mock data import in `PatientRiskDashboard.jsx` with API calls
3. Add environment variables for API URLs (e.g., `VITE_API_URL`)

Example API integration:

```javascript
// In PatientRiskDashboard.jsx
useEffect(() => {
  fetch('/api/patients')
    .then((res) => res.json())
    .then((data) => {
      setPatients(data)
      setFilteredPatients(data)
    })
}, [])
```

## Docker

### Build Docker Image

```powershell
docker build -t caresphere-frontend .
```

### Run Docker Container

```powershell
docker run -p 3000:80 caresphere-frontend
```

Access the app at http://localhost:3000

## Environment Variables

Create a `.env` file in the root directory for local development:

```
VITE_API_URL=http://localhost:3001
```

For production, set environment variables in your deployment platform.

## Patient Risk Levels

- **High Risk** (Score 75-100): Red indicator, requires immediate attention
- **Medium Risk** (Score 45-74): Orange indicator, regular monitoring
- **Low Risk** (Score 0-44): Green indicator, standard care

## Contributing

When making changes:

1. Run `npm run lint` to check for errors
2. Run `npm run format` to format code
3. Test locally with `npm run dev`
4. Build production version with `npm run build`

## Future Enhancements

- [ ] Real-time data updates via WebSocket
- [ ] Patient detail modal with full medical history
- [ ] Alert system for risk level changes
- [ ] Data visualization charts
- [ ] Export patient reports
- [ ] Multi-language support
- [ ] Dark mode toggle

## License

Part of the CareSphere healthcare monitoring platform.
