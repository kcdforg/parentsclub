# User Flow Testing Guide

This guide outlines how to test the comprehensive user onboarding flow that ensures users complete intro questions and profile completion based on their invitation status.

## Overview

The system now automatically checks user completion status during login and redirects them to the appropriate step if incomplete.

## Flow Logic

### User Types & Flow Requirements

1. **Invited Users (created via invitation)**:
   - Must complete intro questions (getIntro.html)
   - Must complete profile completion steps
   - Redirected appropriately on every login

2. **Direct Users (registered directly)**:
   - Use legacy profile completion flow
   - Redirected to profile_completion.html if not completed

## Test Scenarios

### Scenario 1: New Invited User - First Login
**Setup**: User registered via invitation but hasn't completed anything
**Expected Flow**:
1. User logs in → Redirected to `getIntro.html?invitation=CODE`
2. Completes 3 questions → Redirected to `profile_completion.html?step=1&invitation=CODE`
3. Completes all profile steps → Redirected to `dashboard.html`

**Test Steps**:
1. Create invitation via admin panel
2. Register user via invitation link
3. Set password 
4. Logout and login again
5. Verify redirect to getIntro.html

### Scenario 2: Partially Completed Invited User
**Setup**: User completed intro questions but not profile
**Expected Flow**:
1. User logs in → Redirected to `profile_completion.html?step=X&invitation=CODE`
2. Continues from where they left off

**Test Steps**:
1. Complete intro questions for an invited user
2. Logout without completing profile
3. Login again
4. Verify redirect to correct profile step

### Scenario 3: Fully Completed User
**Setup**: User completed everything
**Expected Flow**:
1. User logs in → Goes directly to `dashboard.html`

### Scenario 4: Existing Session Check
**Setup**: User is already logged in and navigates to different pages
**Expected Flow**:
1. User accesses any page → Middleware checks completion status
2. Redirects if incomplete, allows access if complete

**Test Steps**:
1. Login as incomplete user
2. Manually navigate to `dashboard.html`
3. Verify automatic redirect to appropriate completion step

### Scenario 5: Direct Registration User (Legacy)
**Setup**: User registered directly (not via invitation)
**Expected Flow**:
1. User logs in → Redirected to `profile_completion.html` if not completed
2. Completes profile → Access to dashboard

## Database States to Test

### Test Database Records

```sql
-- Invited user who hasn't started intro
INSERT INTO users (phone, password, created_via_invitation, invitation_id) 
VALUES ('+1234567890', '$2y$10$hash', 1, 1);

-- Invited user who completed intro but not profile  
INSERT INTO user_profile (user_id, intro_completed, questions_completed, profile_completion_step)
VALUES (1, 1, 1, 'member_details');

-- Invited user who completed everything
INSERT INTO user_profile (user_id, intro_completed, questions_completed, profile_completion_step)
VALUES (2, 1, 1, 'completed');
```

## Key Files Updated

### Backend Files
- `public/backend/login.php` - Enhanced with completion status checking
- `public/backend/account.php` - Returns comprehensive user status
- `public/backend/intro_questions.php` - Handles intro question submission
- `public/backend/profile_completion.php` - Handles profile completion

### Frontend Files  
- `public/frontend/js/login.js` - Intelligent redirect logic
- `public/frontend/js/user-flow-middleware.js` - Reusable flow checking
- `public/frontend/js/dashboard.js` - Uses middleware for protection
- `public/frontend/getIntro.html` - 3-question intro flow
- `public/frontend/profile_completion.html` - Multi-step profile form

## API Response Format

### Login Response
```json
{
    "success": true,
    "session_token": "abc123",
    "next_step": "intro_required|profile_required|completed|dashboard",
    "invitation_code": "INV123456",
    "user": {
        "id": 1,
        "intro_completed": false,
        "questions_completed": false,
        "profile_completion_step": "member_details",
        "created_via_invitation": true
    }
}
```

### Account Check Response
```json
{
    "success": true,
    "user": {
        "id": 1,
        "intro_completed": true,
        "questions_completed": true,
        "profile_completion_step": "spouse_details",
        "created_via_invitation": true
    }
}
```

## Testing Checklist

- [ ] New invited user redirected to intro questions
- [ ] Partially completed user resumes at correct step
- [ ] Completed user accesses dashboard normally
- [ ] Session middleware works on all protected pages
- [ ] Direct registration users use legacy flow
- [ ] Invitation codes are properly passed through redirects
- [ ] User data is updated in localStorage after each completion
- [ ] Back button handling works correctly in flows
- [ ] Error handling for network issues
- [ ] Mobile responsiveness of new forms

## Troubleshooting

### Common Issues
1. **User stuck in redirect loop**: Check database completion status
2. **Missing invitation code**: Verify user.created_via_invitation and invitation_id
3. **Profile step not advancing**: Check profile_completion_step updates in backend
4. **Session validation failing**: Verify Authorization header in API calls

### Debug Tools
- Browser DevTools → Network tab to see API responses
- Check localStorage for user_data and session_token
- Console logs for redirect decisions
- Database queries to verify completion status

## Deployment Notes

1. **Database Migration**: Run `database/onboarding_schema_update.sql`
2. **Backward Compatibility**: Legacy users continue to work normally
3. **Feature Flags**: Can be disabled by modifying login.php logic
4. **Performance**: Minimal impact - single additional query on login

## Future Enhancements

1. **Resume Functionality**: Save partial form progress
2. **Skip Options**: Allow admins to bypass certain steps
3. **Analytics**: Track completion rates and drop-off points
4. **Customization**: Different flows for different invitation types
