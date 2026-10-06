import type { Api } from "./types";
import { mockApi } from "./mock";

/**
 * Single switch-point for the data layer.
 * To connect a real backend, implement `Api` in ./http.ts
 * (fetch calls to FastAPI / Spring Boot) and export it here instead.
 */
export const api: Api = mockApi;
export { resetDemoData } from "./mock";
