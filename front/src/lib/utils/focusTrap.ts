const FOCUSABLE =
	'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function focusTrap(node: HTMLElement) {
	const previouslyFocused = document.activeElement as HTMLElement | null;

	const getFocusable = () =>
		Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
			(el) => !el.hasAttribute('disabled') && el.offsetParent !== null
		);

	const handleKey = (e: KeyboardEvent) => {
		if (e.key !== 'Tab') return;
		const focusable = getFocusable();
		if (focusable.length === 0) {
			e.preventDefault();
			return;
		}
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement as HTMLElement;
		if (e.shiftKey && active === first) {
			last.focus();
			e.preventDefault();
		} else if (!e.shiftKey && active === last) {
			first.focus();
			e.preventDefault();
		}
	};

	node.addEventListener('keydown', handleKey);

	queueMicrotask(() => {
		const focusable = getFocusable();
		if (focusable.length > 0 && !node.contains(document.activeElement)) {
			focusable[0].focus();
		}
	});

	return {
		destroy() {
			node.removeEventListener('keydown', handleKey);
			previouslyFocused?.focus?.();
		}
	};
}
