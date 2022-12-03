"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternetAccessState = void 0;
var node_events_1 = require("node:events");
var lodash_1 = __importDefault(require("lodash"));
var axios_1 = __importDefault(require("axios"));
var express_1 = __importDefault(require("express"));
var net_1 = __importDefault(require("net"));
var os_1 = __importDefault(require("os"));
var console_log_1 = __importDefault(require("@winkgroup/console-log"));
var cron_1 = __importDefault(require("@winkgroup/cron"));
var InternetAccessState;
(function (InternetAccessState) {
    InternetAccessState["ONLINE"] = "online";
    InternetAccessState["OFFLINE"] = "offline";
    InternetAccessState["CHECKING"] = "checking";
    InternetAccessState["UNKNOWN"] = "unknown";
})(InternetAccessState = exports.InternetAccessState || (exports.InternetAccessState = {}));
var Network = /** @class */ (function (_super) {
    __extends(Network, _super);
    function Network(inputParams) {
        var _this = _super.call(this) || this;
        _this.publicIp = '';
        _this.publicBaseUrl = '';
        _this.internetAccessState = InternetAccessState.UNKNOWN;
        _this.cronManager = new cron_1.default(5 * 60);
        _this.consoleLog = new console_log_1.default({ prefix: 'Network' });
        _this.params = lodash_1.default.defaults(inputParams, {
            ip: '127.0.0.1',
            port: 80,
            publicBaseurlTemplate: ''
        });
        return _this;
    }
    Network.get = function (inputParams) {
        if (!this.singleton)
            this.singleton = new Network();
        return this.singleton;
    };
    Network.prototype.getBaseUrl = function () {
        return "http://".concat(this.params.ip, ":").concat(this.params.port);
    };
    Network.prototype.getNetworkInterfaceIp = function () {
        var ifaces = os_1.default.networkInterfaces();
        for (var name_1 in ifaces) {
            var iface = ifaces[name_1];
            if (!iface)
                continue;
            for (var _i = 0, iface_1 = iface; _i < iface_1.length; _i++) {
                var info = iface_1[_i];
                if (info.family !== 'IPv4' || info.internal)
                    continue;
                return info.address;
            }
        }
        this.consoleLog.warn('no external network interface IP');
        return null;
    };
    Network.prototype.getPublicIp = function (force) {
        if (force === void 0) { force = false; }
        return __awaiter(this, void 0, void 0, function () {
            var online, response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.publicIp && !force)
                            return [2 /*return*/, this.publicIp];
                        return [4 /*yield*/, this.hasInternetAccess()];
                    case 1:
                        online = _a.sent();
                        if (!online) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, axios_1.default.get('https://httpbin.org/ip', { timeout: 2000 })];
                    case 3:
                        response = _a.sent();
                        this.publicIp = response.data.origin;
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        console.error(e_1);
                        this.consoleLog.warn('unable to get public ip from https://httpbin.org/ip');
                        this.publicIp = '';
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        this.publicIp = '';
                        _a.label = 7;
                    case 7: return [2 /*return*/, this.publicIp];
                }
            });
        });
    };
    Network.prototype.getPublicBaseUrl = function (force) {
        if (force === void 0) { force = false; }
        return __awaiter(this, void 0, void 0, function () {
            var publicIp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.params.publicBaseurlTemplate)
                            return [2 /*return*/, ''];
                        if (!force && this.publicBaseUrl)
                            return [2 /*return*/, this.publicBaseUrl];
                        return [4 /*yield*/, this.getPublicIp(force)];
                    case 1:
                        publicIp = _a.sent();
                        if (!publicIp)
                            return [2 /*return*/, ''];
                        this.publicBaseUrl = this.params.publicBaseurlTemplate.replace('{{IP}}', publicIp);
                        this.publicBaseUrl = this.publicBaseUrl.replace('{{PORT}}', this.params.port.toString());
                        return [2 /*return*/, this.publicBaseUrl];
                }
            });
        });
    };
    Network.prototype.isPublic = function (force) {
        if (force === void 0) { force = false; }
        return __awaiter(this, void 0, void 0, function () {
            var publicBaseUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPublicBaseUrl(force)];
                    case 1:
                        publicBaseUrl = _a.sent();
                        return [2 /*return*/, !!publicBaseUrl];
                }
            });
        });
    };
    Network.prototype.isPortOpened = function (port, host) {
        return new Promise(function (resolve) {
            var socket = new net_1.default.Socket();
            var onError = function () {
                socket.destroy();
                resolve(false);
            };
            socket.setTimeout(1000);
            socket.once('error', onError);
            socket.once('timeout', onError);
            socket.connect(port, host, function () {
                socket.end();
                resolve(true);
            });
        });
    };
    Network.prototype.findFirstAvailablePort = function (startingPort, host, excluded) {
        return __awaiter(this, void 0, void 0, function () {
            var port, isOpened;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        port = startingPort;
                        if (!excluded)
                            excluded = [];
                        _a.label = 1;
                    case 1:
                        if (!(1 === 1)) return [3 /*break*/, 3];
                        if (excluded.indexOf(port) !== -1) {
                            ++port;
                            return [3 /*break*/, 1];
                        }
                        return [4 /*yield*/, this.isPortOpened(port, host)];
                    case 2:
                        isOpened = _a.sent();
                        if (!isOpened)
                            return [2 /*return*/, port];
                        ++port;
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/, port - 1];
                }
            });
        });
    };
    Network.prototype.hasInternetAccess = function (force) {
        if (force === void 0) { force = false; }
        return __awaiter(this, void 0, void 0, function () {
            var previousState, notify, i, e_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!force && this.internetAccessState !== InternetAccessState.CHECKING &&
                            this.internetAccessState !== InternetAccessState.UNKNOWN)
                            return [2 /*return*/, (this.internetAccessState === InternetAccessState.ONLINE)];
                        if (this.internetAccessState === InternetAccessState.CHECKING)
                            return [2 /*return*/, new Promise(function (resolve) {
                                    var waitForChecking = function () {
                                        _this.off('online', waitForChecking);
                                        _this.off('offline', waitForChecking);
                                        resolve(_this.internetAccessState == InternetAccessState.ONLINE);
                                    };
                                    _this.on('online', waitForChecking);
                                    _this.on('offline', waitForChecking);
                                })];
                        previousState = this.internetAccessState;
                        this.internetAccessState = InternetAccessState.CHECKING;
                        notify = function () {
                            if (previousState !== _this.internetAccessState)
                                if (!_this.internetAccessState)
                                    _this.consoleLog.warn('OFFLINE');
                                else
                                    _this.consoleLog.print('ONLINE');
                            _this.emit(_this.internetAccessState == InternetAccessState.ONLINE ? 'online' : 'offline');
                        };
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 5)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, axios_1.default.get('https://www.google.com', { timeout: 2000 })];
                    case 3:
                        _a.sent();
                        this.internetAccessState = InternetAccessState.ONLINE;
                        notify();
                        return [2 /*return*/, true];
                    case 4:
                        e_2 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        this.internetAccessState = InternetAccessState.OFFLINE;
                        notify();
                        return [2 /*return*/, false];
                }
            });
        });
    };
    Network.prototype.getInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {
                            ip: this.getNetworkInterfaceIp()
                        };
                        return [4 /*yield*/, this.hasInternetAccess()];
                    case 1:
                        _a.hasInternetAccess = _b.sent();
                        return [4 /*yield*/, this.isPortOpened(22, 'sdf.org')];
                    case 2: return [2 /*return*/, (_a.sshAccess = _b.sent(),
                            _a)];
                }
            });
        });
    };
    Network.prototype.cron = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.internetAccessState === InternetAccessState.CHECKING)
                            return [2 /*return*/];
                        if (!this.cronManager.tryStartRun()) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasInternetAccess(true)];
                    case 1:
                        _a.sent();
                        this.cronManager.runCompleted();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    Network.prototype.getRouter = function () {
        var _this = this;
        var router = express_1.default.Router();
        router.get('/info', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var info, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getInfo()];
                    case 1:
                        info = _a.sent();
                        res.json(info);
                        return [3 /*break*/, 3];
                    case 2:
                        e_3 = _a.sent();
                        res.status(500).send(e_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        return router;
    };
    return Network;
}(node_events_1.EventEmitter));
exports.default = Network;
