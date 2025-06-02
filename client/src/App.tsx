import { useAppSelector } from "./app/hooks";
import { Login } from "./auth/Login";
import { Dashboard } from "./dashboard/Dashboard";

function App() {
  const token = useAppSelector((state) => state.auth.token);
  console.log("🔄 App render – state.auth.token →", token);
  return token ? <Dashboard /> : <Login />;
}

export default App;
