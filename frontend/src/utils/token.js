const KEY = "auth_token";

export const saveToken = (token) => localStorage.setItem(KEY, token);
export const getToken = () => localStorage.getItem(KEY);
export const clearToken = () => localStorage.removeItem(KEY);