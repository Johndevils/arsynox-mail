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
let currentEmail = '';
let emails = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Try to get existing email from localStorage
    const savedEmail = localStorage.getItem('arsynoxEmail');
    if (savedEmail) {
        currentEmail = savedEmail;
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
        
        if (data.email) {
            currentEmail = data.email;
            emailAddressEl.value = currentEmail;
            localStorage.setItem('arsynoxEmail', currentEmail);
            
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
    if (!currentEmail) {
        showEmptyState();
        return;
    }

    try {
        showLoadingState();
        const response = await fetch(`/api/inbox?email=${encodeURIComponent(currentEmail)}`);
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
        const date = new Date(email.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        emailItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 truncate">${email.from || 'Unknown Sender'}</p>
                    <p class="text-sm font-medium text-gray-700 truncate">${email.subject || 'No Subject'}</p>
                    <p class="text-sm text-gray-500 truncate">${email.preview || email.text?.substring(0, 100) || 'No preview'}</p>
                </div>
                <p class="text-xs text-gray-500 ml-2 whitespace-nowrap">${formattedDate}</p>
            </div>
        `;
        
        emailItem.addEventListener('click', () => showEmailDetail(index));
        emailListEl.appendChild(emailItem);
    });
}

// Show email detail
function showEmailDetail(index) {
    const email = emails[index];
    
    detailSubject.textContent = email.subject || 'No Subject';
    detailFrom.textContent = `From: ${email.from || 'Unknown Sender'}`;
    
    const date = new Date(email.date);
    detailDate.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    // Simple text processing for the email content
    let content = email.text || email.html || 'No content';
    
    // If HTML, create a simple text version
    if (email.html && !email.text) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = email.html;
        content = tempDiv.textContent || tempDiv.innerText || 'No content';
    }
    
    detailContent.innerHTML = `<pre class="whitespace-pre-wrap">${content}</pre>`;
    
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
    errorEl.innerHTML = `
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <p class="text-sm text-red-800">${message}</p>
            </div>
        </div>
    `;
    
    emailListEl.appendChild(errorEl);
}
