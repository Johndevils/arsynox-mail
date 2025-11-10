// Import necessary modules
import { default as fetch } from 'node-fetch';

// Configuration for MailSlurp API
// Replace with your actual API key when deploying
const MAILSLURP_API_KEY = 'your-mailslurp-api-key-here'; // Replace with your actual API key
const MAILSLURP_API_BASE_URL = 'https://api.mailslurp.com';

// Cache configuration
const CACHE_TTL = 30; // seconds

// HTML content for the main page
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arsynox Mail - Temporary Email Service</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#6366F1',
                    }
                }
            }
        }
    </script>
    <style>
        /* Additional custom styles */
        .loading-spinner {
            border-top-color: #6366F1;
            animation: spinner 1.5s linear infinite;
        }
        
        @keyframes spinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .email-item {
            transition: all 0.2s ease;
        }
        
        .email-item:hover {
            transform: translateX(5px);
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <header class="text-center mb-10">
            <h1 class="text-4xl font-bold text-gray-800 mb-2">Arsynox Mail</h1>
            <p class="text-gray-600">A secure temporary email service powered by MailSlurp</p>
        </header>

        <main>
            <!-- Email Generation Section -->
            <section class="bg-white rounded-lg shadow-md p-6 mb-8">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="flex-1 w-full">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Your Temporary Email Address</label>
                        <div class="flex">
                            <input type="text" id="emailAddress" readonly 
                                class="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-primary focus:border-primary bg-gray-50"
                                placeholder="Click generate to create email">
                            <button id="copyBtn" 
                                class="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-indigo-700 transition-colors">
                                Copy
                            </button>
                        </div>
                    </div>
                    <button id="generateBtn" 
                        class="px-6 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors">
                        Generate New Email
                    </button>
                </div>
            </section>

            <!-- Inbox Section -->
            <section class="bg-white rounded-lg shadow-md p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold text-gray-800">Inbox</h2>
                    <button id="refreshBtn" 
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                        Refresh
                    </button>
                </div>
                
                <!-- Loading State -->
                <div id="loadingState" class="hidden py-8 text-center">
                    <div class="inline-block w-8 h-8 border-4 border-gray-200 rounded-full loading-spinner"></div>
                    <p class="mt-2 text-gray-600">Loading emails...</p>
                </div>
                
                <!-- Empty State -->
                <div id="emptyState" class="hidden py-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p class="text-gray-600">No emails in your inbox yet.</p>
                    <p class="text-sm text-gray-500 mt-1">Generate an email address to start receiving emails.</p>
                </div>
                
                <!-- Email List -->
                <div id="emailList" class="space-y-2">
                    <!-- Emails will be populated here -->
                </div>
                
                <!-- Email Detail View -->
                <div id="emailDetail" class="hidden mt-6 pt-6 border-t border-gray-200">
                    <button id="backBtn" class="mb-4 text-primary hover:text-indigo-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                        Back to inbox
                    </button>
                    <div class="bg-gray-50 p-4 rounded-md">
                        <h3 id="detailSubject" class="text-lg font-semibold mb-2"></h3>
                        <div class="flex justify-between mb-4">
                            <p id="detailFrom" class="text-sm text-gray-600"></p>
                            <p id="detailDate" class="text-sm text-gray-600"></p>
                        </div>
                        <div id="detailContent" class="prose max-w-none"></div>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <script>
        // DOM Elements
        const emailAddressEl = document.getElementById('emailAddress');
        const generateBtn = document.getElementById('generateBtn');
        const copyBtn = document.getElementById('copyBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const emailListEl = document.getElementById('emailList');
        const loadingStateEl = document.getElementById('loadingState');
        const emptyStateEl = document.getElementById('emptyState');
        const emailDetailEl = document.getElementById('emailDetail');
        const backBtn = document.getElementById('backBtn');
        const detailSubject = document.getElementById('detailSubject');
        const detailFrom = document.getElementById('detailFrom');
        const detailDate = document.getElementById('detailDate');
        const detailContent = document.getElementById('detailContent');

        // State
        let currentInboxId = '';
        let currentEmail = '';
        let emails = [];

        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            // Try to get existing email from localStorage
            const savedEmail = localStorage.getItem('arsynoxEmail');
            const savedInboxId = localStorage.getItem('arsynoxInboxId');
            
            if (savedEmail && savedInboxId) {
                currentEmail = savedEmail;
                currentInboxId = savedInboxId;
                emailAddressEl.value = currentEmail;
                fetchInbox();
            } else {
                showEmptyState();
            }

            // Event listeners
            generateBtn.addEventListener('click', generateNewEmail);
            copyBtn.addEventListener('click', copyEmailToClipboard);
            refreshBtn.addEventListener('click', fetchInbox);
            backBtn.addEventListener('click', backToInbox);
        });

        // Generate a new temporary email
        async function generateNewEmail() {
            try {
                showLoadingState();
                const response = await fetch('/api/new');
                const data = await response.json();
                
                if (data.email && data.inboxId) {
                    currentEmail = data.email;
                    currentInboxId = data.inboxId;
                    emailAddressEl.value = currentEmail;
                    localStorage.setItem('arsynoxEmail', currentEmail);
                    localStorage.setItem('arsynoxInboxId', currentInboxId);
                    
                    // Fetch inbox for the new email
                    await fetchInbox();
                } else {
                    showError('Failed to generate email address');
                }
            } catch (error) {
                console.error('Error generating email:', error);
                showError('Error generating email address');
            }
        }

        // Fetch emails for the current address
        async function fetchInbox() {
            if (!currentInboxId) {
                showEmptyState();
                return;
            }

            try {
                showLoadingState();
                const response = await fetch('/api/inbox?inboxId=' + encodeURIComponent(currentInboxId));
                const data = await response.json();
                
                if (data.emails) {
                    emails = data.emails;
                    renderEmailList();
                } else {
                    showError('Failed to fetch emails');
                }
            } catch (error) {
                console.error('Error fetching inbox:', error);
                showError('Error fetching emails');
            }
        }

        // Render the email list
        function renderEmailList() {
            if (emails.length === 0) {
                showEmptyState();
                return;
            }

            hideAllStates();
            emailListEl.innerHTML = '';
            
            emails.forEach((email, index) => {
                const emailItem = document.createElement('div');
                emailItem.className = 'email-item p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer';
                
                // Format date
                const date = new Date(email.createdAt);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                emailItem.innerHTML = \`
                    <div class="flex justify-between items-start">
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-900 truncate">\${email.from || 'Unknown Sender'}</p>
                            <p class="text-sm font-medium text-gray-700 truncate">\${email.subject || 'No Subject'}</p>
                            <p class="text-sm text-gray-500 truncate">\${email.bodyPreview || 'No preview'}</p>
                        </div>
                        <p class="text-xs text-gray-500 ml-2 whitespace-nowrap">\${formattedDate}</p>
                    </div>
                \`;
                
                emailItem.addEventListener('click', () => showEmailDetail(index));
                emailListEl.appendChild(emailItem);
            });
        }

        // Show email detail
        function showEmailDetail(index) {
            const email = emails[index];
            
            detailSubject.textContent = email.subject || 'No Subject';
            detailFrom.textContent = 'From: ' + (email.from || 'Unknown Sender');
            
            const date = new Date(email.createdAt);
            detailDate.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            // Process email content
            let content = email.body || 'No content';
            
            // If HTML, create a simple text version
            if (email.isHTML && !email.body.includes('<')) {
                // If it's marked as HTML but doesn't contain HTML tags, it's likely plain text
                content = email.body;
            } else if (email.isHTML) {
                // For HTML emails, we'll display them as-is in an iframe for safety
                detailContent.innerHTML = '<iframe class="w-full h-96 border border-gray-300 rounded" srcdoc="' + content.replace(/"/g, '&quot;') + '"></iframe>';
                emailListEl.classList.add('hidden');
                emailDetailEl.classList.remove('hidden');
                return;
            }
            
            detailContent.innerHTML = '<pre class="whitespace-pre-wrap">' + content + '</pre>';
            
            emailListEl.classList.add('hidden');
            emailDetailEl.classList.remove('hidden');
        }

        // Back to inbox view
        function backToInbox() {
            emailListEl.classList.remove('hidden');
            emailDetailEl.classList.add('hidden');
        }

        // Copy email to clipboard
        function copyEmailToClipboard() {
            if (!currentEmail) return;
            
            navigator.clipboard.writeText(currentEmail)
                .then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    copyBtn.classList.add('bg-green-500', 'hover:bg-green-600');
                    copyBtn.classList.remove('bg-primary', 'hover:bg-indigo-700');
                    
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
                        copyBtn.classList.add('bg-primary', 'hover:bg-indigo-700');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    showError('Failed to copy email address');
                });
        }

        // UI State Helpers
        function showLoadingState() {
            hideAllStates();
            loadingStateEl.classList.remove('hidden');
        }

        function showEmptyState() {
            hideAllStates();
            emptyStateEl.classList.remove('hidden');
        }

        function hideAllStates() {
            loadingStateEl.classList.add('hidden');
            emptyStateEl.classList.add('hidden');
            emailListEl.innerHTML = '';
            emailDetailEl.classList.add('hidden');
        }

        function showError(message) {
            hideAllStates();
            
            const errorEl = document.createElement('div');
            errorEl.className = 'p-4 bg-red-50 border border-red-200 rounded-md';
            errorEl.innerHTML = \`
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-800">\${message}</p>
                    </div>
                </div>
            \`;
            
            emailListEl.appendChild(errorEl);
        }
    </script>
</body>
</html>
`;

/**
 * Main event listener for Cloudflare Worker
 * Handles all incoming requests and routes them appropriately
 */
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - The response to the request
 */
async function handleRequest(request) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return handleCORS();
    }
    
    // Route the request
    if (url.pathname === '/') {
        // Serve the main HTML page
        return new Response(HTML_CONTENT, {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': `public, max-age=${CACHE_TTL}`
            }
        });
    } else if (url.pathname === '/api/new') {
        // Generate a new temporary email
        return handleGenerateEmail();
    } else if (url.pathname === '/api/inbox') {
        // Get emails for a specific inbox
        const inboxId = url.searchParams.get('inboxId');
        if (!inboxId) {
            return new Response(JSON.stringify({ error: 'Inbox ID parameter is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return handleGetInbox(inboxId);
    } else {
        // 404 for unknown routes
        return new Response('Not Found', { status: 404 });
    }
}

/**
 * Handle CORS requests
 * @returns {Response} - CORS response
 */
function handleCORS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

/**
 * Generate a new temporary email address using MailSlurp API
 * @returns {Promise<Response>} - Response with the new email address and inbox ID
 */
async function handleGenerateEmail() {
    try {
        // Call MailSlurp API to create a new inbox
        const response = await fetch(`${MAILSLURP_API_BASE_URL}/inboxes`, {
            method: 'POST',
            headers: {
                'x-api-key': MAILSLURP_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`MailSlurp API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract the email address and inbox ID from the response
        const email = data.emailAddress;
        const inboxId = data.id;
        
        return new Response(JSON.stringify({ email, inboxId }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store' // Don't cache email generation
            }
        });
    } catch (error) {
        console.error('Error generating email:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate email address' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * Get emails for a specific inbox using MailSlurp API
 * @param {string} inboxId - The inbox ID to check
 * @returns {Promise<Response>} - Response with the emails
 */
async function handleGetInbox(inboxId) {
    try {
        // Call MailSlurp API to get emails for the inbox
        const response = await fetch(`${MAILSLURP_API_BASE_URL}/inboxes/${inboxId}/emails`, {
            method: 'GET',
            headers: {
                'x-api-key': MAILSLURP_API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`MailSlurp API error: ${response.status} ${response.statusText}`);
        }
        
        const emails = await response.json();
        
        // Process each email to get the full content
        const processedEmails = await Promise.all(emails.map(async (email) => {
            try {
                // Get the full email content
                const emailResponse = await fetch(`${MAILSLURP_API_BASE_URL}/emails/${email.id}`, {
                    method: 'GET',
                    headers: {
                        'x-api-key': MAILSLURP_API_KEY
                    }
                });
                
                if (emailResponse.ok) {
                    const fullEmail = await emailResponse.json();
                    return {
                        id: email.id,
                        from: fullEmail.from || 'Unknown Sender',
                        subject: fullEmail.subject || 'No Subject',
                        body: fullEmail.body || 'No content',
                        bodyPreview: fullEmail.body?.substring(0, 100) || 'No preview',
                        isHTML: !!fullEmail.html,
                        createdAt: email.createdAt
                    };
                } else {
                    // If we can't get the full email, use the summary data
                    return {
                        id: email.id,
                        from: 'Unknown Sender',
                        subject: 'No Subject',
                        body: 'Content unavailable',
                        bodyPreview: 'Content unavailable',
                        isHTML: false,
                        createdAt: email.createdAt
                    };
                }
            } catch (error) {
                console.error('Error fetching email details:', error);
                return {
                    id: email.id,
                    from: 'Unknown Sender',
                    subject: 'No Subject',
                    body: 'Content unavailable',
                    bodyPreview: 'Content unavailable',
                    isHTML: false,
                    createdAt: email.createdAt
                };
            }
        }));
        
        return new Response(JSON.stringify({ emails: processedEmails }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': `public, max-age=${CACHE_TTL}`
            }
        });
    } catch (error) {
        console.error('Error fetching inbox:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch emails' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
