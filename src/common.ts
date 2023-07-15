export enum InternetAccessState {
    ONLINE = 'online',
    OFFLINE = 'offline',
    CHECKING = 'checking',
    UNKNOWN = 'unknown',
}

export interface NetworkInfo {
    interfaceIp: string;
    publicIp: string;
    hasInternetAccess: boolean;
    sshAccess: boolean;
}
