const DEFAULT_API_BASE_URL = 'http://localhost:3000/v1';

/** URL base de la API, ya incluye /v1. Se configura con VITE_API_BASE_URL. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
