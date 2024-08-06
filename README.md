# network
Network library is an utility library that can be used to retrieve your public ip, check your ports are opened, receive events when you are disconnected from internet and much more.

## Install
```bash
npm install @winkgroup/network
```

## Usage
```js
import Network from '@winkgroup/network';

const network = Network.get();

// this will work only if you periodically run "cron" method as described below
network.emit( 'online', () => console.log('you are online') );
network.emit( 'offline', () => console.log('you are offline') );

/**
 *  Required to dynamically detect if you are connected or not.
 *  This can be useful when you want your application is running on a laptop or any other device that
 *  can lost internet connection (like some poor hosting services) and react based on that
 */
setInterval( () => {
    network.cron();
}, 1000);

```

## Methods
### -> static async findFirstAvailablePort(startingPort: number, host: string, excluded?: number[]) => number | null
### -> static async getInfo(force = false) => { interfaceIp, publicIp, hasInternetAccess, sshAccess }
### -> static getNetworkInterfaceIp() => string | null
find the find the first ip that is not a loopback interface
### -> static async getPublicBaseUrl(publicBaseUrlTemplate: string, inputOptions?: Partial<{ force: boolean; port: number }>)
```js
const network = Network.get()

// supposing your publicIp is 93.47.76.66...
async function printEndpoint() {
    const publicBaseUrl = await network.getPublicBaseUrl('https://{{IP}}:{{PORT}}', { port: 8080 });
    console.log('my endpoint will be', publicBaseUrl + '/myService'); // https://93.47.76.66:8080/myService
}

printEndpoint()
```
### -> static async getPublicIp(force = false, timeout = 20000) => string | ''
get your public ip using https://httpbin.org/ip
### -> static getRouter()
helper function to expose this functions as endpoints in a web service. Here the list (endpoint => function name):
- GET /info => getInfo
you can run testWebservice and check the [code](https://raw.githubusercontent.com/WINKgroup/network/main/src/testWebservice.ts) to have an idea of how it can work:
```bash
npm run testWebservice
```
you will need **ts-node-dev installed**
### -> async hasInternetAccess(force = false) => boolean
### -> static async isPortOpened(port: number, host: string, timeout = 10000) => boolean
you can check on localhost( host = 127.0.0.1 ), remote hosts or public interfaces

## Tips & Tricks
- `@types/express` is required to be in dependencies, not just a devDependencies beacause type `Router` is required in js built script
- network uses WiNKgroup [console-log](https://github.com/WINKgroup/console-log) to manage messages like when you are online or not. You can manage how much verbose you want to be or if need to write those messages on a file overwriting *consoleLog* attribute:
```js
import Network from '@winkgroup/network';
import ConsoleLog from '@winkgroup/console-log';

Network.consoleLog = new ConsoleLog({ prefix: 'MyPreciousLog' });
...
```

## Maintainers
* [fairsayan](https://github.com/fairsayan)