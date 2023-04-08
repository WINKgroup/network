import { EventEmitter } from 'node:events';
import _ from 'lodash';
import axios from 'axios';
import express from 'express';
import net from 'net';
import os from 'os';
import ConsoleLog from '@winkgroup/console-log';
import Cron from '@winkgroup/cron';
import { InternetAccessState, NetworkInfo, NetworkParams } from './common';

export default class Network extends EventEmitter {
    params: NetworkParams;
    private publicIp = '';
    private publicBaseUrl = '';
    private internetAccessState = InternetAccessState.UNKNOWN;
    private cronManager = new Cron(5 * 60);
    consoleLog = new ConsoleLog({ prefix: 'Network' });

    private static singleton: Network;

    private constructor(inputParams?: Partial<NetworkParams>) {
        super();
        this.params = _.defaults(inputParams, {
            ip: '127.0.0.1',
            port: 80,
            publicBaseUrlTemplate: '',
        });
    }

    static get(inputParams?: Partial<NetworkParams>) {
        if (!this.singleton) this.singleton = new Network();
        return this.singleton;
    }

    getBaseUrl() {
        return `http://${this.params.ip}:${this.params.port}`;
    }

    getNetworkInterfaceIp() {
        const ifaces = os.networkInterfaces();

        for (const name in ifaces) {
            const iface = ifaces[name];
            if (!iface) continue;

            for (const info of iface) {
                if (info.family !== 'IPv4' || info.internal) continue;
                return info.address;
            }
        }

        this.consoleLog.warn('no external network interface IP');
        return null;
    }

    async getPublicIp(force = false) {
        if (this.publicIp && !force) return this.publicIp;
        const online = await this.hasInternetAccess();
        if (online) {
            try {
                const response = await axios.get('https://httpbin.org/ip', {
                    timeout: 2000,
                });
                this.publicIp = response.data.origin;
            } catch (e) {
                console.error(e);
                this.consoleLog.warn(
                    'unable to get public ip from https://httpbin.org/ip'
                );
                this.publicIp = '';
            }
        } else this.publicIp = '';

        return this.publicIp;
    }

    async getPublicBaseUrl(force = false) {
        if (!this.params.publicBaseUrlTemplate) return '';
        if (!force && this.publicBaseUrl) return this.publicBaseUrl;
        const publicIp = await this.getPublicIp(force);
        if (!publicIp) return '';
        this.publicBaseUrl = this.params.publicBaseUrlTemplate.replace(
            '{{IP}}',
            publicIp
        );
        this.publicBaseUrl = this.publicBaseUrl.replace(
            '{{PORT}}',
            this.params.port.toString()
        );
        return this.publicBaseUrl;
    }

    async isPublic(force = false) {
        const publicBaseUrl = await this.getPublicBaseUrl(force);
        return !!publicBaseUrl;
    }

    isPortOpened(port: number, host: string): Promise<boolean> {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const onError = () => {
                socket.destroy();
                resolve(false);
            };

            socket.setTimeout(1000);
            socket.once('error', onError);
            socket.once('timeout', onError);
            socket.connect(port, host, () => {
                socket.end();
                resolve(true);
            });
        });
    }

    async findFirstAvailablePort(
        startingPort: number,
        host: string,
        excluded?: number[]
    ) {
        let port = startingPort;
        if (!excluded) excluded = [];
        while (1 === 1) {
            if (excluded.indexOf(port) !== -1) {
                ++port;
                continue;
            }
            const isOpened = await this.isPortOpened(port, host);
            if (!isOpened) return port;
            ++port;
        }

        return port - 1;
    }

    async hasInternetAccess(force = false) {
        if (
            !force &&
            this.internetAccessState !== InternetAccessState.CHECKING &&
            this.internetAccessState !== InternetAccessState.UNKNOWN
        )
            return this.internetAccessState === InternetAccessState.ONLINE;

        if (this.internetAccessState === InternetAccessState.CHECKING)
            return new Promise<boolean>((resolve) => {
                const waitForChecking = () => {
                    this.off('online', waitForChecking);
                    this.off('offline', waitForChecking);
                    resolve(
                        this.internetAccessState == InternetAccessState.ONLINE
                    );
                };
                this.on('online', waitForChecking);
                this.on('offline', waitForChecking);
            });

        const previousState = this.internetAccessState;
        this.internetAccessState = InternetAccessState.CHECKING;

        const notify = () => {
            if (previousState !== this.internetAccessState)
                if (!this.internetAccessState) this.consoleLog.warn('OFFLINE');
                else this.consoleLog.print('ONLINE');
            this.emit(
                this.internetAccessState == InternetAccessState.ONLINE
                    ? 'online'
                    : 'offline'
            );
        };

        for (let i = 0; i < 5; i++) {
            try {
                await axios.get('https://www.google.com', { timeout: 2000 });
                this.internetAccessState = InternetAccessState.ONLINE;
                notify();
                return true;
            } catch (e) {}
        }
        this.internetAccessState = InternetAccessState.OFFLINE;
        notify();
        return false;
    }

    async getInfo() {
        const info: NetworkInfo = {
            ip: this.getNetworkInterfaceIp() || '',
            port: this.params.port,
            hasInternetAccess: await this.hasInternetAccess(),
            sshAccess: await this.isPortOpened(22, 'sdf.org'),
            publicBaseUrl: await this.getPublicBaseUrl(),
        };

        return info;
    }

    async cron() {
        if (this.internetAccessState === InternetAccessState.CHECKING) return;
        if (this.cronManager.tryStartRun()) {
            await this.hasInternetAccess(true);
            this.cronManager.runCompleted();
        }
    }

    getRouter() {
        const router = express.Router();

        router.get('/info', async (req, res) => {
            try {
                const info = await this.getInfo();
                res.json(info);
            } catch (e) {
                res.status(500).send(e);
            }
        });

        return router;
    }
}

export { InternetAccessState, NetworkInfo, NetworkParams };
