/**
 * Google Identity Services (GIS) helpers.
 * Docs: https://developers.google.com/identity/gsi/web
 */

declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize(config: {
						client_id: string;
						callback: (response: { credential: string }) => void;
						auto_select?: boolean;
						cancel_on_tap_outside?: boolean;
					}): void;
					prompt(
						momentListener?: (notification: {
							isNotDisplayed(): boolean;
							isSkippedMoment(): boolean;
							isDismissedMoment(): boolean;
						}) => void
					): void;
				};
			};
		};
	}
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<void> | null = null;

/** Idempotently injects the Google Identity Services script. */
export function loadGoogleScript(): Promise<void> {
	if (scriptPromise) return scriptPromise;

	// Already loaded (e.g. HMR / multiple callers)
	if (typeof window !== 'undefined' && window.google?.accounts) {
		scriptPromise = Promise.resolve();
		return scriptPromise;
	}

	scriptPromise = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.src = GIS_SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
		document.head.appendChild(script);
	});

	return scriptPromise;
}

/**
 * Trigger Google One Tap sign-in.
 * Resolves with an OIDC ID token string.
 */
export function signInWithGoogle(clientId: string): Promise<string> {
	return loadGoogleScript().then(
		() =>
			new Promise<string>((resolve, reject) => {
				if (!window.google) {
					reject(new Error('Google Identity Services not available'));
					return;
				}

				window.google.accounts.id.initialize({
					client_id: clientId,
					callback: (response) => {
						if (response.credential) {
							resolve(response.credential);
						} else {
							reject(new Error('Google sign-in did not return a credential'));
						}
					},
					auto_select: false,
					cancel_on_tap_outside: true
				});

				window.google.accounts.id.prompt((notification) => {
					if (notification.isNotDisplayed() || notification.isDismissedMoment()) {
						reject(new Error('Google sign-in was not displayed or was dismissed'));
					}
				});
			})
	);
}
