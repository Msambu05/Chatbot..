from django.contrib import admin
from django.utils.html import format_html
from .models import Questionnaire, Question, Session, Answer, AuditLog


@admin.register(Questionnaire)
class QuestionnaireAdmin(admin.ModelAdmin):
    list_display = ('title', 'get_questions_count', 'created_by', 'created_at', 'is_active_badge', 'actions_column')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('id', 'created_at')
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'title', 'description')
        }),
        ('Metadata', {
            'fields': ('meta', 'created_by', 'created_at', 'is_active')
        }),
    )
    
    def get_questions_count(self, obj):
        return obj.questions.count()
    get_questions_count.short_description = 'Questions'
    
    def is_active_badge(self, obj):
        color = '#28a745' if obj.is_active else '#6c757d'
        status = 'Active' if obj.is_active else 'Inactive'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, status
        )
    is_active_badge.short_description = 'Status'
    
    def actions_column(self, obj):
        return format_html(
            '<a class="button" href="/admin/db/question/?questionnaire__id__exact={}">View Questions</a>',
            obj.id
        )
    actions_column.short_description = 'Actions'


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ('position', 'question_text', 'type', 'required')
    ordering = ['position']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text_short', 'questionnaire', 'type', 'position', 'required')
    list_filter = ('type', 'required', 'questionnaire')
    search_fields = ('question_text', 'questionnaire__title')
    readonly_fields = ('id',)
    fieldsets = (
        ('Question Details', {
            'fields': ('id', 'questionnaire', 'question_text', 'type')
        }),
        ('Configuration', {
            'fields': ('position', 'options', 'required')
        }),
    )
    
    def question_text_short(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text
    question_text_short.short_description = 'Question Text'


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('get_user_name', 'get_questionnaire_title', 'current_question_index', 'total_questions', 'completion_badge', 'last_updated')
    list_filter = ('is_completed', 'last_updated', 'questionnaire')
    search_fields = ('user__username', 'user__email', 'questionnaire__title')
    readonly_fields = ('id', 'last_updated')
    fieldsets = (
        ('Session Info', {
            'fields': ('id', 'user', 'questionnaire')
        }),
        ('Progress', {
            'fields': ('current_question_index', 'total_questions', 'is_completed')
        }),
        ('Timestamps', {
            'fields': ('last_updated', 'expires_at')
        }),
    )
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_user_name.short_description = 'User'
    
    def get_questionnaire_title(self, obj):
        return obj.questionnaire.title
    get_questionnaire_title.short_description = 'Questionnaire'
    
    def completion_badge(self, obj):
        color = '#28a745' if obj.is_completed else '#ffc107'
        status = 'Completed' if obj.is_completed else 'In Progress'
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 3px 8px; border-radius: 3px; color: white;">{}</span>',
            color, '#000' if not obj.is_completed else '#fff', status
        )
    completion_badge.short_description = 'Status'


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('get_question_text', 'get_user_name', 'get_questionnaire_title', 'answer_preview', 'answered_at')
    list_filter = ('answered_at', 'session__questionnaire')
    search_fields = ('session__user__username', 'session__user__email', 'question__question_text')
    readonly_fields = ('id', 'answered_at')
    fieldsets = (
        ('Answer Details', {
            'fields': ('id', 'session', 'question')
        }),
        ('Response', {
            'fields': ('answer_text', 'answer_json')
        }),
        ('Timestamp', {
            'fields': ('answered_at',)
        }),
    )
    
    def get_question_text(self, obj):
        text = obj.question.question_text
        return text[:50] + '...' if len(text) > 50 else text
    get_question_text.short_description = 'Question'
    
    def get_user_name(self, obj):
        return obj.session.user.get_full_name() or obj.session.user.username
    get_user_name.short_description = 'User'
    
    def get_questionnaire_title(self, obj):
        return obj.session.questionnaire.title
    get_questionnaire_title.short_description = 'Questionnaire'
    
    def answer_preview(self, obj):
        preview = obj.answer_text[:50] + '...' if obj.answer_text and len(obj.answer_text) > 50 else obj.answer_text or '(No response)'
        return preview
    answer_preview.short_description = 'Response'


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action_badge', 'get_actor_name', 'object_type', 'created_at')
    list_filter = ('action', 'created_at', 'object_type')
    search_fields = ('actor__username', 'actor__email', 'action', 'object_id')
    readonly_fields = ('id', 'created_at', 'payload_json')
    fieldsets = (
        ('Action', {
            'fields': ('id', 'action', 'actor')
        }),
        ('Object Info', {
            'fields': ('object_type', 'object_id')
        }),
        ('Details', {
            'fields': ('payload_json', 'created_at')
        }),
    )
    
    def action_badge(self, obj):
        colors = {
            'user_login': '#17a2b8',
            'questionnaire_created': '#28a745',
            'questionnaire_deleted': '#dc3545',
            'questionnaire_assigned': '#007bff',
            'user_created': '#28a745',
        }
        color = colors.get(obj.action, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color, obj.action.replace('_', ' ').title()
        )
    action_badge.short_description = 'Action'
    
    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.username
        return 'System'
    get_actor_name.short_description = 'Actor'
    
    def payload_json(self, obj):
        import json
        if obj.payload:
            return json.dumps(obj.payload, indent=2)
        return 'No additional data'
    payload_json.short_description = 'Payload'
