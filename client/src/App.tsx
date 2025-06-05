import { useAppSelector } from "./app/hooks";
import { Login } from "./auth/Login";
import { Dashboard } from "./dashboard/Dashboard";

function App() {
  const token = useAppSelector((state) => state.auth.token);
  return token ? <Dashboard /> : <Login />;
}

export default App;
