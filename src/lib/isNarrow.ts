// Below Tailwind's lg breakpoint.
export const isNarrow = () => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 1023px)').matches
