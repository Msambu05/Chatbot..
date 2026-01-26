import uuid
from django.db import models
from django.contrib.auth.models import User


class Questionnaire(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    meta = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class Question(models.Model):
    QUESTION_TYPES = [
        ('text', 'Short Text'),
        ('textarea', 'Long Text'),
        ('choice', 'Multiple Choice'),
        ('checkbox', 'Checkboxes'),
        ('rating', 'Rating Scale'),
    ]

    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    questionnaire = models.ForeignKey(Questionnaire, on_delete=models.CASCADE, related_name='questions')
    position = models.IntegerField(default=0)
    question_text = models.TextField()
    type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='text')
    options = models.JSONField(default=list, blank=True)
    required = models.BooleanField(default=True)

    def __str__(self):
        return self.question_text[:50]

    class Meta:
        ordering = ['position']


class Session(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    questionnaire = models.ForeignKey(Questionnaire, on_delete=models.CASCADE, related_name='sessions')
    current_question_index = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.questionnaire.title}"

    class Meta:
        ordering = ['-last_updated']


class Answer(models.Model):
    id = models.CharField(max_length=36, primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True, null=True)
    answer_json = models.JSONField(default=dict, blank=True)
    answered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Answer to {self.question.question_text[:30]}"

    class Meta:
        ordering = ['answered_at']


class AuditLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    object_type = models.CharField(max_length=100, blank=True, null=True)
    object_id = models.CharField(max_length=36, blank=True, null=True)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.actor} at {self.created_at}"

    class Meta:
        ordering = ['-created_at']
