import React, { useState, useEffect } from 'react'
import './PatientRankBar.css'

function PatientRankBar({ patient, rank, isExpanded, onToggle, onCheckIn }) {
  const [sensorData, setSensorData] = useState(null)

  // Fetch sensor data for live monitored patients
  useEffect(() => {
    if (patient.isLiveMonitored && isExpanded) {
      const fetchSensorData = async () => {
        try {
          const response = await fetch('http://localhost:4002/api/sensors/latest')
          if (response.ok) {
            const data = await response.json()
            setSensorData(data)
          }
        } catch (error) {
          console.log('Sensor data unavailable')
        }
      }
      
      fetchSensorData()
      const interval = setInterval(fetchSensorData, 3000) // Update every 3 seconds
      return () => clearInterval(interval)
    }
  }, [patient.isLiveMonitored, isExpanded])

  // Check if environmental factors exceed safe thresholds
  const getEnvironmentalStatus = (type, value) => {
    const thresholds = {
      light: { min: 100, max: 500, unit: 'lux', optimal: '100-500' },
      sound: { min: 0, max: 60, unit: 'dB', optimal: '<60' },
      temperature: { min: 20, max: 24, unit: '°C', optimal: '20-24' }
    }

    const threshold = thresholds[type]
    if (!threshold || value === null || value === undefined) {
      return { status: 'normal', warning: false, message: '' }
    }

    if (type === 'light') {
      if (value < threshold.min) {
        return { status: 'warning', warning: true, message: '⚠️ Too Dark', color: '#f59e0b' }
      } else if (value > threshold.max) {
        return { status: 'danger', warning: true, message: '🚨 Too Bright', color: '#ef4444' }
      }
    } else if (type === 'sound') {
      if (value > threshold.max) {
        return { status: 'danger', warning: true, message: '🚨 Too Loud', color: '#ef4444' }
      } else if (value > threshold.max * 0.8) {
        return { status: 'warning', warning: true, message: '⚠️ Moderately Loud', color: '#f59e0b' }
      }
    } else if (type === 'temperature') {
      if (value < threshold.min) {
        return { status: 'warning', warning: true, message: '⚠️ Too Cold', color: '#f59e0b' }
      } else if (value > threshold.max) {
        return { status: 'danger', warning: true, message: '🚨 Too Hot', color: '#ef4444' }
      }
    }

    return { status: 'normal', warning: false, message: '✓ Optimal', color: '#10b981' }
  }

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

  const getCheckInStatus = () => {
    if (!patient.lastCheck) return { status: 'overdue', message: 'Check needed', color: '#ef4444' }
    
    // Parse the last check time
    const lastCheckStr = patient.lastCheck
    let lastCheckDate
    
    try {
      // Try to parse the date string
      lastCheckDate = new Date(lastCheckStr)
      
      // If invalid date, try to extract just the date part
      if (isNaN(lastCheckDate.getTime())) {
        // For formats like "Nov 17, 2025 at 2:30 PM"
        const match = lastCheckStr.match(/(\w+ \d+, \d+) at (\d+:\d+ [AP]M)/)
        if (match) {
          lastCheckDate = new Date(`${match[1]} ${match[2]}`)
        }
      }
    } catch (e) {
      return { status: 'unknown', message: 'Check needed', color: '#6b7280' }
    }

    if (isNaN(lastCheckDate.getTime())) {
      return { status: 'unknown', message: 'Check needed', color: '#6b7280' }
    }

    const now = new Date()
    const hoursSinceCheck = (now - lastCheckDate) / (1000 * 60 * 60)
    
    // Determine check interval based on risk level
    const checkInterval = patient.riskLevel === 'high' ? 2 : 
                         patient.riskLevel === 'medium' ? 4 : 8
    
    const hoursRemaining = checkInterval - hoursSinceCheck
    
    if (hoursRemaining <= 0) {
      return { status: 'overdue', message: '⚠️ Check Overdue', color: '#ef4444' }
    } else if (hoursRemaining <= 0.5) {
      return { status: 'due-soon', message: '⏰ Check Due Soon', color: '#f59e0b' }
    } else {
      const hours = Math.floor(hoursRemaining)
      const minutes = Math.round((hoursRemaining - hours) * 60)
      return { 
        status: 'on-track', 
        message: `Next check in ${hours}h ${minutes}m`, 
        color: '#10b981' 
      }
    }
  }

  const checkInStatus = getCheckInStatus()

  return (
    <div className="patient-rank-bar">
      <div 
        className="rank-bar-header"
        onClick={onToggle}
        style={{ borderLeftColor: getRiskColor(patient.riskLevel) }}
      >
        <div className="rank-number">
          {rank}
        </div>
        
        <div className="patient-summary">
          <div className="patient-main-info">
            <h3 className="patient-name">
              {patient.name}
              {patient.isLiveMonitored && (
                <span className="live-badge" title="Live monitoring via Arduino sensors">
                  🔴 LIVE
                </span>
              )}
            </h3>
            <span className="patient-room">Room {patient.room}</span>
            {checkInStatus.status !== 'on-track' && (
              <span 
                className={`check-alert check-alert-${checkInStatus.status}`}
                style={{ backgroundColor: checkInStatus.color }}
              >
                {checkInStatus.message}
              </span>
            )}
          </div>
          
          <div className="risk-bar-container">
            <div 
              className="risk-bar-fill"
              style={{ 
                width: `${patient.riskScore}%`,
                backgroundColor: getRiskColor(patient.riskLevel)
              }}
            >
              <span className="risk-score-label">{patient.riskScore}</span>
            </div>
          </div>
        </div>

        <div className="rank-header-right">
          <div 
            className={`risk-badge risk-${patient.riskLevel}`}
            style={{ backgroundColor: getRiskColor(patient.riskLevel) }}
          >
            {getRiskLabel(patient.riskLevel)}
          </div>
          
          <button className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none"
              className="expand-icon"
            >
              <path 
                d="M5 7.5L10 12.5L15 7.5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="rank-bar-details">
          <div className="details-grid">
            <div className="detail-section">
              <h4 className="section-title">Patient Information</h4>
              <div className="detail-rows">
                <div className="detail-item">
                  <span className="detail-label">Patient ID:</span>
                  <span className="detail-value">{patient.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Age:</span>
                  <span className="detail-value">{patient.age} years</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Room:</span>
                  <span className="detail-value">{patient.room}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Admission Date:</span>
                  <span className="detail-value">{patient.admissionDate}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Risk Assessment</h4>
              <div className="detail-rows">
                <div className="detail-item">
                  <span className="detail-label">Risk Level:</span>
                  <span className="detail-value">
                    <span 
                      className="inline-risk-badge"
                      style={{ backgroundColor: getRiskColor(patient.riskLevel) }}
                    >
                      {getRiskLabel(patient.riskLevel)} Risk
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Risk Score:</span>
                  <span className="detail-value score-highlight">{patient.riskScore}/100</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Assessment:</span>
                  <span className="detail-value">{patient.lastCheck}</span>
                </div>
              </div>
            </div>

            {patient.isLiveMonitored && sensorData && (
              <div className="detail-section full-width">
                <h4 className="section-title">🌡️ Environmental Factors (Live)</h4>
                <div className="environmental-factors-grid">
                  <div className="env-factor-card" style={{ 
                    borderLeft: getEnvironmentalStatus('light', sensorData.light).warning ? 
                      `4px solid ${getEnvironmentalStatus('light', sensorData.light).color}` : 'none'
                  }}>
                    <div className="env-icon">💡</div>
                    <div className="env-content">
                      <span className="env-label">Light Level</span>
                      <span className="env-value">{sensorData.light}</span>
                      <span className="env-unit">lux</span>
                      <span className="env-status" style={{ 
                        color: getEnvironmentalStatus('light', sensorData.light).color 
                      }}>
                        {getEnvironmentalStatus('light', sensorData.light).message}
                      </span>
                    </div>
                  </div>
                  <div className="env-factor-card" style={{ 
                    borderLeft: getEnvironmentalStatus('sound', sensorData.sound).warning ? 
                      `4px solid ${getEnvironmentalStatus('sound', sensorData.sound).color}` : 'none'
                  }}>
                    <div className="env-icon">🔊</div>
                    <div className="env-content">
                      <span className="env-label">Sound Level</span>
                      <span className="env-value">{sensorData.sound}</span>
                      <span className="env-unit">dB</span>
                      <span className="env-status" style={{ 
                        color: getEnvironmentalStatus('sound', sensorData.sound).color 
                      }}>
                        {getEnvironmentalStatus('sound', sensorData.sound).message}
                      </span>
                    </div>
                  </div>
                  <div className="env-factor-card" style={{ 
                    borderLeft: getEnvironmentalStatus('temperature', sensorData.temperature).warning ? 
                      `4px solid ${getEnvironmentalStatus('temperature', sensorData.temperature).color}` : 'none'
                  }}>
                    <div className="env-icon">🌡️</div>
                    <div className="env-content">
                      <span className="env-label">Temperature</span>
                      <span className="env-value">{sensorData.temperature?.toFixed(1)}</span>
                      <span className="env-unit">°C</span>
                      <span className="env-status" style={{ 
                        color: getEnvironmentalStatus('temperature', sensorData.temperature).color 
                      }}>
                        {getEnvironmentalStatus('temperature', sensorData.temperature).message}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="detail-section full-width">
              <h4 className="section-title">Risk Factors</h4>
              <div className="risk-factors-grid">
                {patient.riskFactors.map((factor, index) => (
                  <div key={index} className="risk-factor-chip">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M8 5V9M8 11V11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="details-footer">
            <div className="footer-stats">
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <span className="stat-label">Monitoring Priority:</span>
                <span className="stat-value">
                  {patient.riskLevel === 'high' ? 'Critical' : 
                   patient.riskLevel === 'medium' ? 'Standard' : 'Routine'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🕐</span>
                <span className="stat-label">Next Check:</span>
                <span className="stat-value">
                  {patient.riskLevel === 'high' ? 'Every 2 hours' : 
                   patient.riskLevel === 'medium' ? 'Every 4 hours' : 'Every 8 hours'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientRankBar
