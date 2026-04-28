# NexAuth Integration Guide

Adding NexAuth to your website is incredibly fast. You don't need to learn complex SDKs or write backend authentication logic. This guide will help you integrate NexAuth in under 5 minutes.

## 1. Prerequisites

Before you start, ensure that your **NexAuth backend and dashboard are running**.
You can start them using the run steps in the main README (backend on :4000 and dashboard on :3000).

## 2. The One Line of Code

Copy the following script tag and paste it into the HTML of your website, ideally just before the closing `</body>` tag:

```html
<script src="http://localhost:3000/nexauth.js" data-key="your-api-key-here"></script>
```
*(Note: In production, host the SDK at your own domain or tunnel and replace `http://localhost:3000` accordingly.)*

## 3. Configuration Options

You can configure the SDK directly from the script tag using `data-` attributes:
- `data-key` (Required): Your API key generated from the NexAuth dashboard.
- `data-theme` (Optional): Set to `"dark"` or `"light"` to match your website's UI.
- `data-position` (Optional): Set the default position of the login widget (e.g., `"center"`, `"top-right"`).

## 4. What Happens After Adding It?

Once the code is on your page:
1. NexAuth will automatically load and attach a secure login widget to any element with the id `#nexauth-container` or display a floating button.
2. The AI Threat Detection engine begins silently monitoring page interactions in the background to ensure the user is human and not a bot.
3. Upon a successful login, NexAuth dispatches a `nexauth:success` event to your window object with the user's details.

## 5. How to Verify it is Working

1. Load your website in your browser.
2. You should see the NexAuth login form or button.
3. Try logging in with a test account.
4. Open the Developer Console (F12) and check if the `nexauth:success` event fired, or check your NexAuth Dashboard to see the real-time login activity!

## 6. Troubleshooting Common Issues

**Q: The widget isn't showing up!**
- Ensure the NexAuth backend is running (`bash start.sh`).
- Check the browser console for CORS errors. Ensure your website's domain is allowed in `config/cors.js`.

**Q: Login fails instantly!**
- Verify your `data-key` is correct and matches an API key in your database.
- The AI engine might have flagged you as a bot if you reloaded the page too many times too quickly. Wait a minute and try again.

**Q: I get a connection refused error.**
- Ensure you replaced the `src` URL in the script tag to match your actual server address (or tunnel) if you are not running it locally.
