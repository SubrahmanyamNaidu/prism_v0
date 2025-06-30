
import { toast } from '@/hooks/use-toast';

export const handleUnauthorized = () => {
  // Clear stored tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_type');
  
  toast({
    title: "Session expired",
    description: "You have been logged out. Please sign in again.",
    variant: "destructive"
  });
  
  // Redirect to sign in page
  window.location.href = '/signin';
};

export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  const tokenType = localStorage.getItem('token_type');
  const connectedDatabaseId = localStorage.getItem('connected_database_id');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token && tokenType) {
    headers['Authorization'] = `${tokenType} ${token}`;
  }
  
  // Skip adding database ID for endpoints that don't need it
  const skipDatabaseId = url.includes('/connected-dbs') || url.includes('/login') || url.includes('/user');
  
  // Add database ID to request body if it exists and endpoint needs it
  let body = options.body;
  if (connectedDatabaseId && options.method !== 'GET' && !skipDatabaseId) {
    const bodyData = body ? JSON.parse(body as string) : {};
    bodyData.database_id = connectedDatabaseId;
    body = JSON.stringify(bodyData);
  }
  
  // Add database ID as query parameter for GET requests (except for endpoints that don't need it)
  if (connectedDatabaseId && options.method === 'GET' && !skipDatabaseId) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}database_id=${connectedDatabaseId}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });
  
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }
  
  return response;
};
