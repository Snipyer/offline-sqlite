import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { authClient } from "@/lib/auth-client";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import Loader from "@/components/loader";

export default function Login() {
	const [showSignIn, setShowSignIn] = useState(false);
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();

	useEffect(() => {
		if (session) {
			navigate("/dashboard");
		}
	}, [session, navigate]);

	if (isPending) {
		return <Loader />;
	}

	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}
