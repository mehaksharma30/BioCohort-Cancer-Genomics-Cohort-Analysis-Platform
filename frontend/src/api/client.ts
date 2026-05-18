import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  timeout: 20000
});

export const toChartData = (input: Record<string, number>) =>
  Object.entries(input ?? {}).map(([name, value]) => ({ name, value }));
