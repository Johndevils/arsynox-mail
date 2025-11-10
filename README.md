# Arsynox Mail

A modern, serverless temporary email service built entirely on Cloudflare Workers. It provides a clean, responsive interface for generating disposable email addresses and viewing incoming emails, all without any traditional server hosting.

![Arsynox Mail](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)
![api.mail.tm](https://img.shields.io/badge/Powered%20By-api.mail.tm-blue?style=for-the-badge)


## ✨ Features

- **🚀 Serverless Architecture**: Runs entirely on Cloudflare's global edge network for minimal latency and high availability.
- **🔐 Real Email Addresses**: Integrates with the free `api.mail.tm` service to provide real, functional temporary email inboxes.
- **📱 Responsive Design**: Built with Tailwind CSS for a clean, modern UI that works perfectly on desktop and mobile devices.
- **⚡ Instant Email Viewing**: Automatically fetches and displays new emails in real-time.
- **📋 Easy Copy-to-Clipboard**: One-click copying of your temporary email address.
- **🔍 Full Email Content**: Click any email to view its complete content, with support for both plain text and HTML emails.
- **💾 Persistent Session**: Remembers your generated email address in the browser for convenience.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Tailwind CSS (via CDN), Vanilla JavaScript
- **Backend**: Cloudflare Workers (JavaScript ES Modules)
- **API**: `api.mail.tm` for temporary email functionality
- **Deployment**: Cloudflare Wrangler CLI

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 16 or later)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A [Cloudflare account](https://www.cloudflare.com/)

> **Note**: This project uses `api.mail.tm`, which does not require an API key for basic usage, simplifying the setup process.

## 🚀 Deployment Guide

Follow these steps to deploy Arsynox Mail to your own Cloudflare Workers account.

### Step 1: Get Your Project Files

Ensure you have the following files in your project directory:

- `worker.js`: The main application logic, configured for `api.mail.tm`.
- `index.html`: The frontend file.
- `wrangler.toml`: The configuration file for Wrangler.
- `README.md`: This file.

### Step 2: Install Wrangler CLI

If you haven't already, install the Wrangler CLI globally using npm:

```bash
npm install -g wrangler
```

### Step 3: Configure `wrangler.toml`

Your `wrangler.toml` file is very simple since no API key is needed. It should look like this:

```toml
name = "arsynox-mail"
main = "worker.js"
compatibility_date = "2023-05-18"

# This section is required for the worker to import the index.html file.
[build]
command = "" # No build command is needed for this simple setup.
```

> **Note**: The `api.mail.tm` integration does not use any secrets or environment variables, so there is no `[vars]` section needed.

### Step 4: Authenticate with Cloudflare

Log in to your Cloudflare account through the Wrangler CLI. This will open a browser window to complete the authentication process.

```bash
wrangler login
```

### Step 5: Deploy the Worker

You are now ready to deploy! Run the publish command from your project's root directory:

```bash
wrangler publish
```

Wrangler will process your `worker.js` and `index.html` files, upload them to Cloudflare, and make your application live.

Upon successful deployment, Wrangler will output a URL similar to this:

```
Published arsynox-mail (1.0.0)
https://arsynox-mail.your-subdomain.workers.dev
```

Visit that URL to see your live Arsynox Mail application!

## 📁 Project Structure

```
arsynox-mail/
├── worker.js          # Main Cloudflare Worker script (handles routing, API calls, and serves HTML)
├── index.html         # Frontend HTML file
├── wrangler.toml      # Configuration file for Wrangler (name, entry point)
└── README.md          # This file
```

The entire application is self-contained within the worker, which fetches the `index.html` file and serves it, while also handling the backend API endpoints.

## 🧪 Local Development

To test your worker locally before deploying:

```bash
wrangler dev
```

This will start a local development server, and you can access your application at `http://localhost:8787/index.html`.

## 📖 Usage

1.  **Open the App**: Navigate to your deployed `workers.dev` URL with `/index.html` at the end (e.g., `https://arsynox-mail.your-subdomain.workers.dev/index.html`).
2.  **Generate Email**: Click the "Generate New Email" button to create a new temporary email address.
3.  **Copy Address**: Use the "Copy" button to copy the address to your clipboard.
4.  **Receive Emails**: Send an email to the generated address from any email service.
5.  **View Inbox**: The inbox will automatically refresh. You can also click the "Refresh" button.
6.  **Read Emails**: Click on any email in the list to view its full content.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

-   [Cloudflare Workers](https://workers.cloudflare.com/) for the powerful serverless platform.
-   [api.mail.tm](https://api.mail.tm/) for providing the free and easy-to-use temporary email API.
-   [Tailwind CSS](https://tailwindcss.com/) for the excellent utility-first CSS framework.
-   [Heroicons](https://heroicons.com/) for the beautiful SVG icons.
