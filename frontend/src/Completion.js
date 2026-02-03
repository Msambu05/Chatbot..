import React, { useState, useEffect } from 'react'

function Completion() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const sessionStorage = JSON.parse(localStorage.getItem('session') || '{}')
  const token = sessionStorage.token
  const user = sessionStorage.user

  useEffect(() => {
    const fetchReport = async () => {
      if (!user || user.role !== 'stakeholder') {
        window.location.href = '/'
        return
      }

      try {
        // Get completed session
        const sessRes = await fetch('http://localhost:8000/api/users/me/session/', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })

        const sessJson = await sessRes.json()
        if (!sessRes.ok && sessRes.status !== 404) {
          throw new Error(sessJson.error || 'Failed to get session')
        }

        // If there's an active session, it means they haven't completed yet
        if (sessRes.ok && !sessJson.is_completed) {
          window.location.href = '/chat'
          return
        }

        // Get responses for this user
        const rRes = await fetch('http://localhost:8000/api/responses/', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })

        const allResponses = await rRes.json()
        const userResponses = allResponses.filter(r => r.user_id === user.id)

        // Get questionnaire details
        const qRes = await fetch('http://localhost:8000/api/questionnaires/', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })

        const questionnaires = await qRes.json()

        // Build report
        const questionnairesData = questionnaires.map(q => {
          const responses = userResponses.filter(r => r.questionnaire_id === q.id)
          return {
            ...q,
            responses: responses,
            completion_status: responses.length > 0 ? 'Completed' : 'Not Started'
          }
        })

        setReport({
          user: user,
          questionnaires: questionnairesData,
          total_questions: userResponses.length,
          completed_at: new Date().toLocaleString()
        })

        setLoading(false)
      } catch (err) {
        console.error('Report fetch error:', err)
        setError('Failed to load completion report. Please try again.')
        setLoading(false)
      }
    }

    fetchReport()
  }, [])

  const handleDownload = () => {
    if (!report) return

    let content = `QUESTIONNAIRE COMPLETION REPORT\n`
    content += `=====================================\n\n`
    content += `User: ${report.user.name}\n`
    content += `Email: ${report.user.email}\n`
    content += `Completion Date: ${report.completed_at}\n\n`

    report.questionnaires.forEach(q => {
      if (q.responses.length > 0) {
        content += `\n${q.title}\n`
        content += `${'-'.repeat(q.title.length)}\n`
        content += `${q.description || ''}\n\n`

        q.questions.forEach((question, idx) => {
          const response = q.responses.find(r => r.question_text === question.text)
          content += `Q${idx + 1}. ${question.text}\n`
          if (response) {
            content += `Answer: ${response.response}\n`
          }
          content += `\n`
        })
      }
    })

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', `questionnaire-report-${report.user.username}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleLogout = () => {
    localStorage.removeItem('session')
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FFFAF0 0%, #FFF4E6 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            border: '4px solid #FFE8D6',
            borderTop: '4px solid #FF9500',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#FF6B35', fontWeight: '600', fontSize: '1.1rem', marginTop: '1rem' }}>Loading completion report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FFFAF0 0%, #FFF4E6 100%)', padding: '1rem' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 15px 50px rgba(255, 107, 53, 0.2)',
          padding: '2.5rem',
          maxWidth: '500px',
          textAlign: 'center',
          borderTop: '5px solid #D63230'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem', background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.75rem 0' }}>Error</h2>
          <p style={{ color: '#999', marginBottom: '2rem' }}>{error}</p>
          <button onClick={handleLogout} style={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)',
            color: 'white',
            padding: '0.875rem 2rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)';
          }}>
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FFFAF0 0%, #FFF4E6 100%)', padding: '1rem' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 15px 50px rgba(255, 107, 53, 0.2)',
          padding: '2.5rem',
          maxWidth: '500px',
          textAlign: 'center',
          borderTop: '5px solid #FF9500'
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 1rem 0' }}>No Report Found</h2>
          <p style={{ color: '#999', marginBottom: '2rem' }}>You haven't completed any questionnaires yet.</p>
          <button onClick={handleLogout} style={{
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)',
            color: 'white',
            padding: '0.875rem 2rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)';
          }}>
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFFAF0 0%, #FFF4E6 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '950px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 15px 50px rgba(255, 107, 53, 0.15)',
          padding: '2.5rem',
          marginBottom: '2rem',
          borderTop: '5px solid #FF9500'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
                ✓ Questionnaire Completed
              </h1>
              <p style={{ color: '#999', margin: '0' }}>Thank you for your participation</p>
            </div>
            <div style={{ fontSize: '3.5rem', color: '#2E8B57' }}>✓</div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            marginBottom: '1.5rem',
            paddingTop: '2rem',
            borderTop: '2px solid #FFE8D6'
          }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0' }}>{report.total_questions}</p>
              <p style={{ color: '#999', margin: '0.5rem 0 0 0', fontWeight: '500' }}>Questions Answered</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#2E8B57', margin: '0' }}>100%</p>
              <p style={{ color: '#999', margin: '0.5rem 0 0 0', fontWeight: '500' }}>Completion Rate</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '0.95rem', color: '#999', margin: '0' }}>Completed</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#4A3728', margin: '0.25rem 0 0 0' }}>{report.completed_at}</p>
            </div>
          </div>
        </div>

        {/* Report Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 15px 50px rgba(255, 107, 53, 0.15)',
          padding: '2.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem', margin: '0 0 1.5rem 0' }}>
            Completion Report
          </h2>

          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '2px solid #FFE8D6' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#4A3728', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
              Respondent Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#999', margin: '0 0 0.25rem 0' }}>Name</p>
                <p style={{ fontWeight: '600', color: '#4A3728', margin: '0' }}>{report.user.name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: '#999', margin: '0 0 0.25rem 0' }}>Email</p>
                <p style={{ fontWeight: '600', color: '#4A3728', margin: '0' }}>{report.user.email}</p>
              </div>
            </div>
          </div>

          {/* Questionnaires Summary */}
          {report.questionnaires.map(q => (
            q.responses.length > 0 && (
              <div key={q.id} style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
                  {q.title}
                </h3>
                <p style={{ color: '#999', marginBottom: '1.5rem', margin: '0 0 1.5rem 0' }}>{q.description}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {q.questions.map((question, idx) => {
                    const response = q.responses.find(r => r.question_text === question.text)
                    return (
                      <div key={question.id} style={{
                        background: 'linear-gradient(135deg, #FFF8F5 0%, #FFFAF0 100%)',
                        borderRadius: '8px',
                        padding: '1.25rem',
                        borderLeft: '4px solid #FF9500'
                      }}>
                        <p style={{ fontWeight: '600', color: '#4A3728', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
                          Q{idx + 1}. {question.text}
                        </p>
                        {response && (
                          <div style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '6px',
                            borderLeft: '4px solid #FF9500'
                          }}>
                            <p style={{ color: '#4A3728', margin: '0', lineHeight: '1.6' }}>{response.response}</p>
                            <p style={{ fontSize: '0.8rem', color: '#BBB', marginTop: '0.75rem', margin: '0.75rem 0 0 0' }}>
                              Answered: {new Date(response.timestamp).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(135deg, #2E8B57 0%, #1F5A3F 100%)',
              color: 'white',
              padding: '1rem 2.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              fontSize: '1.05rem',
              boxShadow: '0 4px 15px rgba(46, 139, 87, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(46, 139, 87, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(46, 139, 87, 0.3)';
            }}
          >
            📥 Download Report
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF9500 100%)',
              color: 'white',
              padding: '1rem 2.5rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '1.05rem',
              boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.3)';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: repeat(3"] {
            grid-template-columns: 1fr;
          }
          div[style*="gridTemplateColumns: repeat(2"] {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Completion
