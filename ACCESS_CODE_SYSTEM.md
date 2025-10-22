# Access Code System

## Overview
The application now includes an access code system that requires users to enter a code (8834) before accessing the landing page and the rest of the application.

## Implementation Details

### Components
- **AccessCodeModal.jsx**: A modal component that handles the access code input and validation
- **App.jsx**: Modified to include access code verification logic

### Features
- **Hardcoded Access Code**: The system uses the code `8834` (not displayed anywhere on the site)
- **No Session Persistence**: Access code must be entered every time the page is loaded
- **Complete Black Background**: Nothing is visible behind the modal
- **No Storage**: No data is stored in localStorage

### How It Works

1. **Initial Load**: When the application loads, the AccessCodeModal is always displayed
2. **Access Required**: Users must enter the access code every time
3. **Code Validation**: Users must enter the correct 4-digit code (8834)
4. **Access Granted**: Upon successful verification, the modal disappears and users can access the site
5. **No Persistence**: Access code must be entered on every page load/refresh

### Technical Implementation

#### AccessCodeModal Component
- Uses Framer Motion for smooth animations
- Validates numeric input (4 digits only)
- Provides visual feedback for errors
- Matches the landing page design aesthetic

#### App.jsx Integration
- Always shows the access code modal on load
- No localStorage checks or session management
- Handles the verification callback to hide the modal

### Security Notes
- The access code (8834) is hardcoded in the component
- No server-side validation is required
- Access is client-side only for simplicity
- The code is not displayed anywhere on the site

### Customization
To change the access code:
1. Open `client/src/components/AccessCodeModal.jsx`
2. Find the line: `if (code === '8834')`
3. Replace `'8834'` with your desired code

## Usage
1. Navigate to the application
2. Enter the access code: `8834`
3. Click "Verify Access"
4. Access the landing page and full application
5. Access code must be entered every time the page is loaded/refreshed
