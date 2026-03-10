import { useNavigate } from "react-router";
import ForgotPasswordForm from "@/components/forgot-password-form";

export default function ForgotPassword() {
	const navigate = useNavigate();

	return <ForgotPasswordForm onBackToSignIn={() => navigate("/login")} />;
}
