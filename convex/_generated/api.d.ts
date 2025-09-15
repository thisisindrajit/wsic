/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as blocks from "../blocks.js";
import type * as categories from "../categories.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as embeddings from "../embeddings.js";
import type * as notifications from "../notifications.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as topics from "../topics.js";
import type * as types from "../types.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  blocks: typeof blocks;
  categories: typeof categories;
  constants: typeof constants;
  crons: typeof crons;
  embeddings: typeof embeddings;
  notifications: typeof notifications;
  search: typeof search;
  seed: typeof seed;
  topics: typeof topics;
  types: typeof types;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
