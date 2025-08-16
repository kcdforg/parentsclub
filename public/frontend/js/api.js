const apiBaseUrl = '../backend/';

export async function apiFetch(endpoint, options = {}) {
    const sessionToken = localStorage.getItem('user_session_token');
    const headers = {
        ...options.headers,
    };

    if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, {
            ...options,
            headers: headers,
            body: options.body instanceof URLSearchParams ? JSON.stringify(Object.fromEntries(options.body)) : options.body
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle specific HTTP errors
            if (response.status === 401) {
                // Unauthorized - session expired or invalid
                localStorage.removeItem('user_session_token');
                localStorage.removeItem('user_data');
                window.location.href = 'login.php';
                throw new Error('Unauthorized: Session expired or invalid');
            } else if (response.status === 403) {
                // Forbidden - not enough permissions
                throw new Error(data.error || 'Forbidden: You do not have permission to perform this action.');
            } else if (response.status === 404) {
                // Not Found
                throw new Error(data.error || 'Resource not found.');
            } else if (response.status === 400) {
                // Bad Request - client-side error
                throw new Error(data.error || 'Bad request: Please check your input.');
            } else if (response.status === 500) {
                // Internal Server Error
                throw new Error(data.error || 'Server error: Something went wrong on the server.');
            } else {
                // Generic HTTP error
                throw new Error(data.error || `HTTP error! Status: ${response.status}`);
            }
        }

        return data;

    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}
