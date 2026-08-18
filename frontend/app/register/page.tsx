import AuthScreen from "../components/AuthScreen";
import { PublicOnly } from "../components/AuthProvider";

export default function RegisterPage() {
  return (
    <PublicOnly>
      <AuthScreen register />
    </PublicOnly>
  );
}
