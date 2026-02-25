import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "@offline-sqlite/i18n";

import { Button } from "@/components/ui/button";

const SCROLL_OFFSET_TO_SHOW = 240;

export function ScrollToTopButton() {
	const { t } = useTranslation();
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => {
			setIsVisible(window.scrollY > SCROLL_OFFSET_TO_SHOW);
		};

		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", onScroll);
		};
	}, []);

	if (!isVisible) {
		return null;
	}

	return (
		<Button
			type="button"
			size="icon"
			className="fixed right-5 bottom-5 z-50 cursor-pointer rounded-full"
			onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
			aria-label={t("common.scrollToTop")}
		>
			<ArrowUp className="h-4 w-4" />
		</Button>
	);
}
