/**
 * Authentication Integration Utilities (Compatibility Layer)
 *
 * The application now uses a local auth wrapper. This file provides a
 * backward-compatible surface for older imports and re-exports only the
 * functions used by the rest of the codebase.
 */

import * as NewAuth from "@/sdk/core/auth";
import { platformApi, platformRequest } from "@/sdk/core/request";

// Basic re-exports available from the lightweight auth wrapper
export const getAuthToken = NewAuth.getAuthToken;
export const getAuthTokenAsync = NewAuth.getAuthTokenAsync;
export const isAuthenticatedSync = NewAuth.isAuthenticatedSync;
export const initializeAuthIntegration = NewAuth.initializeAuthIntegration;

// Platform helpers
export const createAuthenticatedFetch = () => platformRequest.bind(null);
export const authenticatedFetch = platformRequest;
export const authApi = platformApi;

export default {
	getAuthToken,
	getAuthTokenAsync,
	isAuthenticatedSync,
	initializeAuthIntegration,
	createAuthenticatedFetch,
	authenticatedFetch,
	authApi,
};
