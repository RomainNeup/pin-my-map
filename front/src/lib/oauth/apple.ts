/**
 * Apple ID JS helpers.
 * Docs: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js
 */

declare global {
	interface Window {
		AppleID?: {
			auth: {
				init(config: {
					clientId: string;
					scope?: string;
					redirectURI: string;
					usePopup?: boolean;
				}): void;
				signIn(): Promise<AppleSignInResponse>;
			};
		};
	}
}

interface AppleSignInResponse {
	authorization: {
		id_token: string;
		code: string;
	};
	user?: {
		name?: {
			firstName?: string;
			lastName?: string;
		};
		email?: string;
	};
}

const APPLE_SCRIPT_SRC =
	'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

let scriptPromise: Promise<void> | null = null;

/** Idempotently injects the Apple ID JS script. */
export function loadAppleScript(): Promise<void> {
	if (scriptPromise) return scriptPromise;

	if (typeof window !== 'undefined' && window.AppleID) {
		scriptPromise = Promise.resolve();
		return scriptPromise;
	}

	scriptPromise = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.src = APPLE_SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load Apple ID script'));
		document.head.appendChild(script);
	});

	return scriptPromise;
}

export interface AppleSignInResult {
	idToken: string;
	name?: string;
}

/**
 * Trigger Apple Sign In (popup flow).
 * Resolves with an OIDC ID token and, on first sign-in, the user's name.
 */
export function signInWithApple(config: {
	clientId: string;
	redirectURI: string;
	scope?: string;
}): Promise<AppleSignInResult> {
	return loadAppleScript().then(async () => {
		if (!window.AppleID) {
			throw new Error('Apple ID JS not available');
		}

		window.AppleID.auth.init({
			clientId: config.clientId,
			scope: config.scope ?? 'name email',
			redirectURI: config.redirectURI,
			usePopup: true
		});

		const response = await window.AppleID.auth.signIn();

		const firstName = response.user?.name?.firstName ?? '';
		const lastName = response.user?.name?.lastName ?? '';
		const fullName = [firstName, lastName].filter(Boolean).join(' ') || undefined;

		return {
			idToken: response.authorization.id_token,
			name: fullName
		};
	});
}
