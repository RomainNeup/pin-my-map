import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',

	theme: {
		extend: {
			colors: {
				// Design tokens (light/dark via CSS variables)
				bg: 'var(--c-bg)',
				'bg-elevated': 'var(--c-bg-elevated)',
				'bg-muted': 'var(--c-bg-muted)',
				'bg-inset': 'var(--c-bg-inset)',
				border: 'var(--c-border)',
				'border-strong': 'var(--c-border-strong)',
				fg: 'var(--c-fg)',
				'fg-muted': 'var(--c-fg-muted)',
				'fg-subtle': 'var(--c-fg-subtle)',
				accent: {
					DEFAULT: 'var(--c-accent)',
					fg: 'var(--c-accent-fg)',
					hover: 'var(--c-accent-hover)',
					soft: 'var(--c-accent-soft)',
					'soft-fg': 'var(--c-accent-soft-fg)'
				},
				success: 'var(--c-success)',
				warning: 'var(--c-warning)',
				danger: {
					DEFAULT: 'var(--c-danger)',
					soft: 'var(--c-danger-soft)'
				},
				info: 'var(--c-info)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			},
			boxShadow: {
				sm: 'var(--shadow-sm)',
				DEFAULT: 'var(--shadow-md)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)',
				xl: 'var(--shadow-xl)'
			},
			borderRadius: {
				sm: '6px',
				md: '10px',
				lg: '14px',
				xl: '20px',
				'2xl': '28px'
			},
			backdropBlur: {
				glass: '12px'
			},
			zIndex: {
				map: '0',
				overlay: '10',
				fab: '20',
				sheet: '30',
				dialog: '40',
				toast: '50',
				popover: '60'
			}
		}
	},

	plugins: [forms]
} satisfies Config;
