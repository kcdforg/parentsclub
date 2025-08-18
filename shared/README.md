# Shared Components Directory

This directory contains reusable components and APIs that can be used across both admin and public portals.

## 🏗️ Structure

```
shared/
├── backend/
│   └── invitations.php         # Unified invitation API
├── frontend/
│   ├── components/
│   │   └── InvitationComponent.js   # Reusable invitation UI component
│   └── invitations.html        # Standalone invitation page (optional)
└── README.md                   # This file
```

## 🔧 Components

### Backend APIs

#### `invitations.php`
Unified invitation management API that supports:

**User Types:**
- **Admin Users**: Full access (view all, create, manage, delete)
- **Approved Public Users**: Limited access (view own, create, delete own)
- **Premium Users**: Enhanced features (future expansion)

**Authorization:**
- Automatic user type detection via session tokens
- Role-based permission system
- Unified authentication for both admin and user sessions

**Features:**
- GET: List invitations (with pagination and filtering)
- GET with `?code=`: Validate invitation code (public endpoint)
- POST: Create new invitation
- PUT: Manage invitation actions (approve, reject, resend, cancel) - Admin only
- DELETE: Delete invitation (admin can delete any, users can delete own)

### Frontend Components

#### `InvitationComponent.js`
Reusable invitation management component that:

**Features:**
- Automatic user role detection and UI adaptation
- Unified API calls to shared backend
- Consistent styling and behavior
- Role-based action buttons and permissions
- Shared validation logic
- Mobile-responsive design

**Usage:**
```javascript
import { InvitationComponent } from '../../shared/frontend/components/InvitationComponent.js';

// Initialize component
window.invitationComponent = new InvitationComponent({
    container: '#invitationContainer',
    apiBaseUrl: '/regapp2/shared/backend'
});
```

## 🎯 Integration

### Admin Portal Integration
The admin portal (`admin/frontend/invitations.html`) now uses the shared component:
- Includes shared component via module import
- Maintains admin navigation and branding
- Full admin permissions (view all, manage all)

### Public Portal Integration  
The public portal (`public/frontend/invitations.html`) now uses the shared component:
- Includes shared component via module import
- Maintains public navigation and branding
- Limited user permissions (view own, create own)

## 🔄 Migration Benefits

### ✅ **Code Consistency**
- Single source of truth for invitation logic
- Consistent UI/UX across admin and public portals
- Shared validation and error handling

### ✅ **Maintainability**
- Bug fixes in one place benefit both portals
- Feature additions automatically available to both
- Reduced code duplication

### ✅ **Scalability**
- Easy to add new user roles (e.g., Premium users)
- Simple to extend functionality
- Centralized permission management

### ✅ **Security**
- Unified authorization logic
- Single API endpoint to secure
- Role-based access control

## 🚀 Future Enhancements

The shared structure makes it easy to add:

1. **New User Roles**: Premium, Manager, etc.
2. **Enhanced Features**: Bulk invitations, templates, analytics
3. **Additional Shared Components**: User management, subscriptions, etc.
4. **Cross-Platform APIs**: Mobile app support, third-party integrations

## 📝 Usage Guidelines

### Adding New Shared Components

1. Create in `shared/backend/` or `shared/frontend/components/`
2. Follow the unified authorization pattern
3. Support role-based permissions
4. Document in this README
5. Update both admin and public portals to use the shared component

### Best Practices

- Always use the shared APIs for common functionality
- Maintain backwards compatibility when updating shared components
- Test changes in both admin and public contexts
- Keep role-based logic in the shared layer, not in individual portals
