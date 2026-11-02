/** Response returned by GET /api/health. */
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}
