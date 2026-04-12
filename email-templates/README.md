# Firebase Email Template Setup Guide

## 📧 Password Reset Email Template

This guide will help you set up the custom Fixie-branded password reset email template in Firebase.

---

## 🎨 Features

✅ **Matches Fixie Brand**:
- Purple-to-indigo gradient theme
- Fixie logo and branding
- Modern card-based design

✅ **Responsive Design**:
- Mobile optimized (< 600px)
- Tablet support (601-900px)
- Desktop support (> 900px)

✅ **Dark Mode Support**:
- Auto-detects user's dark mode preference
- Proper contrast in both modes
- Uses `prefers-color-scheme` media query

✅ **Email Client Compatibility**:
- Gmail (desktop & mobile)
- Outlook (desktop & mobile)
- Apple Mail
- Yahoo Mail
- ProtonMail
- Thunderbird

---

## 📋 Setup Instructions

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **jj-ai-platform**
3. Click **Authentication** in the left sidebar
4. Click on the **Templates** tab at the top

### Step 2: Customize Password Reset Template

1. Find **Password reset** in the template list
2. Click the **Edit icon (pencil)** on the right
3. You'll see the template editor with **Subject** and **Email body** fields

### Step 3: Update Email Subject

Replace the subject with:
```
Reset Your Password - Fixie
```

### Step 4: Update Email Body

**Option A: Use the Full HTML Template (Recommended)**

1. Click the **"< >" (code view)** button in the editor toolbar
2. Delete all existing HTML
3. Copy the entire contents from `/email-templates/password-reset.html`
4. Paste into the editor
5. The template uses `%LINK%` placeholder which Firebase automatically replaces

**Option B: Use Firebase's Simple Editor**

If Firebase doesn't allow full HTML customization in your plan:

1. Use the visual editor
2. Customize these fields:
   - **From name**: `Fixie Support`
   - **Reply-to email**: `support@fixiechat.ai` (or your support email)
   - **Subject**: `Reset Your Password - Fixie`
   - **Body**: Use the simplified text below

### Step 5: Simplified Text Version (If Full HTML Not Supported)

```
Hi there,

We received a request to reset the password for your Fixie account.

Click the link below to create a new password:
%LINK%

⏱️ This link will expire in 1 hour for security reasons.

🔒 If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
Fixie - AI-Powered IT Support
Mask your IT Complexity

Need help? Contact us at support@fixiechat.ai
© 2026 Fixie. All rights reserved.
```

### Step 6: Customize Email Verification Template (Bonus)

While you're here, also customize the **Email address verification** template:

**Subject**: `Verify Your Email - Fixie`

**Body**: Similar to password reset, but change the heading to:
```html
<h1>Verify Your Email</h1>
<p class="subtitle">Welcome to Fixie! Let's get you started</p>
```

And button text to:
```html
<a href="%LINK%" class="button">Verify Email Address</a>
```

---

## 🧪 Testing the Email Template

### Test via Firebase Console

1. In the **Templates** tab, click **Send test email**
2. Enter your email address
3. Check how it looks on:
   - Desktop (Gmail, Outlook)
   - Mobile (Gmail app, Outlook app, Apple Mail)
   - Dark mode (enable dark mode on device)

### Test via Application

1. Go to `/forgot-password` on your site
2. Enter your email
3. Check your inbox
4. Verify:
   - ✅ Fixie branding appears correctly
   - ✅ Button works and redirects to `/reset-password`
   - ✅ Responsive on mobile
   - ✅ Dark mode renders properly (if your email client supports it)

---

## 🎨 Customization Options

### Change Colors

In the HTML template, you can modify these CSS variables:

**Gradient Background**:
```css
background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%);
```

**Button Gradient**:
```css
background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
```

**Light Mode Colors**:
- Background: `#f8fafc`
- Card: `#ffffff`
- Text: `#18181b`
- Subtitle: `#71717a`

**Dark Mode Colors**:
- Background: `#0a0a0a`
- Card: `#171717`
- Text: `#fafafa`
- Subtitle: `#a1a1aa`

### Add Company Logo

Replace the logo URL in the template:
```html
<img src="https://www.fixiechat.ai/static/media/image.92b9d81578834428284b.png" 
     alt="Fixie Logo" 
     width="48" 
     height="48">
```

### Change Support Email

Update footer links and support references:
```html
<a href="mailto:support@fixiechat.ai">support@fixiechat.ai</a>
```

---

## 📱 Dark Mode Support Details

The template uses the `prefers-color-scheme` media query:

```css
@media (prefers-color-scheme: dark) {
    body { background: #0a0a0a !important; }
    .card { background: #171717 !important; }
    /* ... more dark mode styles */
}
```

**Supported Email Clients**:
- ✅ Apple Mail (iOS 13+, macOS 10.14.4+)
- ✅ Outlook for Mac
- ✅ Outlook.com web
- ✅ Gmail mobile app (Android/iOS with dark theme)
- ❌ Gmail web (doesn't support prefers-color-scheme yet)
- ❌ Outlook Windows desktop (limited support)

---

## ⚠️ Important Notes

1. **Firebase Limitations**: 
   - Firebase may strip some CSS for security
   - Always test after saving
   - Keep a backup of your template

2. **Email Size**:
   - Keep total HTML under 102KB
   - Current template: ~12KB (well within limit)

3. **Images**:
   - Host images on HTTPS
   - Use absolute URLs
   - Provide alt text for accessibility

4. **Links**:
   - Use `%LINK%` placeholder for Firebase magic link
   - Don't modify this placeholder

5. **Testing**:
   - Test on multiple email clients
   - Check spam folder if not receiving
   - Verify SPF/DKIM records are set up

---

## 🔧 Troubleshooting

### Email not received?
1. Check spam/junk folder
2. Verify email isn't blocked by firewall
3. Check Firebase quota limits
4. Verify sender domain authentication

### Template not rendering correctly?
1. Some email clients strip CSS
2. Use tables for layout (HTML template does this)
3. Inline critical CSS (template uses embedded styles)
4. Test in multiple clients

### Dark mode not working?
1. Check if email client supports `prefers-color-scheme`
2. Verify dark mode enabled on device
3. Some clients (like Gmail web) don't support dark mode CSS

---

## 📞 Support

Need help? Contact:
- **Email**: support@fixiechat.ai
- **Documentation**: https://www.fixiechat.ai/docs
- **Firebase Support**: https://firebase.google.com/support

---

## ✅ Checklist

- [ ] Accessed Firebase Console → Authentication → Templates
- [ ] Customized Password reset template
- [ ] Customized Email verification template  
- [ ] Updated subject lines
- [ ] Added company branding (logo, colors)
- [ ] Tested on desktop email client
- [ ] Tested on mobile email client
- [ ] Tested dark mode rendering
- [ ] Verified reset link works correctly
- [ ] Saved and published changes

---

**Last Updated**: April 12, 2026
**Template Version**: 1.0
**Compatible with**: Firebase Authentication v10+
