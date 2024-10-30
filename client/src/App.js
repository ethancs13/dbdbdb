import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import AdminHeader from "./components/adminHeader";
import UserHeader from "./components/userHeader";
import ChangePassword from "./components/changePassword";
import UserNavigation from "./components/userNavigation";
import UserDetail from "./components/userDetail";
import Admin from "./pages/Admin";
import Itemized from "./pages/Itemized";
import General from "./pages/General";
import Mileage from "./pages/Mileage";
import Files from "./pages/Files";
import FoodBev from "./pages/FoodBev";
import Summary from "./pages/Summary";
import History from "./pages/History";
import ThankYou from "./pages/ThankYou";
import UserProfile from "./pages/UserProfile";
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
            <Route path="/user/:id" element={<UserDetail />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<Admin />} />
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
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/" element={<Summary />} />
          <Route path="/itemized-purchases" element={<Itemized />} />
          <Route path="/general" element={<General />} />
          <Route path="/food-beverage" element={<FoodBev />} />
          <Route path="/mileage" element={<Mileage />} />
          <Route path="/upload-files" element={<Files />} />
          <Route path="/history" element={<History />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="*" element={<Summary />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
