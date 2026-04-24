export function portal(node: HTMLElement, target: HTMLElement | string = document.body) {
	const el = typeof target === 'string' ? document.querySelector(target) : target;
	if (el) el.appendChild(node);
	return {
		destroy() {
			node.remove();
		}
	};
}
