import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  timeout: 20000
});

export const toChartData = (input: Record<string, number>) =>
  Object.entries(input ?? {}).map(([name, value]) => ({ name, value }));

export function friendlyMessage(message?: string) {
  if (!message) return 'The service is temporarily unavailable. Please retry.';
  if (message.includes('cannot unmarshal') || message.includes('schema')) {
    return 'External GDC ingestion had a schema mismatch. Seeded TCGA demo data remains available.';
  }
  if (message.includes('Network Error') || message.includes('timeout')) {
    return 'The API service is not reachable yet. Confirm Docker Compose is running and retry.';
  }
  return message;
}

export function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
