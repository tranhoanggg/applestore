import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavigationBar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import HomePage from "./components/HomePage/HomePage";
import SignUpPage from "./components/SignUpPage/SignUpPage";
import LoginPage from "./components/LoginPage/LoginPage";
import BuyPhone from "./components/BuyPhone/BuyPhone";
import BuyIpad from "./components/BuyIpad/BuyIpad";
import BuyMac from "./components/BuyMac/BuyMac";
import BuyWatch from "./components/BuyWatch/BuyWatch";
import Account from "./components/Account/Account";
import PasswordReset from "./components/PasswordReset/PasswordReset";
import CheckoutSummary from "./components/CheckoutSummary/CheckoutSummary";
import Bill from "./components/Bill/Bill";

function AppContent() {
  return (
    <>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/buyPhone" element={<BuyPhone />} />
        <Route path="/buyIpad" element={<BuyIpad />} />
        <Route path="/buyMac" element={<BuyMac />} />
        <Route path="/buyWatch" element={<BuyWatch />} />
        <Route path="/account" element={<Account />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/cart" element={<CheckoutSummary />} />
        <Route path="/bill" element={<Bill />} />
      </Routes>
      <Footer />
    </>
  );
}

export default AppContent;
