const subtleSpringTransition = {
	type: "spring" as const,
	stiffness: 320,
	damping: 28,
	mass: 0.7,
};

export const pageContainerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.1,
		},
	},
};

export const pageItemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			ease: "easeOut" as const,
		},
	},
};

export const sectionFadeVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			duration: 0.35,
			ease: "easeOut" as const,
		},
	},
};

export const subtleListVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.035,
			delayChildren: 0.05,
		},
	},
};

export const subtleListItemVariants = {
	hidden: { opacity: 0, y: 6, scale: 0.995 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: subtleSpringTransition,
	},
};

export const subtleListItemInitial = subtleListItemVariants.hidden;
export const subtleListItemAnimate = subtleListItemVariants.visible;

export function getSubtleListItemTransition(index: number, baseDelay = 0, step = 0.035) {
	return {
		...subtleSpringTransition,
		delay: baseDelay + index * step,
	};
}

export const subtleListLayoutTransition = {
	duration: 0.2,
	ease: "easeOut" as const,
};
