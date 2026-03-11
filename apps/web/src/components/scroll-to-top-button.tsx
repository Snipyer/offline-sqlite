import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "@offline-sqlite/i18n";

import { Button } from "@/components/ui/button";

const SCROLL_OFFSET_TO_SHOW = 0;

export function ScrollToTopButton() {
	const { t } = useTranslation();
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const scrollContainer = document.querySelector<HTMLElement>(".app-content");
		const getScrollTop = () => scrollContainer?.scrollTop ?? window.scrollY;

		const onScroll = () => {
			setIsVisible(getScrollTop() > SCROLL_OFFSET_TO_SHOW);
		};

		onScroll();

		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", onScroll, { passive: true });
		} else {
			window.addEventListener("scroll", onScroll, { passive: true });
		}

		return () => {
			if (scrollContainer) {
				scrollContainer.removeEventListener("scroll", onScroll);
			} else {
				window.removeEventListener("scroll", onScroll);
			}
		};
	}, []);

	if (!isVisible) {
		return null;
	}

	return (
		<Button
			type="button"
			size="icon"
			className="bg-primary fixed right-2.5 bottom-10 z-9999 cursor-pointer rounded-full"
			onClick={() => {
				const scrollContainer = document.querySelector<HTMLElement>(".app-content");

				if (scrollContainer) {
					scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
					return;
				}

				window.scrollTo({ top: 0, behavior: "smooth" });
			}}
			aria-label={t("common.scrollToTop")}
		>
			<ArrowUp className="h-4 w-4" />
		</Button>
	);
}
