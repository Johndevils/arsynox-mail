// Import the index.html file as a string.
// This line must be at the top level of the module.
import indexHTML from './index.html';

// Configuration for MailSlurp API
// IMPORTANT: Replace with your actual API key when deploying.
// For production, it's highly recommended to use Wrangler secrets:
// wrangler secret put MAILSLURP_API_KEY
const MAILSLURP_API_KEY = 'your-mailslurp-api-key-here'; 
const MAILSLURP_API_BASE_URL = 'https://api.mailslurp.com';

// Cache configuration for static assets
const CACHE_TTL = 30; // seconds

/**
 * =================================================================
 *                      ROUTING LOGIC START
 * =================================================================
 */

/**
 * Main event listener for the Cloudflare Worker.
 * This function intercepts every incoming request to your worker's URL.
 */
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

/**
 * The main request handler and router.
 * It inspects the incoming request and directs it to the appropriate handler.
 * @param {Request} request - The incoming request object.
 * @returns {Promise<Response>} - The response to be sent back to the client.
 */
async function handleRequest(request) {
    const url = new URL(request.url);
    
    // ROUTE 1: Handle CORS preflight requests.
    // Browsers send these before making cross-origin API calls.
    if (request.method === 'OPTIONS') {
        return handleCORS();
    }
    
    // ROUTE 2: Serve the Frontend ONLY at the /index.html path.
    // This is the ONLY path that will serve the HTML file.
    if (url.pathname === '/index.html') {
        return serveFrontend();
    }
    
    // ROUTE 3: Handle API Endpoints.
    // These routes handle the backend logic for the application.
    if (url.pathname.startsWith('/api/')) {
        return handleApiRoute(request, url);
    }
    
    // ROUTE 4: Fallback for all other paths, including the root "/".
    // If no route matches, return a 404 Not Found error.
    return new Response('Not Found', { status: 404 });
}

/**
 * Handles all routes starting with /api/
 * @param {Request} request - The incoming request object.
 * @param {URL} url - The parsed URL object.
 * @returns {Promise<Response>} - The response from the specific API handler.
 */
function handleApiRoute(request, url) {
    // API Route for generating a new temporary email.
    if (url.pathname === '/api/new' && request.method === 'GET') {
        return handleGenerateEmail();
    }
    
    // API Route for fetching emails for a specific inbox.
    // It requires an 'inboxId' query parameter.
    if (url.pathname === '/api/inbox' && request.method === 'GET') {
        const inboxId = url.searchParams.get('inboxId');
        if (!inboxId) {
            // If the required parameter is missing, return a 400 Bad Request error.
            return jsonResponse({ error: 'Inbox ID parameter is required' }, 400);
        }
        return handleGetInbox(inboxId);
    }
    
    // If the path starts with /api/ but doesn't match any known API route, return 404.
    return new Response('API endpoint not found', { status: 404 });
}

/**
 * =================================================================
 *                      ROUTING LOGIC END
 * =================================================================
 */

/**
 * =================================================================
 *                    HANDLER FUNCTIONS START
 * =================================================================
 */

/**
 * Serves the main frontend HTML page from the imported file.
 * @returns {Response} - The HTML content for the frontend.
 */
async function serveFrontend() {
    return new Response(indexHTML, {
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': `public, max-age=${CACHE_TTL}`
        }
    });
}

/**
 * Handles CORS preflight requests.
 * @returns {Response} - A response with the correct CORS headers.
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
 * Generates a new temporary email address using the MailSlurp API.
 * @returns {Promise<Response>} - A JSON response containing the new email and inbox ID.
 */
async function handleGenerateEmail() {
    try {
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
        const email = data.emailAddress;
        const inboxId = data.id;
        
        return jsonResponse({ email, inboxId }, 200, { 'Cache-Control': 'no-store' });
    } catch (error) {
        console.error('Error generating email:', error);
        return jsonResponse({ error: 'Failed to generate email address' }, 500);
    }
}

/**
 * Fetches emails for a specific inbox using the MailSlurp API.
 * @param {string} inboxId - The ID of the inbox to check.
 * @returns {Promise<Response>} - A JSON response containing the list of emails.
 */
async function handleGetInbox(inboxId) {
    try {
        const response = await fetch(`${MAILSLURP_API_BASE_URL}/inboxes/${inboxId}/emails`, {
            method: 'GET',
            headers: { 'x-api-key': MAILSLURP_API_KEY }
        });
        
        if (!response.ok) {
            throw new Error(`MailSlurp API error: ${response.status} ${response.statusText}`);
        }
        
        const emails = await response.json();
        
        const processedEmails = await Promise.all(emails.map(async (email) => {
            try {
                const emailResponse = await fetch(`${MAILSLURP_API_BASE_URL}/emails/${email.id}`, {
                    method: 'GET',
                    headers: { 'x-api-key': MAILSLURP_API_KEY }
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
                    return createFallbackEmail(email);
                }
            } catch (error) {
                console.error('Error fetching email details:', error);
                return createFallbackEmail(email);
            }
        }));
        
        return jsonResponse({ emails: processedEmails }, 200);
    } catch (error) {
        console.error('Error fetching inbox:', error);
        return jsonResponse({ error: 'Failed to fetch emails' }, 500);
    }
}

/**
 * =================================================================
 *                     HANDLER FUNCTIONS END
 * =================================================================
 */

/**
 * =================================================================
 *                      HELPER FUNCTIONS START
 * =================================================================
 */

/**
 * Creates a fallback email object when fetching details fails.
 * @param {object} email - The basic email object from the list.
 * @returns {object} - A standardized email object.
 */
function createFallbackEmail(email) {
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

/**
 * Helper function to create a JSON response with standard headers.
 * @param {object} data - The data to stringify.
 * @param {number} status - The HTTP status code.
 * @param {object} extraHeaders - Any additional headers to include.
 * @returns {Response} - The formatted Response object.
 */
function jsonResponse(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            ...extraHeaders
        }
    });
}

/**
 * =================================================================
 *                      HELPER FUNCTIONS END
 * =================================================================
 */
