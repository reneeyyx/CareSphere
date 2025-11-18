import React from 'react'
import PatientRiskDashboard from './components/PatientRiskDashboard/PatientRiskDashboard'
import './App.css'

function App() {
  return (
    <div className="App">
      <nav className="app-navbar">
        <h1 className="navbar-title">
          CareSphere
          <span className="navbar-subtitle">Patient Delirium Risk Monitoring</span>
        </h1>
      </nav>
      <main className="app-main">
        <PatientRiskDashboard />
      </main>
    </div>
  )
}

export default App
