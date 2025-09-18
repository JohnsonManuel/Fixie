# Freshworks Integration Setup Guide

## 1. Get Your Freshworks Credentials

### For Freshdesk:
1. Log in to your Freshdesk account
2. Go to **Admin** → **API Settings**
3. Copy your **API Key**
4. Note your domain (e.g., `yourcompany.freshdesk.com`)

### For Freshservice:
1. Log in to your Freshservice account
2. Go to **Admin** → **API Settings**
3. Copy your **API Key**
4. Note your domain (e.g., `yourcompany.freshservice.com`)

## 2. Set Environment Variables

You need to set these secrets in your Firebase Functions:

### Using Firebase CLI:
```bash
firebase functions:secrets:set FRESHWORKS_DOMAIN
# Enter your domain: yourcompany.freshdesk.com

firebase functions:secrets:set FRESHWORKS_API_KEY
# Enter your API key: your_api_key_here
```

### Using Firebase Console:
1. Go to Firebase Console → Functions → Secrets
2. Add new secret: `FRESHWORKS_DOMAIN` = `yourcompany.freshdesk.com`
3. Add new secret: `FRESHWORKS_API_KEY` = `your_api_key_here`

## 3. Update Firebase Functions Configuration

Make sure your `firebase.json` includes the secrets:

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "secrets": [
      "FRESHWORKS_DOMAIN",
      "FRESHWORKS_API_KEY"
    ]
  }
}
```

## 4. Deploy the Functions

```bash
firebase deploy --only functions
```

## 5. Test the Integration

Try creating a ticket through your chat system. The ticket should now be created in your Freshworks account.

## 6. Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check your API key and domain
2. **403 Forbidden**: Ensure your API key has ticket creation permissions
3. **404 Not Found**: Verify your domain URL is correct
4. **422 Validation Error**: Check that required fields are being sent

### Debug Mode:
Check the Firebase Functions logs to see detailed error messages:
```bash
firebase functions:log
```

## 7. Customization

You can customize the integration by modifying:

- **Priority mapping** in `freshworks-integration.ts`
- **Category mapping** in `freshworks-integration.ts`
- **Custom fields** in the ticket creation
- **Tags** added to tickets

## 8. Freshworks API Documentation

- [Freshdesk API Docs](https://developers.freshdesk.com/api/)
- [Freshservice API Docs](https://developers.freshservice.com/api/)

## 9. Security Notes

- Never commit API keys to version control
- Use Firebase Secrets for sensitive data
- Regularly rotate your API keys
- Monitor API usage in Freshworks
