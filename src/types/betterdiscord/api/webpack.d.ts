/* eslint-disable @typescript-eslint/no-explicit-any */

import {FluxStore} from "@discord/modules";
import type {Stores} from "@discord/stores";

export interface Module {
    id: number;
    loaded: true;
    exports: any;
}

export type FilterFunction = (exports: any, module?: Module, id?: string) => boolean;

export interface FilterOptions {
    defaultExport?: boolean;
    searchExports?: boolean;
}

export interface WithKeyOptions extends FilterOptions {
    target?: any;
}

export interface Webpack {
    Filters: Filters;
    getModule<T>(filter: FilterFunction, options?: FilterOptions): T | undefined;
    waitForModule<T>(filter: FilterFunction, options?: FilterOptions): Promise<T>;
    getByKeys<T>(...keys: string[] | [...string[], FilterOptions]): T | undefined;
    getByStrings<T>(...strings: string[] | [...string[], FilterOptions]): T | undefined;
    getByPrototypeKeys<T>(...keys: string[] | [...string[], FilterOptions]): T | undefined;
    getStore<T>(name: string): T & FluxStore | undefined;
    getWithKey<T = any>(filter: FilterFunction, options?: WithKeyOptions): [T, string];
    getById<T>(id: number): T | undefined;
    Stores: Stores;
}

export interface Filters {
    byKeys(...keys: string[]): FilterFunction;
    byPrototypeKeys(...prototypes: string[]): FilterFunction;
    byStrings(...strings: string[]): FilterFunction;
    byStoreName(name: string): FilterFunction;
    combine(...filters: FilterFunction[]): FilterFunction;
}