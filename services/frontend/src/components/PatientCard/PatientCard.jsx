import React from 'react'
import './PatientCard.css'

function PatientCard({ patient }) {
  const getRiskColor = (level) => {
    switch(level) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return '#f59e0b'
      case 'low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const getRiskLabel = (level) => {
    return level.charAt(0).toUpperCase() + level.slice(1)
  }

  return (
    <div className="patient-card" style={{ borderLeftColor: getRiskColor(patient.riskLevel) }}>
      <div className="patient-header">
        <div className="patient-info">
          <h3 className="patient-name">{patient.name}</h3>
          <p className="patient-id">ID: {patient.id}</p>
        </div>
        <div 
          className={`risk-badge risk-${patient.riskLevel}`}
          style={{ backgroundColor: getRiskColor(patient.riskLevel) }}
        >
          {getRiskLabel(patient.riskLevel)} Risk
        </div>
      </div>

      <div className="patient-details">
        <div className="detail-row">
          <span className="detail-label">Room:</span>
          <span className="detail-value">{patient.room}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Age:</span>
          <span className="detail-value">{patient.age} years</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Admission:</span>
          <span className="detail-value">{patient.admissionDate}</span>
        </div>
      </div>

      <div className="risk-factors">
        <h4 className="risk-factors-title">Risk Factors:</h4>
        <ul className="risk-factors-list">
          {patient.riskFactors.map((factor, index) => (
            <li key={index}>{factor}</li>
          ))}
        </ul>
      </div>

      <div className="patient-vitals">
        <div className="vital">
          <span className="vital-label">Risk Score</span>
          <span className="vital-value">{patient.riskScore}/100</span>
        </div>
        <div className="vital">
          <span className="vital-label">Last Check</span>
          <span className="vital-value">{patient.lastCheck}</span>
        </div>
      </div>
    </div>
  )
}

export default PatientCard
