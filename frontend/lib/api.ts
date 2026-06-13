const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`API GET request failed: ${response.statusText}`);
    }
    return response.json();
  },

  post: async (endpoint: string, data: any, isFormData: boolean = false) => {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API POST request failed: ${response.statusText}`);
    }
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API PUT request failed: ${response.statusText}`);
    }
    return response.json();
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`API DELETE request failed: ${response.statusText}`);
    }
    return response.json();
  },
};
