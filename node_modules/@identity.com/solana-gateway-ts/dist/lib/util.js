"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatekeeperExists = exports.getGatewayToken = exports.removeAccountChangeListener = exports.onGatewayTokenChange = exports.findGatewayToken = exports.findGatewayTokens = exports.dataToGatewayToken = exports.getGatewayTokenKeyForOwner = exports.getGatekeeperAccountKey = exports.proxyConnectionWithRetry = exports.runFunctionWithRetry = exports.defaultRetryConfig = void 0;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const types_1 = require("../types");
const GatewayTokenData_1 = require("./GatewayTokenData");
const async_retry_1 = __importDefault(require("async-retry"));
const R = __importStar(require("ramda"));
exports.defaultRetryConfig = {
    retryCount: constants_1.DEFAULT_SOLANA_RETRIES,
    exponentialFactor: 2,
    timeouts: {
        processed: constants_1.SOLANA_TIMEOUT_PROCESSED,
        confirmed: constants_1.SOLANA_TIMEOUT_CONFIRMED,
        finalized: constants_1.SOLANA_TIMEOUT_FINALIZED,
    },
};
const runFunctionWithRetry = (methodName, // for logging purposes so we know which call this was
fn, commitment, customRetryConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const retryConfig = Object.assign(Object.assign({}, exports.defaultRetryConfig), customRetryConfig);
    let timeout = R.path(["timeouts", commitment], retryConfig) ||
        retryConfig.timeouts.confirmed;
    // If we have any bugs before this point, this is the final safeguard against undefined retry config values.
    // TODO IDCOM-1558 Improve the type safety of config to avoid the need for checks such as this.
    let retryCount = retryConfig.retryCount;
    let expFactor = retryConfig.exponentialFactor;
    if (!retryCount) {
        console.error(`retryCount not set in Solana connection proxy. Defaulting to ${constants_1.DEFAULT_SOLANA_RETRIES}`);
        retryCount = constants_1.DEFAULT_SOLANA_RETRIES;
    }
    if (!expFactor) {
        console.error("exponentialFactor not set in Solana connection proxy. Defaulting to 2");
        retryCount = 2;
    }
    if (!timeout) {
        console.error(`timeout not set in Solana connection proxy. Defaulting to ${constants_1.SOLANA_TIMEOUT_CONFIRMED}`);
        timeout = constants_1.SOLANA_TIMEOUT_CONFIRMED;
    }
    let currentAttempt = 0;
    try {
        return yield (0, async_retry_1.default)(() => __awaiter(void 0, void 0, void 0, function* () {
            currentAttempt++;
            console.log(`Trying Solana connection method '${methodName}' (attempt ${currentAttempt} of ${retryConfig.retryCount + 1})`, { timeout });
            const timeoutPromise = new Promise((_resolve, reject) => setTimeout(() => reject(new Error("timeout")), timeout));
            const blockchainPromise = fn();
            return Promise.race([blockchainPromise, timeoutPromise]);
        }), {
            retries: retryCount,
            factor: expFactor,
        });
    }
    catch (err) {
        console.error(`Retries exhausted in Solana connection method '${methodName}' .`, { error: err });
        throw err;
    }
});
exports.runFunctionWithRetry = runFunctionWithRetry;
const proxyConnectionWithRetry = (originalConnection, customRetryConfig = exports.defaultRetryConfig) => {
    const proxyHandler = {
        get(target, propKey, receiver) {
            switch (propKey) {
                case "sendTransaction":
                    return (transaction, signers, options) => {
                        const fn = () => __awaiter(this, void 0, void 0, function* () { return target.sendTransaction(transaction, signers, options); });
                        return (0, exports.runFunctionWithRetry)("sendTransaction", fn, constants_1.SOLANA_COMMITMENT, customRetryConfig);
                    };
                case "confirmTransaction":
                    return (signature, commitment) => {
                        const fn = () => __awaiter(this, void 0, void 0, function* () { return target.confirmTransaction(signature, commitment); });
                        return (0, exports.runFunctionWithRetry)("confirmTransaction", fn, constants_1.SOLANA_COMMITMENT, customRetryConfig);
                    };
                case "getProgramAccounts":
                    return (programId, configOrCommitment) => {
                        const fn = () => __awaiter(this, void 0, void 0, function* () { return target.getProgramAccounts(programId, configOrCommitment); });
                        return (0, exports.runFunctionWithRetry)("getProgramAccounts", fn, constants_1.SOLANA_COMMITMENT, customRetryConfig);
                    };
                case "getAccountInfo":
                    return (publicKey, commitment) => {
                        const fn = () => __awaiter(this, void 0, void 0, function* () { return target.getAccountInfo(publicKey, commitment); });
                        return (0, exports.runFunctionWithRetry)("getAccountInfo", fn, constants_1.SOLANA_COMMITMENT, customRetryConfig);
                    };
                default:
                    // Return the original property unchanged:
                    return Reflect.get(target, propKey, receiver);
            }
        },
        apply(target, thisArg, argumentsList) {
            const fn = () => __awaiter(this, void 0, void 0, function* () { return target.apply(thisArg, argumentsList); });
            return (0, exports.runFunctionWithRetry)("apply", fn, constants_1.SOLANA_COMMITMENT, customRetryConfig);
        },
    };
    return new Proxy(originalConnection, proxyHandler);
};
exports.proxyConnectionWithRetry = proxyConnectionWithRetry;
/**
 * Derive the address of the gatekeeper PDA for this gatekeeper
 * @param authority The gatekeeper
 * @param network The network
 */
const getGatekeeperAccountKey = (authority, network) => __awaiter(void 0, void 0, void 0, function* () {
    const publicKeyNonce = yield web3_js_1.PublicKey.findProgramAddress([
        authority.toBuffer(),
        network.toBuffer(),
        Buffer.from(constants_1.GATEKEEPER_NONCE_SEED_STRING, "utf8"),
    ], constants_1.PROGRAM_ID);
    return publicKeyNonce[0];
});
exports.getGatekeeperAccountKey = getGatekeeperAccountKey;
/**
 * Derive the address of the gateway token PDA for this owner address and optional seed.
 * @param owner The owner of the gateway token
 * @param gatekeeperNetwork The network of the gateway token
 * @param seed An 8-byte seed array, used to add multiple tokens to the same owner. Must be unique to each token, if present
 */
const getGatewayTokenKeyForOwner = (owner, gatekeeperNetwork, seed) => __awaiter(void 0, void 0, void 0, function* () {
    const additionalSeed = seed
        ? Buffer.from(seed)
        : Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);
    if (additionalSeed.length != 8) {
        throw new Error("Additional Seed has length " +
            additionalSeed.length +
            " instead of 8 when calling getGatewayTokenKeyForOwner.");
    }
    const seeds = [
        owner.toBuffer(),
        Buffer.from(constants_1.GATEWAY_TOKEN_ADDRESS_SEED, "utf8"),
        additionalSeed,
        gatekeeperNetwork.toBuffer(),
    ];
    const publicKeyNonce = yield web3_js_1.PublicKey.findProgramAddress(seeds, constants_1.PROGRAM_ID);
    return publicKeyNonce[0];
});
exports.getGatewayTokenKeyForOwner = getGatewayTokenKeyForOwner;
// Based on solana/integration-lib/src/state.rs
// If the optional the parent-gateway-token field is populated, this value will be
// 34 (2 + 32) instead. TODO IDCOM-320 restructure the gateway token accounts to put
// all optional values at the end of the struct to simplify account parsing a little
const GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET = 2;
// As above, if optional fields are present, this will differ. TODO IDCOM-320 fixes this
const GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET = 35;
function fromGatewayTokenState(state) {
    if (!!state.active)
        return types_1.State.ACTIVE;
    if (!!state.revoked)
        return types_1.State.REVOKED;
    if (!!state.frozen)
        return types_1.State.FROZEN;
    throw new Error("Unrecognised state " + JSON.stringify(state));
}
const dataToGatewayToken = (data, publicKey) => {
    var _a;
    return new types_1.GatewayToken(data.issuingGatekeeper.toPublicKey(), data.gatekeeperNetwork.toPublicKey(), data.owner.toPublicKey(), fromGatewayTokenState(data.state), publicKey, constants_1.PROGRAM_ID, (_a = data.expiry) === null || _a === void 0 ? void 0 : _a.toNumber());
};
exports.dataToGatewayToken = dataToGatewayToken;
/**
 * Find all gateway tokens for a user on a gatekeeper network, optionally filtering out revoked tokens
 * @param connection A solana connection object
 * @param owner The token owner
 * @param gatekeeperNetwork The network to find a token for
 * @param {boolean=false} includeRevoked If false (default), filter out revoked tokens
 * @returns {Promise<GatewayToken[]>} All tokens for the owner
 */
const findGatewayTokens = (connection, owner, gatekeeperNetwork, includeRevoked = false) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerFilter = {
        memcmp: {
            offset: GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET,
            bytes: owner.toBase58(),
        },
    };
    const gatekeeperNetworkFilter = {
        memcmp: {
            offset: GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET,
            bytes: gatekeeperNetwork === null || gatekeeperNetwork === void 0 ? void 0 : gatekeeperNetwork.toBase58(),
        },
    };
    const filters = [ownerFilter, gatekeeperNetworkFilter];
    const accountsResponse = yield connection.getProgramAccounts(constants_1.PROGRAM_ID, {
        filters,
    });
    if (!accountsResponse)
        return [];
    const toGatewayToken = ({ pubkey, account, }) => (0, exports.dataToGatewayToken)(GatewayTokenData_1.GatewayTokenData.fromAccount(account.data), pubkey);
    return accountsResponse
        .map(toGatewayToken)
        .filter((gatewayToken) => gatewayToken.state !== types_1.State.REVOKED || includeRevoked);
});
exports.findGatewayTokens = findGatewayTokens;
/**
 * Find any unrevoked token for a user on a gatekeeper network
 * @param connection A solana connection object
 * @param owner The token owner
 * @param gatekeeperNetwork The network to find a token for
 * @returns Promise<GatewayToken | null> An unrevoked token, if one exists for the owner
 */
const findGatewayToken = (connection, owner, gatekeeperNetwork) => __awaiter(void 0, void 0, void 0, function* () {
    const tokens = yield (0, exports.findGatewayTokens)(connection, owner, gatekeeperNetwork, false);
    if (tokens.length === 0)
        return null;
    // if any are valid, return the first one
    const validTokens = tokens.filter((token) => token.isValid());
    if (validTokens.length > 0)
        return validTokens[0];
    // if none is valid, return the first non-revoked one
    const nonRevokedTokens = tokens.filter((token) => token.state !== types_1.State.REVOKED);
    return nonRevokedTokens.length === 0 ? null : nonRevokedTokens[0];
});
exports.findGatewayToken = findGatewayToken;
/**
 * Register a callback to be called whenever a gateway token changes state
 * @param connection A solana connection object
 * @param gatewayTokenAddress The address of the gateway token
 * @param callback The callback to register
 * @param commitment The solana commitment level at which to register gateway token changes. Defaults to 'confirmed'
 * @return The subscription id
 */
const onGatewayTokenChange = (connection, gatewayTokenAddress, callback, commitment = constants_1.SOLANA_COMMITMENT) => {
    const accountCallback = (accountInfo) => {
        const gatewayToken = (0, exports.dataToGatewayToken)(GatewayTokenData_1.GatewayTokenData.fromAccount(accountInfo.data), gatewayTokenAddress);
        callback(gatewayToken);
    };
    return connection.onAccountChange(gatewayTokenAddress, accountCallback, commitment);
};
exports.onGatewayTokenChange = onGatewayTokenChange;
/**
 * Stops listening to gateway state changes
 * @param connection A solana connection object
 * @param id The subscription id to deregister
 */
const removeAccountChangeListener = (connection, id) => connection.removeAccountChangeListener(id);
exports.removeAccountChangeListener = removeAccountChangeListener;
/**
 * Lookup the gateway token at a given address
 * @param connection A solana connection object
 * @param gatewayTokenAddress The address of the gateway token
 */
const getGatewayToken = (connection, gatewayTokenAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield connection.getAccountInfo(gatewayTokenAddress, constants_1.SOLANA_COMMITMENT);
    if (!account)
        return null;
    return (0, exports.dataToGatewayToken)(GatewayTokenData_1.GatewayTokenData.fromAccount(account.data), gatewayTokenAddress);
});
exports.getGatewayToken = getGatewayToken;
/**
 * Returns whether or not a gatekeeper exists from a network and authority
 * @param connection A solana connection
 * @param gatekeeperAuthority The authority of the gatekeeper
 * @param gatekeeperNetwork The network of the gatekeeper
 */
const gatekeeperExists = (connection, gatekeeperAuthority, gatekeeperNetwork) => __awaiter(void 0, void 0, void 0, function* () {
    const gatekeeperAccount = yield (0, exports.getGatekeeperAccountKey)(gatekeeperAuthority, gatekeeperNetwork);
    const account = yield connection.getAccountInfo(gatekeeperAccount, constants_1.SOLANA_COMMITMENT);
    return account != null && account.owner == constants_1.PROGRAM_ID;
});
exports.gatekeeperExists = gatekeeperExists;
//# sourceMappingURL=util.js.map