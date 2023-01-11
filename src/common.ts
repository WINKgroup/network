export enum InternetAccessState {
    ONLINE = 'online',
    OFFLINE = 'offline',
    CHECKING = 'checking',
    UNKNOWN = 'unknown'
}

export interface NetworkParams {
    ip:string
    port:number
    publicBaseUrlTemplate:string
}

export interface NetworkInfo {
    ip:string
    port:number
    hasInternetAccess:boolean
    sshAccess:boolean
    publicBaseUrl:string
}

