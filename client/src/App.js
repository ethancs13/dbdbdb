import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import AdminHeader from "./components/adminHeader";
import UserHeader from "./components/userHeader";
import AdminNavigation from "./components/adminNavigation";
import UserNavigation from "./components/userNavigation";
import AdminUsers from "./components/adminUsers";
import UserDetail from "./components/userDetail";
import AdminDashboard from "./components/adminDashboard";
import Admin from "./pages/Admin";
import LogoutButton from "./components/LogoutButton";
import Itemized from "./pages/Itemized";
import General from "./pages/General";
import Mileage from "./pages/Mileage";
import Files from "./pages/Files";
import FoodBev from "./pages/FoodBev";
import Summary from "./pages/Summary";
import History from "./pages/History";
import ThankYou from "./pages/ThankYou";
import { FormProvider } from "./context/FormContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HistoryProvider } from "./context/HistoryContext";
import AuthNavigator from "./AuthNavigator";
import "./css/App.css";

function App() {
  return (
    <FormProvider>
      <HistoryProvider>
        <BrowserRouter>
          <AuthProvider>
            <AuthNavigator>
              <AuthConsumer />
            </AuthNavigator>
          </AuthProvider>
        </BrowserRouter>
      </HistoryProvider>
    </FormProvider>
  );
}

function AuthConsumer() {
  const { isAuthenticated, userRole } = useAuth();
  console.log(userRole);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signup" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (userRole === "admin") {
    return (
      <>
        <AdminHeader />
        <div className="main-content">
          <Routes>
            <Route path="/signup" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Admin />} />
            {/* <Route path="/" element={<AdminDashboard />} /> */}
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/user/:id" element={<UserDetail />} />
          </Routes>
        </div>
      </>
    );
  }

  return (
    <>
      <UserHeader />
      <UserNavigation />
      <div className="main-content">
        <Routes>
          <Route path="/signup" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Summary />} />
          <Route path="/itemized-purchases" element={<Itemized />} />
          <Route path="/general" element={<General />} />
          <Route path="/food-beverage" element={<FoodBev />} />
          <Route path="/mileage" element={<Mileage />} />
          <Route path="/upload-files" element={<Files />} />
          <Route path="/history" element={<History />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
