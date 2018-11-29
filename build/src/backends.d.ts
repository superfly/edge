export { githubPages } from "./backends/github_pages";
export interface BackendInfo {
    origin: string | string[];
    type?: string;
    headers?: {
        [name: string]: string | boolean | undefined;
    };
}
export interface Backend {
    (req: RequestInfo, init?: RequestInit): Promise<Response>;
    info: BackendInfo;
}
export declare type BackendMap = Map<String, Backend>;
export default function backend(backend: BackendInfo): Backend;
