export function clickOutside(node: HTMLElement, callback: () => void) {
	const handle = (event: MouseEvent) => {
		if (!node.contains(event.target as Node)) callback();
	};
	document.addEventListener('pointerdown', handle, true);
	return {
		destroy() {
			document.removeEventListener('pointerdown', handle, true);
		}
	};
}
