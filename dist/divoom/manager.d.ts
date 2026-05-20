import type { DivoomStatus, ConnectionState, DeviceInfo, DivoomConfig } from './types';
/**
 * DivoomManager simulates controlling a Divoom Pixoo-64 display.
 *
 * In v1 the class logs status changes to the console. A future version
 * will send real UDP commands to the physical device.
 */
export declare class DivoomManager {
    private _connectionState;
    private _deviceInfo;
    private config;
    private reconnectAttempts;
    private reconnectTimer;
    constructor(config?: DivoomConfig);
    /** Simulate connecting to the Divoom device. */
    connect(): Promise<DeviceInfo>;
    /** Disconnect from the Divoom device. */
    disconnect(): Promise<void>;
    /** Send a status update to the display (simulated via console). */
    updateStatus(status: DivoomStatus): Promise<void>;
    /** Whether the manager is currently connected to the device. */
    isConnected(): boolean;
    /** The current connection state. */
    get connectionState(): ConnectionState;
    /** Connected device info (null if not connected). */
    get deviceInfo(): DeviceInfo | null;
    /** Attempt to reconnect after a disconnection. */
    reconnect(): Promise<DeviceInfo>;
    /** Schedule an automatic reconnection attempt. */
    scheduleReconnect(): void;
    private clearReconnectTimer;
}
//# sourceMappingURL=manager.d.ts.map