import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import Header from "./components/Header";
import Navigation from "./components/TopNavigationBar";
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
import "./css/App.css";

function App() {
  return (
    <FormProvider>
      <AuthProvider>
        <HistoryProvider>
          <BrowserRouter>
            <AuthConsumer />
          </BrowserRouter>
        </HistoryProvider>
      </AuthProvider>
    </FormProvider>
  );
}

function AuthConsumer() {
  const { isAuthenticated } = useAuth();

  return (
    <>
    {isAuthenticated && <Header />}
      {isAuthenticated && <Navigation />}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Summary />} />
          <Route path="/itemized-purchases" element={<Itemized />} />
          <Route path="/general" element={<General />} />
          <Route path="/food-beverage" element={<FoodBev />} />
          <Route path="/mileage" element={<Mileage />} />
          <Route path="/upload-files" element={<Files />} />
          {/* <Route path="/summary" element={<Summary />} /> */}
          <Route path="/signup" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/history" element={<History />} />
          <Route path="/thank-you" element={<ThankYou />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
