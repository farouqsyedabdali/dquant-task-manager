# Legal Documents - Content Update Guide

## Overview
This guide explains how to update the Terms of Service and Privacy Policy content in the application.

## Files to Update
- **`client/src/data/legalDocuments.js`** - Contains all legal document content

## How to Update Content

### Step 1: Extract Content from PDFs
Your original documents are located at:
- `client/src/assets/TIALZ.COM - Terms of Use.pdf`
- `client/src/assets/TIALZ.COM - Privacy Policy.pdf`

You can use an online PDF to text converter, or manually copy the content.

### Step 2: Structure the Content
Open `client/src/data/legalDocuments.js` and replace the placeholder content.

#### Format for Each Section:
```javascript
{
  title: "Section Number. Section Title",
  content: `Your content here. Can be multi-paragraph.
  
  Can include bullet points:
  • Point 1
  • Point 2
  • Point 3
  
  **Bold text** for emphasis (optional)
  
  Multiple paragraphs are supported.`
}
```

### Step 3: Update Metadata
Update the following fields:
- `lastUpdated`: The date your documents were last updated
- `title`: Keep as is unless you want to change the display title

### Step 4: Tips
1. **Preserve line breaks**: Use template literals (backticks) to preserve formatting
2. **Bullet points**: Use • or - for lists
3. **Emphasis**: You can use **bold** or *italic* markdown-style formatting
4. **Contact info**: Update email addresses and physical addresses in the contact sections
5. **Jurisdiction**: Update the governing law section with your actual jurisdiction
6. **Company name**: Replace "Tialz" with your actual company name if different

### Step 5: Test
After updating:
1. Start the dev server: `npm run dev` (from client directory)
2. Navigate to signup page
3. Click on "Terms of Service" and "Privacy Policy" links
4. Verify formatting looks good
5. Check Settings > About section

## Customization Options

### Adding More Sections
To add a new section, just add another object to the `sections` array:
```javascript
{
  title: "X. Your New Section",
  content: `Section content here`
}
```

### Removing Sections
Simply delete the section object from the `sections` array.

### Changing Colors
The modal automatically adapts to your app's theme. Colors are set via CSS variables in `client/src/index.css`.

## Need Help?
If you need assistance with formatting or have questions, refer to the `LegalDocumentModal.jsx` component for display logic.
