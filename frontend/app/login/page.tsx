import AuthScreen from "../components/AuthScreen";
import { PublicOnly } from "../components/AuthProvider";

export default function LoginPage() {
  return (
    <PublicOnly>
      <AuthScreen />
    </PublicOnly>
  );
}
