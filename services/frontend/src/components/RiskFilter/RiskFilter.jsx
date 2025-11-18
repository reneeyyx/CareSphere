import React, { useState } from 'react'
import './RiskFilter.css'

function RiskFilter({ selectedRisk, onRiskChange, riskCounts }) {
  const [isOpen, setIsOpen] = useState(false)

  const filters = [
    { value: 'all', label: 'All Patients', count: riskCounts.total, color: '#6b7280' },
    { value: 'high', label: 'High Risk', count: riskCounts.high, color: '#ef4444' },
    { value: 'medium', label: 'Medium Risk', count: riskCounts.medium, color: '#f59e0b' },
    { value: 'low', label: 'Low Risk', count: riskCounts.low, color: '#10b981' },
    { value: 'overdue', label: 'Check Overdue', count: riskCounts.overdue, color: '#dc2626' },
    { value: 'due-soon', label: 'Check Due Soon', count: riskCounts.dueSoon, color: '#f59e0b' }
  ]

  const currentFilter = filters.find(f => f.value === selectedRisk)

  const handleFilterSelect = (value) => {
    onRiskChange(value)
    setIsOpen(false)
  }

  return (
    <div className="risk-filter">
      <button 
        className="filter-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="filter-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 5.83333H17.5M5.83333 10H14.1667M8.33333 14.1667H11.6667" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="filter-label">Filter: {currentFilter.label}</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
          className={`filter-arrow ${isOpen ? 'open' : ''}`}
        >
          <path 
            d="M4 6L8 10L12 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="filter-dropdown">
          {filters.map(filter => (
            <button
              key={filter.value}
              className={`filter-option ${selectedRisk === filter.value ? 'active' : ''}`}
              onClick={() => handleFilterSelect(filter.value)}
            >
              <div className="filter-option-content">
                <span 
                  className="filter-color-dot"
                  style={{ backgroundColor: filter.color }}
                />
                <span className="filter-option-label">{filter.label}</span>
              </div>
              <span 
                className="filter-option-count"
                style={{ backgroundColor: filter.color }}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default RiskFilter
