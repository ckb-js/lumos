declare const _default: {
    localNodeInfo: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (info: import("../types/rpc").RPC.LocalNodeInfo) => import("../types/api").CKBComponents.LocalNodeInfo;
    };
    getPeers: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (nodes: import("../types/rpc").RPC.RemoteNodeInfo[]) => import("../types/api").CKBComponents.RemoteNodeInfo[];
    };
    getBannedAddresses: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (bannedAddresses: import("../types/rpc").RPC.BannedAddresses) => import("../types/api").CKBComponents.BannedAddresses;
    };
    clearBannedAddresses: {
        method: string;
        paramsFormatters: never[];
    };
    setBan: {
        method: string;
        paramsFormatters: never[];
    };
    syncState: {
        method: string;
        paramsFormatters: never[];
        resultFormatters: (state: import("../types/rpc").RPC.SyncState) => import("../types/api").CKBComponents.SyncState;
    };
    setNetworkActive: {
        method: string;
        paramsFormatters: ((value: boolean) => boolean)[];
    };
    addNode: {
        method: string;
        paramsFormatters: never[];
    };
    removeNode: {
        method: string;
        paramsFormatters: never[];
    };
    pingPeers: {
        method: string;
        paramsFormatters: never[];
    };
};
export default _default;
