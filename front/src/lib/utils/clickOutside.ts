interface ClickOutsideOptions {
	onOutside: () => void;
	ignore?: HTMLElement | null;
}

type ClickOutsideParam = (() => void) | ClickOutsideOptions;

export function clickOutside(node: HTMLElement, param: ClickOutsideParam) {
	const normalize = (p: ClickOutsideParam): ClickOutsideOptions =>
		typeof p === 'function' ? { onOutside: p } : p;
	let opts = normalize(param);

	const handle = (event: MouseEvent) => {
		const target = event.target as Node;
		if (node.contains(target)) return;
		if (opts.ignore && opts.ignore.contains(target)) return;
		opts.onOutside();
	};
	document.addEventListener('pointerdown', handle, true);
	return {
		update(p: ClickOutsideParam) {
			opts = normalize(p);
		},
		destroy() {
			document.removeEventListener('pointerdown', handle, true);
		}
	};
}
