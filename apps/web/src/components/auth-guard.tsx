import { useEffect } from "react";
import { useNavigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import Loader from "@/components/loader";

export function useAuthGuard() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();

	useEffect(() => {
		if (!session && !isPending) {
			navigate("/login");
		}
	}, [session, isPending, navigate]);

	return { session, isPending };
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const { isPending } = useAuthGuard();

	if (isPending) {
		return <Loader />;
	}

	return <>{children}</>;
}
