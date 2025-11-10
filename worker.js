// Import the index.html file as a string.
// This line must be at the top level of the module.
import indexHTML from './index.html';

// Configuration for api.mail.tm
// This API does not require an API key for basic usage.
const MAIL_TM_API_BASE_URL = 'https://api.mail.tm';

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
    if (request.method === 'OPTIONS') {
        return handleCORS();
    }
    
    // ROUTE 2: Serve the Frontend ONLY at the /index.html path.
    if (url.pathname === '/index.html') {
        return serveFrontend();
    }
    
    // ROUTE 3: Handle API Endpoints.
    if (url.pathname.startsWith('/api/')) {
        return handleApiRoute(request, url);
    }
    
    // ROUTE 4: Fallback for all other paths, including the root "/".
    return new Response('Not Found', { status: 404 });
}

/**
 * Handles all routes starting with /api/
 * @param {Request} request - The incoming request object.
 * @param {URL} url - The parsed URL object.
 * @returns {Promise<Response>} - The response from the specific API handler.
 */
function handleApiRoute(request, url) {
    if (url.pathname === '/api/new' && request.method === 'GET') {
        return handleGenerateEmail();
    }
    
    if (url.pathname === '/api/inbox' && request.method === 'GET') {
        const inboxId = url.searchParams.get('inboxId');
        if (!inboxId) {
            return jsonResponse({ error: 'Inbox ID (token) parameter is required' }, 400);
        }
        return handleGetInbox(inboxId);
    }
    
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
 * Generates a new temporary email address using the api.mail.tm API.
 * @returns {Promise<Response>} - A JSON response containing the new email and inbox token.
 */
async function handleGenerateEmail() {
    try {
        console.log('Attempting to create a new temporary email with api.mail.tm...');
        
        // Step 1: Get a list of available domains
        const domainsResponse = await fetch(`${MAIL_TM_API_BASE_URL}/domains`);
        if (!domainsResponse.ok) {
            throw new Error(`Failed to fetch domains: ${domainsResponse.status} ${domainsResponse.statusText}`);
        }
        
        // FIX: Handle the API response more robustly
        const domainsData = await domainsResponse.json();
        const domains = domainsData.hyphenated || domainsData; // Fallback to main object if hyphenated is not present

        if (!domains || !Array.isArray(domains) || domains.length === 0) {
            // Log the actual response from the API to help debug further if needed
            console.error('Domains response from API:', JSON.stringify(domainsData)); 
            throw new Error('No available domains from api.mail.tm.');
        }
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];

        // Step 2: Create a new account (inbox)
        const accountResponse = await fetch(`${MAIL_TM_API_BASE_URL}/v1/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: `user-${Math.random().toString(36).substring(2, 8)}`,
                domain: randomDomain
            })
        });

        if (!accountResponse.ok) {
            const errorBody = await accountResponse.text();
            console.error(`api.mail.tm Account Creation Error Body: ${errorBody}`);
            throw new Error(`Failed to create account: ${accountResponse.status} ${accountResponse.statusText}. Body: ${errorBody}`);
        }

        const accountData = await accountResponse.json();
        
        // Step 3: Get the JWT token for the account to fetch messages
        const authResponse = await fetch(`${MAIL_TM_API_BASE_URL}/v1/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: accountData.address,
                password: accountData.password
            })
        });

        if (!authResponse.ok) {
            throw new Error(`Failed to authenticate new account: ${authResponse.status} ${authResponse.statusText}`);
        }

        const { token } = await authResponse.json();

        console.log(`Successfully created inbox: ${accountData.address} with token: ${token}`);

        return jsonResponse({ 
            email: accountData.address, 
            inboxId: token // Use the JWT token as the inboxId for fetching
        }, 200, { 'Cache-Control': 'no-store' });

    } catch (error) {
        console.error('Error generating email:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

/**
 * Fetches emails for a specific inbox using the api.mail.tm API.
 * @param {string} inboxId - The JWT token of the inbox to check.
 * @returns {Promise<Response>} - A JSON response containing the list of emails.
 */
async function handleGetInbox(inboxId) {
    try {
        console.log(`Fetching messages for inboxId (token): ${inboxId.substring(0, 10)}...`);
        
        const response = await fetch(`${MAIL_TM_API_BASE_URL}/v1/messages`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${inboxId}` }
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`api.mail.tm Fetch Messages Error Body: ${errorBody}`);
            throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}. Body: ${errorBody}`);
        }
        
        const messages = await response.json();
        
        // The api.mail.tm message list doesn't include body content, so we need to fetch each one.
        const processedEmails = await Promise.all(messages.map(async (message) => {
            try {
                const messageResponse = await fetch(`${MAIL_TM_API_BASE_URL}/v1/messages/${message.id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${inboxId}` }
                });

                if (messageResponse.ok) {
                    const fullEmail = await messageResponse.json();
                    return {
                        id: fullEmail.id,
                        from: fullEmail.from || 'Unknown Sender',
                        subject: fullEmail.subject || 'No Subject',
                        body: fullEmail.text || fullEmail.html || 'No content',
                        bodyPreview: (fullEmail.text || fullEmail.html || 'No content').substring(0, 100),
                        isHTML: !!fullEmail.html,
                        createdAt: fullEmail.createdAt
                    };
                } else {
                    return createFallbackEmail(message);
                }
            } catch (error) {
                console.error('Error fetching email details:', error);
                return createFallbackEmail(message);
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
