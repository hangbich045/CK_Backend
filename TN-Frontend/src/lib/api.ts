import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getHeaders(isMultipart = false) {
    const headers: HeadersInit = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    const token = Cookies.get('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      const errorObj = new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage) as any;
      errorObj.statusCode = response.status;
      if (data && typeof data === 'object') {
        Object.assign(errorObj, data);
      }
      throw errorObj;
    }

    return data;
  }

  async get(endpoint: string) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async post(endpoint: string, body: FormData | unknown, isMultipart = false) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(isMultipart),
      body: isMultipart ? (body as FormData) : JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  async put(endpoint: string, body: unknown) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  async patch(endpoint: string, body: unknown) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  async delete(endpoint: string) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const api = new ApiClient();
export default api;
