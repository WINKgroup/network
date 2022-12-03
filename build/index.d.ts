/// <reference types="node" />
import { EventEmitter } from 'node:events';
import ConsoleLog from '@winkgroup/console-log';
export declare enum InternetAccessState {
    ONLINE = "online",
    OFFLINE = "offline",
    CHECKING = "checking",
    UNKNOWN = "unknown"
}
export interface NetworkParams {
    ip: string;
    port: number;
    publicBaseurlTemplate: string;
}
export default class Network extends EventEmitter {
    params: NetworkParams;
    private publicIp;
    private publicBaseUrl;
    private internetAccessState;
    private cronManager;
    consoleLog: ConsoleLog;
    private static singleton;
    private constructor();
    static get(inputParams?: Partial<NetworkParams>): Network;
    getBaseUrl(): string;
    getNetworkInterfaceIp(): string | null;
    getPublicIp(force?: boolean): Promise<string>;
    getPublicBaseUrl(force?: boolean): Promise<string>;
    isPublic(force?: boolean): Promise<boolean>;
    isPortOpened(port: number, host: string): Promise<boolean>;
    findFirstAvailablePort(startingPort: number, host: string, excluded?: number[]): Promise<number>;
    hasInternetAccess(force?: boolean): Promise<boolean>;
    getInfo(): Promise<{
        ip: string | null;
        hasInternetAccess: boolean;
        sshAccess: boolean;
    }>;
    cron(): Promise<void>;
    getRouter(): import("express-serve-static-core").Router;
}
