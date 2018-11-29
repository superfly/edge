/**
 * @module Rules
 * @ignore
 * */
import { BackendMap } from "./backends";
export interface RuleInfo {
    actionType: "redirect" | "rewrite";
    backendKey?: string;
    matchScheme?: string;
    hostname?: string;
    pathMatchMode?: "prefix" | "full";
    httpHeaderKey?: string;
    httpHeaderValue?: RegExp | string;
    pathPattern?: RegExp | string;
    pathReplacementPattern?: string;
    redirectURLPattern?: string;
    redirectStatus?: number;
    responseReplacements?: [string, string][];
}
export default function rules(backends: BackendMap, rules: RuleInfo[]): (req: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
