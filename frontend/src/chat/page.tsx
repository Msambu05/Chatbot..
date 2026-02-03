//chat/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSession as getAuthSession, logout } from "@/lib/auth"
import {
  getQuestionnaireById,
  createSession,
  getSession as getQuestionnaireSession,
  updateSession,
  saveAnswer,
  getAnswers,
} from "@/lib/storage"
import { createNotification, sendEmailNotification } from "@/lib/notifications"
import { NotificationBell } from "@/components/notification-bell"
import type { Questionnaire, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, LogOut, UserIcon, CheckCircle2, Send, Save } from "lucide-react"
import { Logo } from "@/components/logo"

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [session, setSession] = useState<any>(null)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "bot" | "user"; content: string }>>([])
  const [isComplete, setIsComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)

  // Initialize component
  useEffect(() => {
    const initializeChat = async () => {
      // Check if user has a valid session
      const authSession = getAuthSession()
      if (!authSession || authSession.user.role !== "stakeholder") {
        router.push("/")
        return
      }

      // Fetch fresh user data from API to get latest assigned questionnaire
      let currentUser: User
      try {
        const freshUserData = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/me`, {
          headers: {
            Authorization: `Bearer ${authSession.token}`,
          },
        })
        if (!freshUserData.ok) {
          throw new Error("Failed to fetch user data")
        }
        const userData = await freshUserData.json()
        currentUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isActive: !userData.disabled,
          assignedQuestionnaireId: userData.assigned_questionnaire_id,
          createdAt: userData.created_at,
        }
        setUser(currentUser)
      } catch (error) {
        console.error("Failed to fetch user data:", error)
        router.push("/")
        return
      }

      // Load questionnaire if assigned
      if (currentUser.assignedQuestionnaireId) {
        const q = await getQuestionnaireById(currentUser.assignedQuestionnaireId)
        if (q) {
          setQuestionnaire(q)
          
          // Try to load existing session
          try {
            const sessionData = await getQuestionnaireSession(currentUser.assignedQuestionnaireId)
            setSession(sessionData)
            
            // Build initial messages
            const msgs: Array<{ role: "bot" | "user"; content: string }> = [
              {
                role: "bot",
                content: `Hello ${currentUser.name}! I'm your IICTS engagement assistant. I'll be guiding you through a questionnaire to better understand your project requirements. You can pause at any time and return later - your progress will be saved automatically.`,
              },
            ]
            
            // Load previous answers if any
            if (sessionData.id) {
              const answers = await getAnswers(sessionData.id)
              const answerMap = new Map(answers.map((a: any) => [a.question_id, a]))
              
              // Add previous Q&A
              q.questions.forEach((question) => {
                const answer = answerMap.get(question.id)
                if (answer) {
                  msgs.push({ role: "bot", content: question.text })
                  msgs.push({ role: "user", content: answer.answer_text })
                }
              })
            }
            
            // Add current question if not complete
            if (!sessionData.is_completed && sessionData.current_question_index < q.questions.length) {
              const currentQuestion = q.questions[sessionData.current_question_index]
              msgs.push({ role: "bot", content: currentQuestion.text })
            } else if (sessionData.is_completed) {
              msgs.push({
                role: "bot",
                content: "Thank you for completing the questionnaire! Your responses have been recorded and your Business Analyst has been notified. You may now log out.",
              })
              setIsComplete(true)
            }
            
            setMessages(msgs)
          } catch (error) {
            console.error("Failed to load session, creating new:", error)
            
            // Create new session
            try {
              await createSession(currentUser.assignedQuestionnaireId)
              const newSession = await getQuestionnaireSession(currentUser.assignedQuestionnaireId)
              setSession(newSession)
              
              const msgs: Array<{ role: "bot" | "user"; content: string }> = [
                {
                  role: "bot",
                  content: `Hello ${currentUser.name}! I'm your IICTS engagement assistant. I'll be guiding you through a questionnaire to better understand your project requirements. You can pause at any time and return later - your progress will be saved automatically.`,
                },
              ]
              
              if (q.questions.length > 0) {
                msgs.push({ role: "bot", content: q.questions[0].text })
              }
              
              setMessages(msgs)
            } catch (sessionError) {
              console.error("Failed to create session:", sessionError)
            }
          }
        }
      }
      
      setLoading(false)
    }
    
    initializeChat()
  }, [router]) // Only depends on router

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !user || !questionnaire || !session) return

    const currentQuestion = questionnaire.questions[session.current_question_index]

    // Save answer to database
    try {
      await saveAnswer(session.id, currentQuestion.id, currentAnswer.trim())
    } catch (error) {
      console.error("Failed to save answer:", error)
      return
    }

    // Update messages
    const newMessages = [...messages, { role: "user" as const, content: currentAnswer.trim() }]

    // Update session
    const newQuestionIndex = session.current_question_index + 1
    let isCompleted = false

    // Check if complete
    if (newQuestionIndex >= questionnaire.questions.length) {
      isCompleted = true
      newMessages.push({
        role: "bot",
        content: "Thank you for completing the questionnaire! Your responses have been recorded and your Business Analyst has been notified. You may now log out.",
      })
      setIsComplete(true)

      // Notify the stakeholder
      createNotification({
        userId: user.id,
        type: "completion",
        title: "Questionnaire Completed",
        message: `You have successfully completed the "${questionnaire.title}" questionnaire. Thank you for your responses!`,
        read: false,
      })

      // Send email to stakeholder
      sendEmailNotification(
        user.email,
        "Questionnaire Completed - IICTS",
        `Dear ${user.name},\n\nThank you for completing the "${questionnaire.title}" questionnaire. Your responses have been recorded and your Business Analyst will review them shortly.\n\nBest regards,\nIzingcweti ICT Solutions`,
      )

      // Notify the admin/BA (using admin-1 as the BA)
      createNotification({
        userId: "admin-1",
        type: "completion",
        title: "Stakeholder Completed Questionnaire",
        message: `${user.name} has completed the "${questionnaire.title}" questionnaire. Review their responses in the admin dashboard.`,
        read: false,
      })

      // Send email to BA
      sendEmailNotification(
        "admin@iicts.co.za",
        "Stakeholder Questionnaire Completed - IICTS",
        `A stakeholder has completed a questionnaire.\n\nStakeholder: ${user.name} (${user.email})\nQuestionnaire: ${questionnaire.title}\nCompleted: ${new Date().toLocaleString()}\n\nPlease review their responses in the admin dashboard.`,
      )
    } else {
      // Add next question
      const nextQuestion = questionnaire.questions[newQuestionIndex]
      newMessages.push({ role: "bot", content: nextQuestion.text })
    }

    // Update session in database
    try {
      await updateSession(session.id, {
        current_question_index: newQuestionIndex,
        is_completed: isCompleted,
      })

      // Update local session state
      setSession({
        ...session,
        current_question_index: newQuestionIndex,
        is_completed: isCompleted,
      })
    } catch (error) {
      console.error("Failed to update session:", error)
    }

    setMessages(newMessages)
    setCurrentAnswer("")

    // Scroll to bottom
    setTimeout(() => {
      const chatContainer = document.getElementById("chat-messages")
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 100)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSaveAndContinueLater = () => {
    if (user) {
      // Progress is already being saved automatically, just show confirmation
      setShowSaveConfirm(true)
      setTimeout(() => {
        setShowSaveConfirm(false)
      }, 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your questionnaire...</p>
        </div>
      </div>
    )
  }

  if (!questionnaire || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No questionnaire assigned to your account.</p>
            <p className="text-sm text-muted-foreground mb-6">
              If you were recently assigned a questionnaire, please log out and log back in to refresh your session.
            </p>
            <div className="space-y-2">
              <Button onClick={handleLogout} className="w-full">Log Out & Refresh</Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercentage = session.total_questions > 0 
    ? (session.current_question_index / session.total_questions) * 100 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      {/* Sidebar */}
      <aside className="w-80 border-r bg-card hidden lg:flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <Logo size="sm" />
            </div>
            {user && <NotificationBell userId={user.id} />}
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-blue-200 dark:border-blue-900">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 text-sm">Current Questionnaire</h3>
              <p className="text-sm text-muted-foreground">{questionnaire.title}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {session.current_question_index} / {session.total_questions}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {isComplete
                  ? "Completed"
                  : `Question ${session.current_question_index + 1} of ${session.total_questions}`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t space-y-3">
          {!isComplete && (
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveAndContinueLater}>
              <Save className="w-4 h-4 mr-2" />
              Save & Continue Later
            </Button>
          )}
          <Button variant="outline" className="w-full bg-transparent" onClick={() => window.location.reload()}>
            🔄 Refresh Session
          </Button>
          <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden border-b bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <Logo size="sm" showText={false} />
            <div className="flex items-center gap-2">
              {user && <NotificationBell userId={user.id} />}
              {!isComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveAndContinueLater}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-950"
                >
                  <Save className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Question {session.current_question_index + 1} of {session.total_questions}
            </span>
            <Progress value={progressPercentage} className="h-1.5 w-32" />
          </div>
        </header>

        {/* Chat Messages */}
        <div id="chat-messages" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "bot" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Logo size="sm" showText={false} />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  message.role === "bot"
                    ? "bg-card border text-card-foreground"
                    : "bg-primary text-primary-foreground ml-auto"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Confirmation Toast */}
        {showSaveConfirm && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            Your progress has been saved. You can close this window anytime.
          </div>
        )}

        {/* Input Area */}
        {!isComplete && (
          <div className="border-t bg-card p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type your answer here..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitAnswer()
                    }
                  }}
                  className="min-h-[80px] resize-none"
                />
                <Button onClick={handleSubmitAnswer} disabled={!currentAnswer.trim()} size="lg" className="px-6">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}