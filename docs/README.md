# NexAuth 🔐

A plug-and-play authentication SDK with AI-powered cybersecurity features.

## What is NexAuth?

NexAuth is an incredibly simple yet highly secure authentication system that you can add to any website. Imagine having bank-level security for your users without having to write thousands of lines of complex backend code. You simply paste one line of code into your website, and NexAuth takes care of logging users in safely, while its built-in AI silently watches for hackers and stops them before they can even try to break in!

## Features

- 🔌 **One line integration**
- 🤖 **AI threat detection**
- 💻 **Hardware bound auth**
- 📊 **Real time dashboard**
- ☁️ **Zero cloud dependency**
- 🔑 **Password hashing**

## How to Install

Getting started with NexAuth is easy. Follow these steps:

1. Clone the repo:
   ```bash
   git clone https://github.com/shreyajogur/Cyberstorm_NextAuth.git
   cd Cyberstorm_NextAuth
   ```
2. Run the automated setup script:
   ```bash
   bash setup.sh
   ```
3. Start the entire system:
   ```bash
   bash start.sh
   ```
4. Experience the magic:
   Open `demo/index.html` or `demo/ecommerce.html` in your browser.

## How to Add to Your Website

You can add NexAuth to any website simply by pasting this one line of code right before the closing `</body>` tag:

```html
<script src="http://localhost:3000/nexauth.js" data-key="your-api-key-here"></script>
```

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend / Dashboard:** React.js
- **Security:** JWT, Bcrypt
- **AI Engine:** (Custom AI Threat Detection Module)
- **Deployment & Config:** Bash, Cloudflare Tunnels
