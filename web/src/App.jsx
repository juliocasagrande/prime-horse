import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FirstAccess from "./pages/FirstAccess";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import Movements from "./pages/Movements";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/primeiro-acesso" element={<FirstAccess />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/itens" element={<Items />} />
          <Route path="/movimentacoes" element={<Movements />} />
          <Route path="/notificacoes" element={<Notifications />} />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/usuarios" element={<Users />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
