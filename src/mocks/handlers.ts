/**
 * MSW v2 request handlers.
 *
 * Every handler delegates to mockApi so the same in-memory state, delay
 * logic, and business rules are shared between the "USE_MOCK=true" path
 * and the MSW-intercepted axios path (USE_MOCK=false).
 *
 * Base URL is kept in sync with the axios instance in src/services/api.ts.
 */
import { http, HttpResponse } from 'msw';
import { mockApi } from '../services/mockApi';
import {
  mockAccessRequests,
} from '../data/mockData';
import type { User } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Return a 404 JSON response. */
const notFound = (message = 'Not found') =>
  HttpResponse.json({ message }, { status: 404 });

/** Return a 400 JSON response. */
const badRequest = (message: string) =>
  HttpResponse.json({ message }, { status: 400 });

/** Return a 401 JSON response. */
const unauthorized = (message = 'Unauthorized') =>
  HttpResponse.json({ message }, { status: 401 });

// ─── handlers ───────────────────────────────────────────────────────────────

export const handlers = [

  // ══════════════════════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════════════════════

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return badRequest('Email and password are required');
    }
    try {
      const data = await mockApi.login(body.email, body.password);
      return HttpResponse.json(data);
    } catch (err: any) {
      return unauthorized(err.message ?? 'Invalid credentials');
    }
  }),

  http.post(`${BASE}/auth/logout`, async () => {
    const data = await mockApi.logout();
    return HttpResponse.json(data);
  }),

  http.post(`${BASE}/auth/request-access`, async ({ request }) => {
    const body = await request.json();
    const data = await mockApi.requestAccess(body);
    return HttpResponse.json(data);
  }),

  http.post(`${BASE}/auth/activate`, async ({ request }) => {
    const body = await request.json() as { token?: string; password?: string };
    if (!body.token || !body.password) {
      return badRequest('Token and password are required');
    }
    const data = await mockApi.activateAccount(body.token, body.password);
    return HttpResponse.json(data);
  }),

  // ══════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/dashboard/stats`, async () => {
    const data = await mockApi.getDashboardStats();
    return HttpResponse.json(data);
  }),

  http.get(`${BASE}/dashboard/health-distribution`, async () => {
    const data = await mockApi.getHealthDistribution();
    return HttpResponse.json(data);
  }),

  http.get(`${BASE}/dashboard/failure-trend`, async ({ request }) => {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') ?? 'monthly';
    const data = await mockApi.getFailureTrend(period);
    return HttpResponse.json(data);
  }),

  http.get(`${BASE}/dashboard/sensor-trends`, async () => {
    const data = await mockApi.getSensorTrends();
    return HttpResponse.json(data);
  }),

  http.get(`${BASE}/dashboard/ai-insights`, async () => {
    const data = await mockApi.getAIInsights();
    return HttpResponse.json(data);
  }),

  // ══════════════════════════════════════════════════════
  // MACHINES
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/machines`, async ({ request }) => {
    const url = new URL(request.url);
    const filters = {
      type:     url.searchParams.get('type')     ?? undefined,
      location: url.searchParams.get('location') ?? undefined,
      status:   url.searchParams.get('status')   ?? undefined,
      search:   url.searchParams.get('search')   ?? undefined,
    };
    const data = await mockApi.getMachines(filters);
    return HttpResponse.json(data);
  }),

  // /machines/add would be caught by /:id — order matters: specific before param
  http.get(`${BASE}/machines/:id`, async ({ params }) => {
    try {
      const data = await mockApi.getMachineById(params.id as string);
      return HttpResponse.json(data);
    } catch {
      return notFound('Machine not found');
    }
  }),

  http.post(`${BASE}/machines`, async ({ request }) => {
    const body = await request.json();
    const data = await mockApi.createMachine(body);
    return HttpResponse.json(data, { status: 201 });
  }),

  http.put(`${BASE}/machines/:id`, async ({ params, request }) => {
    const body = await request.json();
    try {
      const data = await mockApi.updateMachine(params.id as string, body);
      return HttpResponse.json(data);
    } catch {
      return notFound('Machine not found');
    }
  }),

  http.delete(`${BASE}/machines/:id`, async ({ params }) => {
    await mockApi.deleteMachine(params.id as string);
    return HttpResponse.json({ success: true });
  }),

  http.get(`${BASE}/machines/:id/sensor-history`, async ({ params, request }) => {
    const url = new URL(request.url);
    const hours = Number(url.searchParams.get('hours') ?? 24);
    const data = await mockApi.getMachineSensorHistory(params.id as string, hours);
    return HttpResponse.json(data);
  }),

  // ══════════════════════════════════════════════════════
  // WORK ORDERS
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/work-orders`, async ({ request }) => {
    const url = new URL(request.url);
    const filters = {
      status:      url.searchParams.get('status')      ?? undefined,
      priority:    url.searchParams.get('priority')    ?? undefined,
      assigned_to: url.searchParams.get('assigned_to')
        ? Number(url.searchParams.get('assigned_to'))
        : undefined,
    };
    const data = await mockApi.getWorkOrders(filters);
    return HttpResponse.json(data);
  }),

  http.get(`${BASE}/work-orders/:id`, async ({ params }) => {
    try {
      const data = await mockApi.getWorkOrderById(params.id as string);
      return HttpResponse.json(data);
    } catch {
      return notFound('Work order not found');
    }
  }),

  http.post(`${BASE}/work-orders`, async ({ request }) => {
    const body = await request.json();
    const data = await mockApi.createWorkOrder(body);
    return HttpResponse.json(data, { status: 201 });
  }),

  http.put(`${BASE}/work-orders/:id`, async ({ params, request }) => {
    const body = await request.json();
    try {
      const data = await mockApi.updateWorkOrder(params.id as string, body);
      return HttpResponse.json(data);
    } catch {
      return notFound('Work order not found');
    }
  }),

  // Also handle PATCH in case consumers use REST-style partial update
  http.patch(`${BASE}/work-orders/:id`, async ({ params, request }) => {
    const body = await request.json();
    try {
      const data = await mockApi.updateWorkOrder(params.id as string, body);
      return HttpResponse.json(data);
    } catch {
      return notFound('Work order not found');
    }
  }),

  http.delete(`${BASE}/work-orders/:id`, async ({ params }) => {
    await mockApi.deleteWorkOrder(params.id as string);
    return HttpResponse.json({ success: true });
  }),

  http.post(`${BASE}/work-orders/:id/notes`, async ({ params, request }) => {
    const body = await request.json();
    try {
      const data = await mockApi.addWorkOrderNote(params.id as string, body);
      return HttpResponse.json(data, { status: 201 });
    } catch {
      return notFound('Work order not found');
    }
  }),

  // ══════════════════════════════════════════════════════
  // ALERTS
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/alerts`, async ({ request }) => {
    const url = new URL(request.url);
    const filters = {
      severity:     url.searchParams.get('severity')     ?? undefined,
      acknowledged:
        url.searchParams.get('acknowledged') !== null
          ? url.searchParams.get('acknowledged') === 'true'
          : undefined,
    };
    const data = await mockApi.getAlerts(filters);
    return HttpResponse.json(data);
  }),

  http.put(`${BASE}/alerts/:id/acknowledge`, async ({ params, request }) => {
    const body = await request.json() as { user?: string };
    try {
      const data = await mockApi.acknowledgeAlert(params.id as string, body.user ?? 'Unknown');
      return HttpResponse.json(data);
    } catch {
      return notFound('Alert not found');
    }
  }),

  // PATCH variant for semantic correctness
  http.patch(`${BASE}/alerts/:id/acknowledge`, async ({ params, request }) => {
    const body = await request.json() as { user?: string };
    try {
      const data = await mockApi.acknowledgeAlert(params.id as string, body.user ?? 'Unknown');
      return HttpResponse.json(data);
    } catch {
      return notFound('Alert not found');
    }
  }),

  // ══════════════════════════════════════════════════════
  // USERS
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/users`, async () => {
    const data = await mockApi.getUsers();
    return HttpResponse.json(data);
  }),

  http.get(`${BASE}/users/:id`, async ({ params }) => {
    try {
      const data = await mockApi.getUserById(params.id as string);
      return HttpResponse.json(data);
    } catch {
      return notFound('User not found');
    }
  }),

  http.post(`${BASE}/users`, async ({ request }) => {
    const body = await request.json();
    const data = await mockApi.createUser(body);
    return HttpResponse.json(data, { status: 201 });
  }),

  http.put(`${BASE}/users/:id`, async ({ params, request }) => {
    const body = await request.json();
    try {
      const data = await mockApi.updateUser(params.id as string, body);
      return HttpResponse.json(data);
    } catch {
      return notFound('User not found');
    }
  }),

  http.delete(`${BASE}/users/:id`, async ({ params }) => {
    await mockApi.deleteUser(params.id as string);
    return HttpResponse.json({ success: true });
  }),

  http.post(`${BASE}/users/invite`, async ({ request }) => {
    const body = await request.json();
    const data = await mockApi.inviteUser(body);
    return HttpResponse.json(data, { status: 201 });
  }),

  http.patch(`${BASE}/users/:id/avatar`, async ({ params, request }) => {
    const body = await request.json() as { avatar?: string; _session?: User };
    if (!body.avatar) {
      return badRequest('avatar field is required');
    }
    try {
      // Pass _session so mockApi can recover a dynamic user that was lost after page refresh
      const data = await mockApi.updateAvatar(params.id as string, body.avatar, body._session);
      return HttpResponse.json(data);
    } catch {
      return notFound('User not found');
    }
  }),

  // ══════════════════════════════════════════════════════
  // COMPANY / SETTINGS
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/company`, async () => {
    const data = await mockApi.getCompanySettings();
    return HttpResponse.json(data);
  }),

  http.put(`${BASE}/company`, async ({ request }) => {
    const body = await request.json();
    const data = await mockApi.updateCompanySettings(body);
    return HttpResponse.json(data);
  }),

  http.post(`${BASE}/company/complete-setup`, async () => {
    const data = await mockApi.completeSetup();
    return HttpResponse.json(data);
  }),

  // ══════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/notifications`, async () => {
    const data = await mockApi.getNotifications();
    return HttpResponse.json(data);
  }),

  http.put(`${BASE}/notifications/read-all`, async () => {
    const data = await mockApi.markAllNotificationsRead();
    return HttpResponse.json(data);
  }),

  http.put(`${BASE}/notifications/:id/read`, async ({ params }) => {
    const data = await mockApi.markNotificationRead(params.id as string);
    return HttpResponse.json(data);
  }),

  // ══════════════════════════════════════════════════════
  // REPORTS
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/reports`, async () => {
    const data = await mockApi.getReportsData();
    return HttpResponse.json(data);
  }),

  // ══════════════════════════════════════════════════════
  // MAINTENANCE CALENDAR
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/maintenance/events`, async ({ request }) => {
    const url = new URL(request.url);
    const month = Number(url.searchParams.get('month') ?? new Date().getMonth() + 1);
    const year  = Number(url.searchParams.get('year')  ?? new Date().getFullYear());
    const data = await mockApi.getMaintenanceEvents(month, year);
    return HttpResponse.json(data);
  }),

  // ══════════════════════════════════════════════════════
  // ACCESS REQUESTS
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/access-requests`, async () => {
    // Small artificial delay to mimic real network
    await new Promise((r) => setTimeout(r, 350));
    return HttpResponse.json(mockAccessRequests);
  }),

  // ══════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════

  http.post(`${BASE}/export/pdf`, async ({ request }) => {
    const body = await request.json() as { type?: string; id?: string | number };
    const data = await mockApi.exportPDF(body.type ?? 'unknown', body.id ?? 0);
    return HttpResponse.json(data);
  }),

  // ══════════════════════════════════════════════════════
  // SETTINGS — ASSET TYPES
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/settings/asset-types`, async () => {
    const data = await mockApi.getAssetTypes();
    return HttpResponse.json(data);
  }),

  http.post(`${BASE}/settings/asset-types`, async ({ request }) => {
    const body = await request.json();
    const data = await mockApi.createAssetType(body);
    return HttpResponse.json(data, { status: 201 });
  }),

  http.put(`${BASE}/settings/asset-types/:id`, async ({ params, request }) => {
    const body = await request.json();
    const data = await mockApi.updateAssetType(Number(params.id), body);
    return HttpResponse.json(data);
  }),

  http.delete(`${BASE}/settings/asset-types/:id`, async ({ params }) => {
    await mockApi.deleteAssetType(Number(params.id));
    return HttpResponse.json({ success: true });
  }),

  // ══════════════════════════════════════════════════════
  // SETTINGS — SENSOR THRESHOLDS
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/settings/sensor-thresholds`, async () => {
    const data = await mockApi.getSensorThresholds();
    return HttpResponse.json(data);
  }),

  http.post(`${BASE}/settings/sensor-thresholds`, async ({ request }) => {
    const body = await request.json();
    const data = await mockApi.createSensorThreshold(body);
    return HttpResponse.json(data, { status: 201 });
  }),

  http.put(`${BASE}/settings/sensor-thresholds/:id`, async ({ params, request }) => {
    const body = await request.json();
    const data = await mockApi.updateSensorThreshold(Number(params.id), body);
    return HttpResponse.json(data);
  }),

  http.delete(`${BASE}/settings/sensor-thresholds/:id`, async ({ params }) => {
    await mockApi.deleteSensorThreshold(Number(params.id));
    return HttpResponse.json({ success: true });
  }),

  // ══════════════════════════════════════════════════════
  // SETTINGS — AI MODEL
  // ══════════════════════════════════════════════════════

  http.get(`${BASE}/settings/ai-model`, async () => {
    const data = await mockApi.getAIModelInfo();
    return HttpResponse.json(data);
  }),

  http.post(`${BASE}/settings/ai-model/retrain`, async () => {
    const data = await mockApi.retrainAIModel();
    return HttpResponse.json(data);
  }),

  http.post(`${BASE}/settings/ai-model/schedule`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const data = await mockApi.scheduleTraining(body);
    return HttpResponse.json(data);
  }),
];
