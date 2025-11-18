import React, { useState, useEffect } from 'react'
import PatientRankBar from '../PatientRankBar/PatientRankBar'
import RiskFilter from '../RiskFilter/RiskFilter'
import patientsData from '../../data/patients.json'
import './PatientRiskDashboard.css'

function PatientRiskDashboard() {
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [selectedRisk, setSelectedRisk] = useState('all')
  const [sortBy, setSortBy] = useState('risk') // 'risk', 'name', 'room'
  const [expandedPatient, setExpandedPatient] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    // Fetch patients from API
    fetch('http://localhost:3001/api/patients')
      .then(response => response.json())
      .then(data => {
        setPatients(data)
        setFilteredPatients(data)
      })
      .catch(error => {
        console.error('Error fetching patients:', error)
        // Fallback to local data if API fails
        setPatients(patientsData.patients)
        setFilteredPatients(patientsData.patients)
      })
  }, [])

  useEffect(() => {
    let filtered = [...patients]
    
    // Filter by risk level
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(p => p.riskLevel === selectedRisk)
    }

    // Sort patients
    filtered.sort((a, b) => {
      if (sortBy === 'risk') {
        const riskOrder = { high: 0, medium: 1, low: 2 }
        const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
        // If same risk level, sort by score descending
        if (riskDiff === 0) {
          return b.riskScore - a.riskScore
        }
        return riskDiff
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'room') {
        return a.room.localeCompare(b.room)
      }
      return 0
    })

    setFilteredPatients(filtered)
  }, [patients, selectedRisk, sortBy])

  const riskCounts = {
    high: patients.filter(p => p.riskLevel === 'high').length,
    medium: patients.filter(p => p.riskLevel === 'medium').length,
    low: patients.filter(p => p.riskLevel === 'low').length,
    total: patients.length
  }

  const togglePatient = (patientId) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId)
  }

  const handleCheckIn = async (patientId) => {
    try {
      // Call API to check in patient
      const response = await fetch(`http://localhost:3001/api/patients/${patientId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to check in patient')
      }
      
      const updatedPatient = await response.json()
      
      // Update local state
      setPatients(prevPatients => 
        prevPatients.map(p => p.id === patientId ? updatedPatient : p)
      )
    } catch (error) {
      console.error('Error checking in patient:', error)
      alert('Failed to check in patient. Please try again.')
    }
  }

  // Pagination calculations
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredPatients.length / pageSize)
  const startIndex = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize
  const endIndex = pageSize === 'all' ? filteredPatients.length : startIndex + pageSize
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedRisk, sortBy, pageSize])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setExpandedPatient(null) // Collapse any expanded patient when changing pages
  }

  const handlePageSizeChange = (e) => {
    const value = e.target.value
    setPageSize(value === 'all' ? 'all' : parseInt(value))
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="patient-risk-dashboard">
      <div className="dashboard-controls">
        <RiskFilter 
          selectedRisk={selectedRisk}
          onRiskChange={setSelectedRisk}
          riskCounts={riskCounts}
        />
        
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="risk">Risk Level</option>
            <option value="name">Patient Name</option>
            <option value="room">Room Number</option>
          </select>
        </div>
      </div>

      <div className="patient-count">
        Showing {filteredPatients.length} of {patients.length} patients
      </div>

      <div className="patient-ranking-list">
        {paginatedPatients.map((patient, index) => (
          <PatientRankBar
            key={patient.id}
            patient={patient}
            rank={startIndex + index + 1}
            isExpanded={expandedPatient === patient.id}
            onToggle={() => togglePatient(patient.id)}
            onCheckIn={handleCheckIn}
          />
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="no-patients">
          <p>No patients found matching the selected criteria.</p>
        </div>
      )}

      {filteredPatients.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} patients</span>
            <div className="page-size-selector">
              <label htmlFor="page-size">Per page:</label>
              <select 
                id="page-size"
                value={pageSize} 
                onChange={handlePageSizeChange}
                className="page-size-select"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {pageSize !== 'all' && totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="page-btn page-arrow"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </button>

              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>
                ) : (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                className="page-btn page-arrow"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PatientRiskDashboard
