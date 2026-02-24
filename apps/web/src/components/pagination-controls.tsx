import { useTranslation } from "@offline-sqlite/i18n";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationControlsProps = {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
	scrollTarget?: string;
};

function isScrollableElement(element: HTMLElement) {
	const { overflowY } = window.getComputedStyle(element);
	const supportsScroll = overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";

	return supportsScroll && element.scrollHeight > element.clientHeight;
}

function findScrollableAncestor(startElement: HTMLElement | null) {
	let current = startElement?.parentElement ?? null;

	while (current) {
		if (isScrollableElement(current)) {
			return current;
		}

		current = current.parentElement;
	}

	return null;
}

function scrollAfterPageChange(scrollTarget?: string, fallbackElement?: HTMLElement | null) {
	if (typeof window === "undefined") {
		return;
	}

	const scrollToTop = () => {
		const scrollableAncestor = findScrollableAncestor(fallbackElement ?? null);

		if (scrollableAncestor) {
			scrollableAncestor.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		const scrollingElement = document.scrollingElement;

		if (scrollingElement) {
			scrollingElement.scrollTo({ top: 0, behavior: "smooth" });
		}

		document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
		document.body.scrollTo({ top: 0, behavior: "smooth" });
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if (scrollTarget) {
		const normalizedTarget = scrollTarget.startsWith("#") ? scrollTarget.slice(1) : scrollTarget;
		const targetElement = document.getElementById(normalizedTarget);

		if (targetElement) {
			window.requestAnimationFrame(() => {
				targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
			});
			return;
		}
	}

	window.requestAnimationFrame(() => {
		scrollToTop();
		window.requestAnimationFrame(scrollToTop);
	});
}

function buildPaginationPages(page: number, totalPages: number): Array<number | "ellipsis"> {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, index) => index + 1);
	}

	if (page <= 3) {
		return [1, 2, 3, 4, "ellipsis", totalPages];
	}

	if (page >= totalPages - 2) {
		return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
	}

	return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

export function PaginationControls({
	page,
	totalPages,
	onPageChange,
	className,
	scrollTarget,
}: PaginationControlsProps) {
	const { t } = useTranslation();
	const previousPageRef = useRef(page);
	const paginationRootRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (previousPageRef.current !== page) {
			scrollAfterPageChange(scrollTarget, paginationRootRef.current);
			previousPageRef.current = page;
		}
	}, [page, scrollTarget]);

	if (totalPages <= 1) {
		return null;
	}

	const pages = buildPaginationPages(page, totalPages);

	const handlePageChange = (nextPage: number) => {
		if (nextPage === page) {
			return;
		}

		scrollAfterPageChange(scrollTarget, paginationRootRef.current);
		onPageChange(nextPage);
	};

	return (
		<div ref={paginationRootRef}>
			<Pagination className={className}>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href="#"
							text={t("common.previous")}
							aria-disabled={page <= 1}
							className={cn(page <= 1 && "pointer-events-none opacity-50")}
							onClick={(event) => {
								event.preventDefault();
								if (page > 1) {
									handlePageChange(page - 1);
								}
							}}
						/>
					</PaginationItem>
					{pages.map((paginationPage, index) => {
						if (paginationPage === "ellipsis") {
							return (
								<PaginationItem key={`ellipsis-${index}`}>
									<PaginationEllipsis />
								</PaginationItem>
							);
						}

						const isCurrentPage = paginationPage === page;

						return (
							<PaginationItem key={paginationPage}>
								<PaginationLink
									href="#"
									aria-label={t("common.pageAria", { page: paginationPage })}
									aria-disabled={isCurrentPage}
									isActive={isCurrentPage}
									className={cn(isCurrentPage && "pointer-events-none")}
									onClick={(event) => {
										event.preventDefault();
										handlePageChange(paginationPage);
									}}
								>
									{paginationPage}
								</PaginationLink>
							</PaginationItem>
						);
					})}
					<PaginationItem>
						<PaginationNext
							href="#"
							text={t("common.next")}
							aria-disabled={page >= totalPages}
							className={cn(page >= totalPages && "pointer-events-none opacity-50")}
							onClick={(event) => {
								event.preventDefault();
								if (page < totalPages) {
									handlePageChange(page + 1);
								}
							}}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
