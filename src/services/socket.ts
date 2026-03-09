// Mock WebSocket for real-time sensor updates

type SocketCallback = (data: any) => void;

interface SensorData {
  [key: string]: number;
}

interface MachineUpdate {
  machine_id: number;
  asset_id: string;
  sensors: SensorData;
  timestamp: string;
}

interface AlertUpdate {
  id: number;
  type: string;
  severity: string;
  machine_id: number;
  message: string;
  timestamp: string;
}

class MockSocket {
  private listeners: Record<string, SocketCallback[]>;
  private connected: boolean;
  private intervalId: ReturnType<typeof setInterval> | null;

  constructor() {
    this.listeners = {};
    this.connected = false;
    this.intervalId = null;
  }

  connect(): void {
    if (this.connected) return;

    this.connected = true;
    console.log('Mock Socket connected');

    // Simulate real-time sensor updates every 3 seconds
    this.intervalId = setInterval(() => {
      // Machine sensor updates
      const machineUpdates: MachineUpdate[] = [
        {
          machine_id: 1,
          asset_id: 'CNC-001',
          sensors: {
            temperature: 70 + Math.random() * 5,
            vibration: 0.18 + Math.random() * 0.1,
            pressure: 95 + Math.random() * 5,
            rpm: 3450 + Math.random() * 100,
          },
          timestamp: new Date().toISOString(),
        },
        {
          machine_id: 2,
          asset_id: 'PUMP-023',
          sensors: {
            temperature: 83 + Math.random() * 5,
            vibration: 0.75 + Math.random() * 0.15,
            pressure: 100 + Math.random() * 5,
            flow_rate: 43 + Math.random() * 5,
          },
          timestamp: new Date().toISOString(),
        },
        {
          machine_id: 3,
          asset_id: 'ENGINE-012',
          sensors: {
            temperature: 90 + Math.random() * 5,
            vibration: 1.1 + Math.random() * 0.2,
            pressure: 108 + Math.random() * 5,
            rpm: 1780 + Math.random() * 50,
          },
          timestamp: new Date().toISOString(),
        },
      ];

      // Emit updates for each machine
      machineUpdates.forEach((update) => {
        this.emit('machine_update', update);
      });

      // Occasionally emit alerts (10% chance)
      if (Math.random() < 0.1) {
        const alert: AlertUpdate = {
          id: Date.now(),
          type: 'threshold',
          severity: Math.random() > 0.5 ? 'warning' : 'critical',
          machine_id: machineUpdates[Math.floor(Math.random() * machineUpdates.length)].machine_id,
          message: 'Sensor threshold exceeded',
          timestamp: new Date().toISOString(),
        };
        this.emit('new_alert', alert);
      }
    }, 3000);

    this.emit('connected', { status: 'connected' });
  }

  disconnect(): void {
    if (!this.connected) return;

    this.connected = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Mock Socket disconnected');
    this.emit('disconnected', { status: 'disconnected' });
  }

  on(event: string, callback: SocketCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: SocketCallback): void {
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  emit(event: string, data: any): void {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in socket listener for ${event}:`, error);
      }
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
let socketInstance: MockSocket | null = null;

export const getSocket = (): MockSocket => {
  if (!socketInstance) {
    socketInstance = new MockSocket();
  }
  return socketInstance;
};

export const connectSocket = (): MockSocket => {
  const socket = getSocket();
  socket.connect();
  return socket;
};

export const disconnectSocket = (): void => {
  const socket = getSocket();
  socket.disconnect();
};

export default {
  getSocket,
  connectSocket,
  disconnectSocket,
};
