export function visiblePolling(refresh:(signal:AbortSignal)=>Promise<void>,interval:()=>number):()=>void;
