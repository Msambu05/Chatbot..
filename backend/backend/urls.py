"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from db.views import (
    QuestionnaireListView, QuestionnaireDetailView,
    UserListView, UserDetailView, UserAssignView, UserRemindView, UserSessionView, UserProfileView,
    ResponseListView, DashboardStatsView, RecentActivityView,
    SessionDetailView, AnswerCreateView,
    login_view
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/login/', login_view, name='login'),
    path('api/questionnaires/', QuestionnaireListView.as_view(), name='questionnaire-list'),
    path('api/questionnaires/<str:questionnaire_id>/', QuestionnaireDetailView.as_view(), name='questionnaire-detail'),
    
    # More specific routes first
    path('api/users/me/', UserProfileView.as_view(), name='user-profile'),
    path('api/users/me/session/', UserSessionView.as_view(), name='user-session'),
    
    # General user routes
    path('api/users/', UserListView.as_view(), name='user-list'),
    path('api/users/<str:user_id>/', UserDetailView.as_view(), name='user-detail'),
    path('api/users/<str:user_id>/assign/', UserAssignView.as_view(), name='user-assign'),
    path('api/users/<str:user_id>/remind/', UserRemindView.as_view(), name='user-remind'),
    
    # Response and session routes
    path('api/responses/', ResponseListView.as_view(), name='response-list'),
    path('api/sessions/<str:session_id>/', SessionDetailView.as_view(), name='session-detail'),
    path('api/sessions/<str:session_id>/answers/', AnswerCreateView.as_view(), name='answer-create'),
    
    # Dashboard routes
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/dashboard/activity/', RecentActivityView.as_view(), name='recent-activity'),
]
