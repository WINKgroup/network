import { EventEmitter } from 'node:events';
import _ from 'lodash';
import axios from 'axios';
import express from 'express';
import net from 'net';
import os from 'os';
import ConsoleLog from '@winkgroup/console-log';
import Cron from '@winkgroup/cron';
import { InternetAccessState, NetworkInfo } from './common';

export default class Network extends EventEmitter {
    private static publicIp = '';
    private internetAccessState = InternetAccessState.UNKNOWN;
    private cronObj = new Cron(60, {
        maxEverySeconds: 10 * 60,
        consoleLog: Network.consoleLog,
    });
    static consoleLog = new ConsoleLog({ prefix: 'Network' });

    static singleton: Network;

    private constructor() {
        super();
    }

    static get() {
        if (!this.singleton) this.singleton = new Network();
        return this.singleton;
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
                        this.internetAccessState == InternetAccessState.ONLINE,
                    );
                };
                this.on('online', waitForChecking);
                this.on('offline', waitForChecking);
            });

        const previousState = this.internetAccessState;
        this.internetAccessState = InternetAccessState.CHECKING;

        const notify = () => {
            if (previousState !== this.internetAccessState)
                if (!this.internetAccessState)
                    Network.consoleLog.warn('OFFLINE');
                else Network.consoleLog.print('ONLINE');
            this.emit(
                this.internetAccessState == InternetAccessState.ONLINE
                    ? 'online'
                    : 'offline',
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

    async cron() {
        if (this.internetAccessState === InternetAccessState.CHECKING) return;
        if (this.cronObj.tryStartRun()) {
            const hasInternetAccess = await this.hasInternetAccess(true);
            this.cronObj.runCompleted(!hasInternetAccess);
        }
    }

    static isPortOpened(
        port: number,
        host: string,
        timeout = 10000,
    ): Promise<boolean> {
        // Normalize host: treat 'localhost' as '127.0.0.1' for consistency
        if (host === 'localhost') host = '127.0.0.1';
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const onError = () => {
                socket.destroy();
                resolve(false);
            };

            socket.setTimeout(timeout);
            socket.once('error', onError);
            socket.once('timeout', onError);
            socket.connect(port, host, () => {
                socket.end();
                resolve(true);
            });
        });
    }

    static async findFirstAvailablePort(
        startingPort: number,
        host: string,
        excluded?: number[],
    ) {
        let port = startingPort;
        if (!excluded) excluded = [];
        while (port <= 65535) {
            if (excluded.indexOf(port) !== -1) {
                ++port;
                continue;
            }
            const isOpened = await this.isPortOpened(port, host);
            if (!isOpened) return port;
            ++port;
        }

        return null;
    }

    static getNetworkInterfaceIp() {
        const ifaces = os.networkInterfaces();

        for (const name in ifaces) {
            const iface = ifaces[name];
            if (!iface) continue;

            for (const info of iface) {
                if (info.family !== 'IPv4' || info.internal) continue;
                return info.address;
            }
        }

        return null;
    }

    static async getPublicIp(force = false, timeout = 20000) {
        const network = this.get();
        if (this.publicIp && !force) return this.publicIp;
        const online = await network.hasInternetAccess();
        if (online) {
            try {
                const response = await axios.get('https://httpbin.org/ip', {
                    timeout: timeout,
                });
                this.publicIp = response.data.origin;
            } catch (e) {
                console.error(e);
                this.consoleLog.warn(
                    'unable to get public ip from https://httpbin.org/ip',
                );
                this.publicIp = '';
            }
        } else this.publicIp = '';

        return this.publicIp;
    }

    static async getInfo(force = false) {
        const network = this.get();
        const publicIp = await this.getPublicIp(force);

        const info: NetworkInfo = {
            interfaceIp: this.getNetworkInterfaceIp() || '',
            publicIp: publicIp,
            hasInternetAccess: await network.hasInternetAccess(),
            sshAccess: await this.isPortOpened(22, 'sdf.org'),
        };

        return info;
    }

    static async getPublicBaseUrl(
        publicBaseUrlTemplate: string,
        inputOptions?: Partial<{ force: boolean; port: number }>,
    ) {
        const options = _.defaults(inputOptions, {
            force: false,
            port: 80,
        });

        const publicIp = await this.getPublicIp(options.force);
        if (!publicIp) return null;

        let publicBaseUrl = publicBaseUrlTemplate.replace('{{IP}}', publicIp);
        publicBaseUrl = publicBaseUrl.replace(
            '{{PORT}}',
            options.port.toString(),
        );
        return publicBaseUrl;
    }

    static getRouter() {
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

export { InternetAccessState, NetworkInfo };
