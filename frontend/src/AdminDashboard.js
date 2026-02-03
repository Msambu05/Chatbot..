import React, { useState, useEffect } from 'react'
import './AdminDashboard.css'

function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [questionnaires, setQuestionnaires] = useState([])
  const [users, setUsers] = useState([])
  const [responses, setResponses] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalQuestionnaires: 0,
    activeQuestionnaires: 0,
    totalSessions: 0,
    completedSessions: 0,
    totalQuestions: 0,
    totalAnswers: 0,
    totalAuditLogs: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")

  // New Questionnaire Dialog State
  const [showNewQuestionnaire, setShowNewQuestionnaire] = useState(false)
  const [newQTitle, setNewQTitle] = useState("")
  const [newQDescription, setNewQDescription] = useState("")
  const [newQuestions, setNewQuestions] = useState([""])

  // New User Dialog State
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")

  // CSV Upload State
  const [csvText, setCsvText] = useState("")

  // Filter States
  const [filterStakeholder, setFilterStakeholder] = useState("")
  const [filterQuestionnaire, setFilterQuestionnaire] = useState("")

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('session') || '{}')
    if (!session.user || session.user.role !== 'admin') {
      window.location.href = '/'
      return
    }

    setUser(session.user)
    loadData()
    setLoading(false)
  }, [])

  const loadData = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('session') || '{}').token
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const [questionnairesRes, usersRes, responsesRes, statsRes, activityRes] = await Promise.all([
        fetch('http://localhost:8000/api/questionnaires/', { headers }),
        fetch('http://localhost:8000/api/users/', { headers }),
        fetch('http://localhost:8000/api/responses/', { headers }),
        fetch('http://localhost:8000/api/dashboard/stats/', { headers }),
        fetch('http://localhost:8000/api/dashboard/activity/', { headers })
      ])

      if (questionnairesRes.ok) setQuestionnaires(await questionnairesRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
      if (responsesRes.ok) setResponses(await responsesRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
      if (activityRes.ok) setRecentActivity(await activityRes.json())
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleCreateQuestionnaire = async () => {
    if (!newQTitle.trim() || !user) return

    const questions = newQuestions
      .filter(q => q.trim())
      .map((q, index) => ({
        text: q.trim(),
        order: index + 1,
      }))

    if (questions.length === 0) return

    try {
      const response = await fetch('http://localhost:8000/api/questionnaires/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session') || '{}').token}`
        },
        body: JSON.stringify({
          title: newQTitle.trim(),
          description: newQDescription.trim(),
          questions: questions
        })
      })

      if (response.ok) {
        loadData()
        setShowNewQuestionnaire(false)
        setNewQTitle("")
        setNewQDescription("")
        setNewQuestions([""])
      }
    } catch (error) {
      console.error('Failed to create questionnaire:', error)
    }
  }

  const handleCreateQuestionnaireFromCSV = async () => {
    if (!csvText.trim() || !user) return

    const lines = csvText.split("\n").filter(line => line.trim())
    if (lines.length === 0) return

    const questions = lines.map((line, index) => ({
      text: line.trim(),
      order: index + 1,
    }))

    try {
      const response = await fetch('http://localhost:8000/api/questionnaires/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session') || '{}').token}`
        },
        body: JSON.stringify({
          title: newQTitle.trim() || "Imported Questionnaire",
          description: newQDescription.trim() || "Imported from CSV",
          questions: questions
        })
      })

      if (response.ok) {
        loadData()
        setShowNewQuestionnaire(false)
        setNewQTitle("")
        setNewQDescription("")
        setCsvText("")
      }
    } catch (error) {
      console.error('Failed to create questionnaire from CSV:', error)
    }
  }

  const handleDeleteQuestionnaire = async (id) => {
    if (!window.confirm("Are you sure you want to delete this questionnaire?")) return

    try {
      const response = await fetch(`http://localhost:8000/api/questionnaires/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session') || '{}').token}`
        }
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Failed to delete questionnaire:', error)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return

    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session') || '{}').token}`
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: "stakeholder",
          is_active: true
        })
      })

      if (response.ok) {
        loadData()
        setShowNewUser(false)
        setNewUserName("")
        setNewUserEmail("")
      }
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const handleToggleUserStatus = async (userId) => {
    const userToUpdate = users.find(u => u.id === userId)
    if (!userToUpdate) return

    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session') || '{}').token}`
        },
        body: JSON.stringify({
          is_active: !userToUpdate.is_active
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleAssignQuestionnaire = async (userId, questionnaireId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/assign/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session') || '{}').token}`
        },
        body: JSON.stringify({
          questionnaire_id: questionnaireId
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Failed to assign questionnaire:', error)
    }
  }

  const handleSendReminder = async (userId) => {
    const userToRemind = users.find(u => u.id === userId)
    if (!userToRemind || !userToRemind.assigned_questionnaire_id) return

    try {
      await fetch(`http://localhost:8000/api/users/${userId}/remind/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session') || '{}').token}`
        }
      })
    } catch (error) {
      console.error('Failed to send reminder:', error)
    }
  }

  const handleUnassignQuestionnaire = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/assign/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session') || '{}').token}`
        },
        body: JSON.stringify({
          questionnaire_id: null
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Failed to unassign questionnaire:', error)
    }
  }

  const handleExportResponses = () => {
    // Export all response data
    const exportData = {
      exportedAt: new Date().toISOString(),
      questionnaires: questionnaires.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        questionsCount: q.questions?.length || 0,
        createdBy: users.find(u => u.id === q.created_by)?.name || 'Unknown',
        createdAt: q.created_at,
        responses: responses.filter(r => r.questionnaire_id === q.id).map(r => ({
          stakeholder: users.find(u => u.id === r.user_id)?.name || 'Unknown',
          question: r.question_text,
          response: r.response,
          answeredAt: r.timestamp
        }))
      }))
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `questionnaire-responses-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleLogout = () => {
    localStorage.removeItem('session')
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const totalQuestionnaires = questionnaires.length
  const totalStakeholders = users.length
  const assessmentsCompleted = responses.length
  const assessmentsInProgress = users.filter(u => u.assigned_questionnaire_id && !responses.some(r => r.user_id === u.id)).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-blue-600">Questionnaire System</h1>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Admin Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("questionnaires")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "questionnaires"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Questionnaires
            </button>
            <button
              onClick={() => setActiveTab("stakeholders")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "stakeholders"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Stakeholders
            </button>
            <button
              onClick={() => setActiveTab("responses")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "responses"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Responses
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
              <p className="text-gray-600">Key metrics and statistics</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Questionnaires</h3>
                <div className="text-3xl font-bold">{stats.totalQuestionnaires}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeQuestionnaires} active
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeUsers} active
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Answers Submitted</h3>
                <div className="text-3xl font-bold">{stats.totalAnswers}</div>
                <p className="text-xs text-gray-500 mt-1">total responses</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Sessions Completed</h3>
                <div className="text-3xl font-bold">{stats.completedSessions}</div>
                <p className="text-xs text-gray-500 mt-1">of {stats.totalSessions} total</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Questions</h3>
                <div className="text-3xl font-bold">{stats.totalQuestions}</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Audit Logs</h3>
                <div className="text-3xl font-bold">{stats.totalAuditLogs}</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Completion Rate</h3>
                <div className="text-3xl font-bold">{stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className="ml-4 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                        {activity.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Questionnaire Management */}
        {activeTab === "questionnaires" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Questionnaire Management</h2>
                <p className="text-gray-600">Upload and manage questionnaires</p>
              </div>
              <button
                onClick={() => setShowNewQuestionnaire(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                New Questionnaire
              </button>
            </div>

            <div className="grid gap-4"> 
              {questionnaires.map(q => (
                <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{q.title}</h3>
                      <p className="text-gray-600">{q.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Created by {users.find(u => u.id === q.created_by)?.name || 'Unknown'} on {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestionnaire(q.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Delete questionnaire"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>{q.questions?.length || 0} questions</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      q.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {q.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:underline">View all questions</summary>
                    <ol className="mt-3 space-y-2 pl-5 list-decimal">
                      {q.questions?.map((question, idx) => (
                        <li key={question.id || idx} className="text-gray-700">
                          {question.text}
                        </li>
                      )) || []}
                    </ol>
                  </details>
                </div>
              ))}
              {questionnaires.length === 0 && (
                <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
                  <p className="text-gray-500">No questionnaires yet. Create your first one!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stakeholder Management */}
        {activeTab === "stakeholders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Stakeholder Management</h2>
                <p className="text-gray-600">Assign questionnaires and manage stakeholders</p>
              </div>
              <button
                onClick={() => setShowNewUser(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                New Stakeholder
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Questionnaire</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          u.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          className="text-sm border rounded px-2 py-1 bg-white"
                          value={u.assigned_questionnaire_id || ""}
                          onChange={(e) => handleAssignQuestionnaire(u.id, e.target.value)}
                        >
                          <option value="">None</option>
                          {questionnaires.map(q => (
                            <option key={q.id} value={q.id}>
                              {q.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {u.assigned_questionnaire_id && u.is_active && (
                          <button
                            onClick={() => handleSendReminder(u.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Send reminder"
                          >
                            📧
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            u.is_active
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No stakeholders yet. Create your first account!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Response Review */}
        {activeTab === "responses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Response Review</h2>
                <p className="text-gray-600">View, filter, and export responses</p>
              </div>
              <button
                onClick={handleExportResponses}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Export as JSON
              </button>
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Filter by Stakeholder</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
                  value={filterStakeholder}
                  onChange={(e) => setFilterStakeholder(e.target.value)}
                >
                  <option value="">All Stakeholders</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Filter by Questionnaire</label>
                <select
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
                  value={filterQuestionnaire}
                  onChange={(e) => setFilterQuestionnaire(e.target.value)}
                >
                  <option value="">All Questionnaires</option>
                  {questionnaires.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Responses Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stakeholder</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questionnaire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {responses
                    .filter(r => {
                      const matchStakeholder = !filterStakeholder || r.user_id === filterStakeholder
                      const matchQuestionnaire = !filterQuestionnaire || r.questionnaire_id === filterQuestionnaire
                      return matchStakeholder && matchQuestionnaire
                    })
                    .map((r, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {users.find(u => u.id === r.user_id)?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {questionnaires.find(q => q.id === r.questionnaire_id)?.title || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {r.question_text}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {r.response}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(r.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  {responses.filter(r => {
                    const matchStakeholder = !filterStakeholder || r.user_id === filterStakeholder
                    const matchQuestionnaire = !filterQuestionnaire || r.questionnaire_id === filterQuestionnaire
                    return matchStakeholder && matchQuestionnaire
                  }).length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No responses yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* New Questionnaire Modal */}
      {showNewQuestionnaire && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Questionnaire</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Stakeholder Engagement Survey"
                    value={newQTitle}
                    onChange={(e) => setNewQTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Brief description of this questionnaire"
                    value={newQDescription}
                    onChange={(e) => setNewQDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Questions</label>
                  {newQuestions.map((question, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`Question ${index + 1}`}
                        value={question}
                        onChange={(e) => {
                          const updated = [...newQuestions]
                          updated[index] = e.target.value
                          setNewQuestions(updated)
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {newQuestions.length > 1 && (
                        <button
                          onClick={() => {
                            setNewQuestions(newQuestions.filter((_, i) => i !== index))
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setNewQuestions([...newQuestions, ""])}
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleCreateQuestionnaire}
                    disabled={!newQTitle.trim() || newQuestions.filter(q => q.trim()).length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Create Questionnaire
                  </button>
                  <button
                    onClick={() => setShowNewQuestionnaire(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {showNewUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Stakeholder</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleCreateUser}
                    disabled={!newUserName.trim() || !newUserEmail.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Create Stakeholder
                  </button>
                  <button
                    onClick={() => setShowNewUser(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
