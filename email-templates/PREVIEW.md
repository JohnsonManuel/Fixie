# Email Template Preview Guide

## 📧 Custom Fixie Email Templates

This repository contains professionally designed, responsive email templates that match the Fixie brand.

---

## 🎨 Design Features

### Visual Design
- **Purple-Indigo Gradient Theme** - Matches fixiechat.ai branding
- **Modern Card Layout** - Clean, professional appearance
- **Fixie Logo & Branding** - Consistent brand identity
- **Icon Integration** - Visual indicators for each email type

### Technical Features
- ✅ **Fully Responsive** - Mobile, tablet, and desktop optimized
- ✅ **Dark Mode Support** - Auto-detects user preference
- ✅ **Email Client Compatible** - Tested on Gmail, Outlook, Apple Mail, etc.
- ✅ **Accessibility** - Proper alt text and semantic HTML
- ✅ **Security** - Clear expiry times and action buttons

---

## 📱 Email Templates

### 1. Password Reset Email (`password-reset.html`)

**Preview:**

```
┌─────────────────────────────────────┐
│          [Fixie Logo]               │
│            Fixie                    │
├─────────────────────────────────────┤
│                                     │
│         [🔑 Lock Icon]              │
│                                     │
│      Reset Your Password            │
│  We received a request to reset     │
│         your password               │
│                                     │
│  Hi there,                          │
│                                     │
│  We received a request to reset     │
│  the password for your Fixie        │
│  account. Click the button below    │
│  to create a new password:          │
│                                     │
│   ┌───────────────────────┐         │
│   │   Reset Password      │         │
│   └───────────────────────┘         │
│     [Gradient Button]               │
│                                     │
│  Or copy and paste this link...     │
│  https://...                        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ⏱️ This link will expire in │   │
│  │    1 hour for security      │   │
│  │                             │   │
│  │ 🔒 If you didn't request... │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│     Fixie - AI-Powered IT Support   │
│       Mask your IT Complexity       │
│                                     │
│   Home | Features | Support         │
│                                     │
│  © 2026 Fixie. All rights reserved. │
└─────────────────────────────────────┘
```

**Key Elements:**
- 🔑 Lock icon in gradient circle
- Clear "Reset Password" CTA button
- Alternative link for accessibility
- Expiry warning (1 hour)
- Security notice for unwanted requests

---

### 2. Email Verification (`email-verification.html`)

**Preview:**

```
┌─────────────────────────────────────┐
│          [Fixie Logo]               │
│            Fixie                    │
├─────────────────────────────────────┤
│                                     │
│         [✓ Check Icon]              │
│                                     │
│     Welcome to Fixie! 👋            │
│   Let's verify your email to        │
│         get started                 │
│                                     │
│  Thanks for signing up for Fixie!   │
│  We're excited to help you mask     │
│  IT complexity...                   │
│                                     │
│   ┌───────────────────────┐         │
│   │  Verify Email Address │         │
│   └───────────────────────┘         │
│     [Gradient Button]               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ What you can do with Fixie: │   │
│  │                             │   │
│  │ 🤖 AI-Powered Support       │   │
│  │ ⚡ Seamless Integrations    │   │
│  │ 🔒 Enterprise Security      │   │
│  │ 📊 Smart Analytics          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✅ Quick Start: After       │   │
│  │ verification, you'll be     │   │
│  │ able to log in...           │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│     Fixie - AI-Powered IT Support   │
│   © 2026 Fixie. All rights reserved.│
└─────────────────────────────────────┘
```

**Key Elements:**
- ✓ Checkmark icon in gradient circle
- Welcoming tone with emoji
- Feature highlights
- Clear verification CTA
- Quick start guide

---

## 🌈 Color Palette

### Light Mode
```css
Background:        #f8fafc (Light gray-blue)
Card:             #ffffff (White)
Primary Text:     #18181b (Near black)
Secondary Text:   #71717a (Medium gray)
Muted Text:       #a1a1aa (Light gray)
Border:           #e4e4e7 (Very light gray)
Button Gradient:  #6366f1 → #a855f7 (Indigo to Purple)
```

### Dark Mode
```css
Background:        #0a0a0a (Near black)
Card:             #171717 (Dark gray)
Primary Text:     #fafafa (Near white)
Secondary Text:   #a1a1aa (Light gray)
Muted Text:       #71717a (Medium gray)
Border:           #262626 (Dark border)
Button Gradient:  #6366f1 → #a855f7 (Same vibrant gradient)
```

---

## 📊 Responsive Breakpoints

### Mobile (< 600px)
- Smaller fonts (24px headings, 14px body)
- Full-width buttons
- Reduced padding (24px container, 24px card)
- Smaller icon (56px)

### Tablet (601px - 900px)
- Medium padding (36px card)
- Standard font sizes
- Inline buttons

### Desktop (> 900px)
- Full padding (40px card)
- Large fonts (28px headings, 15px body)
- Maximum container width: 600px

---

## 🌓 Dark Mode Support

**How it works:**
- Uses CSS `@media (prefers-color-scheme: dark)`
- Automatically detects user's system preference
- Inverts colors for proper contrast
- Maintains brand gradient colors

**Supported Email Clients:**
- ✅ Apple Mail (iOS 13+, macOS 10.14.4+)
- ✅ Outlook for Mac
- ✅ Outlook.com (web)
- ✅ Gmail app (mobile with dark theme)
- ⚠️ Gmail web (limited support)
- ⚠️ Outlook Windows (limited support)

**Example Dark Mode Changes:**
```css
/* Light Mode */
body { background: #f8fafc; }
.card { background: #ffffff; }
h1 { color: #18181b; }

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  body { background: #0a0a0a !important; }
  .card { background: #171717 !important; }
  h1 { color: #fafafa !important; }
}
```

---

## 🔧 Implementation Steps

### Quick Start (5 minutes)

1. **Open Firebase Console**
   ```
   https://console.firebase.google.com/
   → Select "jj-ai-platform"
   → Authentication → Templates
   ```

2. **Edit Password Reset Template**
   - Click edit (pencil icon)
   - Switch to HTML/code view
   - Copy contents from `email-templates/password-reset.html`
   - Paste and save

3. **Edit Email Verification Template**
   - Same process as above
   - Use `email-templates/email-verification.html`

4. **Test**
   - Use "Send test email" in Firebase
   - Check on mobile and desktop
   - Verify dark mode (if supported by client)

### Customization

**Change Logo:**
```html
<img src="YOUR_LOGO_URL_HERE" 
     alt="Fixie Logo" 
     width="48" 
     height="48">
```

**Change Colors:**
```css
/* Button gradient */
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);

/* Background gradient */
background: linear-gradient(135deg, rgba(R,G,B,0.1) 0%, rgba(R,G,B,0.1) 100%);
```

**Change Support Email:**
```html
<a href="mailto:YOUR_EMAIL@domain.com">YOUR_EMAIL@domain.com</a>
```

---

## ✅ Email Client Testing Checklist

Test on these popular clients:

### Desktop
- [ ] Gmail (web) - Chrome
- [ ] Gmail (web) - Firefox
- [ ] Outlook.com - Edge
- [ ] Apple Mail - macOS
- [ ] Thunderbird

### Mobile
- [ ] Gmail app - iOS
- [ ] Gmail app - Android
- [ ] Apple Mail - iPhone
- [ ] Outlook app - iOS
- [ ] Outlook app - Android
- [ ] Samsung Email

### Dark Mode Testing
- [ ] Apple Mail (iOS) - Dark mode ON
- [ ] Apple Mail (macOS) - Dark mode ON
- [ ] Outlook.com - Dark theme ON
- [ ] Gmail mobile - Dark theme ON

---

## 🎯 Best Practices

### Do's ✅
- Use tables for layout (better compatibility)
- Inline critical CSS
- Use absolute URLs for images
- Provide alt text for all images
- Keep HTML under 100KB
- Test on multiple clients before deploying
- Include plain text version (Firebase handles this)

### Don'ts ❌
- Don't use JavaScript
- Don't use external stylesheets
- Don't use background images (limited support)
- Don't rely solely on images for content
- Don't use forms in emails
- Don't modify the `%LINK%` placeholder

---

## 📞 Support Resources

**Firebase Email Templates:**
- [Official Documentation](https://firebase.google.com/docs/auth/custom-email-handler)
- [Template Customization](https://firebase.google.com/docs/auth/custom-email-handler#customize_the_email_handler)

**Email Development:**
- [Can I Email](https://www.caniemail.com/) - CSS support checker
- [Email on Acid](https://www.emailonacid.com/) - Testing service
- [Litmus](https://www.litmus.com/) - Email testing platform

**Design Inspiration:**
- [Really Good Emails](https://reallygoodemails.com/)
- [Mailchimp Email Templates](https://mailchimp.com/email-templates/)

---

## 📈 Analytics & Tracking

To track email opens and clicks, add UTM parameters to links in Firebase console:

```
%LINK%&utm_source=email&utm_medium=password-reset&utm_campaign=authentication
```

You can then track these in Google Analytics or your analytics platform.

---

## 🔐 Security Considerations

1. **Link Expiry**: Password reset links expire in 1 hour (Firebase default)
2. **One-time Use**: Links can only be used once
3. **HTTPS Only**: All links use HTTPS
4. **No Personal Data**: Emails don't expose sensitive information
5. **Clear Actions**: Users know exactly what clicking will do

---

## 📝 Version History

**v1.0** - April 12, 2026
- Initial release
- Password reset template
- Email verification template
- Full responsive design
- Dark mode support
- Multi-client compatibility

---

**Need Help?**

Refer to the detailed setup guide in `email-templates/README.md` or contact support.
