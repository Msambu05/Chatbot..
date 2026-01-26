# AdminDashboard Integration - Test Workflow Guide

## Complete End-to-End Workflow

This guide demonstrates how to test the complete integrated system from creating a questionnaire to viewing responses.

### Step 1: Start Services

#### Backend
```bash
cd backend
python manage.py runserver
```

Expected output:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
May XX, 2024 - XX:XX:XX
Django version 5.2.4, using settings 'backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

#### Frontend
```bash
cd frontend
npm start
```

Expected output:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
```

### Step 2: Login to Admin Dashboard

1. Navigate to `http://localhost:3000`
2. Enter credentials:
   - Email: `admin@iicts.co.za` (or any admin user)
   - Password: `admin123` (or your test password)
3. Click "Login"

**Expected Result**: Redirect to `/admin` dashboard

### Step 3: Test Dashboard Tab

**What to verify**:
- [ ] 7 stat cards are displayed
- [ ] Numbers match database counts
- [ ] Recent activity shows last 10 audit logs
- [ ] Timestamps are formatted (e.g., "12/31/2024, 10:30:45 AM")
- [ ] Activity types show correct badge colors

**Browser Console Check**:
Open DevTools (F12) → Console tab
```javascript
// Check if data was loaded successfully
// You should see no CORS errors or "Failed to load data" messages
```

### Step 4: Test Questionnaires Tab

#### 4.1 Create New Questionnaire

1. Click "New Questionnaire" button
2. Fill form:
   - Title: "Test Survey"
   - Description: "This is a test questionnaire"
   - Questions:
     - "What is your opinion?"
     - "Rate your satisfaction"
     - "Any additional comments?"
3. Click "Create Questionnaire"

**Expected Result**:
- Modal closes
- Questionnaire appears at top of list
- Creator name shows as your admin account name
- Creation date shows today's date
- Question count shows "3 questions"

#### 4.2 Verify Display

For the created questionnaire, verify:
- [ ] Title displays correctly
- [ ] Description displays correctly
- [ ] Creator shows: "Created by [Your Name] on 12/31/2024"
- [ ] Status badge shows "Active"
- [ ] Question count shows "3"
- [ ] Click "View all questions" shows:
  1. What is your opinion?
  2. Rate your satisfaction
  3. Any additional comments?
- [ ] Delete button (🗑️) is clickable

### Step 5: Test Stakeholders Tab

#### 5.1 Create New Stakeholder

1. Click "New Stakeholder" button
2. Fill form:
   - Name: "John Smith"
   - Email: "john@example.com"
3. Click "Create Stakeholder"

**Expected Result**:
- Modal closes
- New user appears in table
- Status shows "Active"
- Assigned Questionnaire shows dropdown

#### 5.2 Assign Questionnaire

1. In the newly created stakeholder row, click "None" dropdown
2. Select "Test Survey" (the questionnaire you created)
3. System reloads

**Expected Result**:
- Questionnaire name "Test Survey" appears instead of dropdown
- "Unassign" button appears
- Send reminder (📧) button appears

#### 5.3 Verify Stakeholder Properties

Check that each stakeholder row shows:
- [ ] Name field populated
- [ ] Email field populated
- [ ] Status badge (Active/Inactive with color)
- [ ] Assigned questionnaire name or assign dropdown
- [ ] Send reminder button (if active + has assignment)
- [ ] Activate/Deactivate toggle button

### Step 6: Test Responses Tab (Simulating User Completion)

#### 6.1 Preparation: Use Django Admin to Complete Questionnaire

For testing without implementing stakeholder chat interface:

1. Open Django admin: `http://localhost:8000/admin`
2. Login with admin account
3. Navigate to Sessions
4. Click the session for your stakeholder + test questionnaire
5. Create sample answers in the Answer admin:
   - Question: "What is your opinion?"
   - Response: "Very good"
   - Date: Today

Or use the Django shell to create test data:

```python
python manage.py shell
```

```python
from django.contrib.auth.models import User
from db.models import Questionnaire, Session, Question, Answer

# Get the objects
user = User.objects.get(email='john@example.com')
questionnaire = Questionnaire.objects.get(title='Test Survey')
session = Session.objects.get(user=user, questionnaire=questionnaire)
question = Question.objects.filter(questionnaire=questionnaire).first()

# Create answer
Answer.objects.create(
    session=session,
    question=question,
    answer_text='This is my response to the survey'
)
```

#### 6.2 Verify Responses Display

In AdminDashboard Responses tab:

**Check table data**:
- [ ] Stakeholder column shows "John Smith"
- [ ] Questionnaire column shows "Test Survey"
- [ ] Question column shows question text
- [ ] Response column shows answer text
- [ ] Date column shows today's date formatted

**Check filters**:
1. Filter by Stakeholder: "John Smith"
   - Only John Smith's responses appear
2. Clear and filter by Questionnaire: "Test Survey"
   - Only Test Survey responses appear
3. Apply both filters
   - Shows intersection of both filters

#### 6.3 Test Export

1. Click "Export as JSON" button
2. File downloads as `questionnaire-responses-2024-12-31.json`

**Verify file content**:
```json
{
  "exportedAt": "2024-12-31T10:30:45.123456Z",
  "questionnaires": [
    {
      "id": "...",
      "title": "Test Survey",
      "description": "...",
      "questionsCount": 3,
      "createdBy": "Admin Name",
      "createdAt": "2024-12-31T10:00:00Z",
      "responses": [
        {
          "stakeholder": "John Smith",
          "question": "What is your opinion?",
          "response": "Very good",
          "answeredAt": "2024-12-31T10:25:00Z"
        }
      ]
    }
  ]
}
```

### Step 7: Test User Management Actions

#### 7.1 Deactivate User

1. In Stakeholders tab, find stakeholder row
2. Click "Deactivate" button
3. Button changes to "Activate"
4. Button color changes from red to green

**Backend Verification**:
```python
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(email='john@example.com')
>>> user.is_active
False  # Should show False after deactivation
```

#### 7.2 Send Reminder

1. Reactivate the user by clicking "Activate"
2. Verify user has assigned questionnaire
3. Click send reminder (📧) button
4. Check Django server logs for any errors

**Expected**: No error messages (reminder functionality may not be fully implemented)

### Step 8: Verify API Responses (Browser DevTools)

Open DevTools (F12) → Network tab

#### Check Network Requests:

1. **GET /api/questionnaires/**
   - Status: 200
   - Response includes: id, title, description, created_by, created_at, questions[], is_active

2. **GET /api/users/**
   - Status: 200
   - Response includes: id, name, email, role, is_active, assigned_questionnaire_id, created_at

3. **GET /api/responses/**
   - Status: 200
   - Response includes: id, user_id, questionnaire_id, question_text, response, timestamp

4. **GET /api/dashboard/stats/**
   - Status: 200
   - Response includes: totalUsers, activeUsers, totalQuestionnaires, activeQuestionnaires, totalSessions, completedSessions, totalQuestions, totalAnswers, totalAuditLogs

5. **GET /api/dashboard/activity/**
   - Status: 200
   - Response is array of: {id, type, title, description, timestamp}

#### Check Headers:

All requests should include:
```
Authorization: Bearer <JWT_TOKEN>
```

### Step 9: Test Error Handling

#### 9.1 Network Error

1. Stop Django server (Ctrl+C)
2. Reload AdminDashboard page
3. Try creating/assigning/deleting

**Expected**: 
- Error logged in console
- UI gracefully handles error
- Page doesn't crash

#### 9.2 Invalid Token

1. Open DevTools Console
2. Clear session:
```javascript
localStorage.removeItem('session')
```
3. Reload page

**Expected**:
- Redirect to login page
- Cannot access admin dashboard

### Step 10: Performance Verification

#### Check Load Time

Open DevTools → Performance tab

**Expected metrics**:
- Page load: < 2 seconds
- API calls: < 500ms each
- All 5 API calls in parallel (not sequential)

#### Check Data Freshness

1. Create new questionnaire in Django admin
2. Refresh AdminDashboard
3. New questionnaire appears in list

**Expected**: Data updates within 1 refresh cycle

---

## Common Issues & Troubleshooting

### Issue: "No such table: db_auditlog"
**Solution**: Run migrations
```bash
python manage.py makemigrations db
python manage.py migrate
```

### Issue: CORS errors in browser console
**Solution**: Verify CORS settings in `backend/settings.py`
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Issue: 401 Unauthorized on API calls
**Solution**: 
- Check token is in localStorage
- Verify token hasn't expired (60 min)
- Login again if needed

### Issue: Stats show 0 for everything
**Solution**:
- Verify database has data using Django admin
- Check `/api/dashboard/stats/` response in DevTools Network tab
- Ensure migrations created all tables

### Issue: "Cannot read property 'map' of undefined"
**Solution**:
- Check that API responses match expected format
- Verify all required fields are returned from backend
- Check browser console for full error

### Issue: Timestamps show as "Invalid Date"
**Solution**:
- Verify backend returns ISO format timestamps (e.g., "2024-12-31T10:30:45.123456Z")
- Check that `new Date(timestamp)` parses correctly in browser console

---

## Database Verification

Check data directly in SQLite:

```bash
cd backend
python manage.py shell
```

```python
from db.models import Questionnaire, Question, Session, Answer, AuditLog
from django.contrib.auth.models import User

# Check questionnaires
print(f"Total questionnaires: {Questionnaire.objects.count()}")
for q in Questionnaire.objects.all():
    print(f"  - {q.title} ({q.questions.count()} questions)")

# Check users
print(f"Total users: {User.objects.count()}")
for u in User.objects.all():
    print(f"  - {u.email} ({'Admin' if u.is_superuser else 'Stakeholder'})")

# Check sessions
print(f"Total sessions: {Session.objects.count()}")
for s in Session.objects.all():
    print(f"  - {s.user.email} → {s.questionnaire.title} ({'Completed' if s.is_completed else 'In Progress'})")

# Check responses
print(f"Total answers: {Answer.objects.count()}")
print(f"Total audit logs: {AuditLog.objects.count()}")
```

---

## Success Criteria

✅ All tests pass if:
- [x] Dashboard displays correct statistics
- [x] Questionnaires show with creator names and dates
- [x] Can create, view, and delete questionnaires
- [x] Can create and manage stakeholders
- [x] Can assign questionnaires to stakeholders
- [x] Assigned questionnaire displays correctly
- [x] Can view responses with full details
- [x] Filtering works (by stakeholder, by questionnaire)
- [x] Can export responses as JSON
- [x] All API calls return 200 status with correct data
- [x] No console errors or CORS issues
- [x] Timestamps display correctly
- [x] Status badges show correct colors

**If all criteria pass, the AdminDashboard integration is complete and fully functional!**
