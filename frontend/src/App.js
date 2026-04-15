import "./App.css";
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavigationBar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import HomePage from "./components/HomePage/HomePage";
import SignUpPage from "./components/SignUpPage/SignUpPage";
import LoginPage from "./components/LoginPage/LoginPage";
import BuyPage from "./components/BuyPage/BuyPage";
import Account from "./components/Account/Account";
import PasswordReset from "./components/PasswordReset/PasswordReset";
import CheckoutSummary from "./components/CheckoutSummary/CheckoutSummary";
import Bill from "./components/Bill/Bill";
import AdminDashboard from "./components/Admin/AdminDashboard";
import ReOrder from "./components/ReOrder/ReOrder";
import CategoryPage from "./components/CategoryPage/CategoryPage";
import ProductDetail from "./components/ProductDetail/ProductDetail";

function App() {
  return (
    <>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/cart" element={<CheckoutSummary />} />
        <Route path="/reorder/:billId" element={<ReOrder />} />
        <Route path="/bill" element={<Bill />} />
        {/* CÁC ROUTE MUA HÀNG */}
        <Route
          path="/buyPhone"
          element={<BuyPage apiEndpoint="iphones" productType="Iphone" />}
        />
        <Route
          path="/buyIpad"
          element={<BuyPage apiEndpoint="ipads" productType="Ipad" />}
        />
        <Route
          path="/buyMac"
          element={<BuyPage apiEndpoint="macs" productType="Mac" />}
        />
        <Route
          path="/buyWatch"
          element={<BuyPage apiEndpoint="watchs" productType="Watch" />}
        />
        <Route
          path="/buyEarphone"
          element={<BuyPage apiEndpoint="earphones" productType="Earphone" />}
        />

        {/* CÁC ROUTE DANH MỤC (CATEGORY) */}
        <Route
          path="/iphone"
          element={
            <CategoryPage
              title="iPhone"
              apiEndpoint="iphones"
              productType="Iphone"
              itemRoutePrefix="iphone"
              buyRoute="/buyPhone"
            />
          }
        />
        <Route
          path="/ipad"
          element={
            <CategoryPage
              title="iPad"
              apiEndpoint="ipads"
              productType="Ipad"
              itemRoutePrefix="ipad"
              buyRoute="/buyIpad"
            />
          }
        />
        <Route
          path="/mac"
          element={
            <CategoryPage
              title="Mac"
              apiEndpoint="macs"
              productType="Mac"
              itemRoutePrefix="mac"
              buyRoute="/buyMac"
            />
          }
        />
        <Route
          path="/watch"
          element={
            <CategoryPage
              title="Apple Watch"
              apiEndpoint="watchs"
              productType="Watch"
              itemRoutePrefix="watch"
              buyRoute="/buyWatch"
            />
          }
        />
        <Route
          path="/earphone"
          element={
            <CategoryPage
              title="Tai nghe"
              apiEndpoint="earphones"
              productType="Earphone"
              itemRoutePrefix="earphone"
              buyRoute="/buyEarphone"
            />
          }
        />

        {/* CÁC ROUTE CHI TIẾT (DETAIL) */}
        <Route
          path="/iphone/:name"
          element={
            <ProductDetail
              apiEndpoint="iphones"
              productType="Iphone"
              relatedType="iphone"
              buyRoute="/buyPhone"
            />
          }
        />
        <Route
          path="/ipad/:name"
          element={
            <ProductDetail
              apiEndpoint="ipads"
              productType="Ipad"
              relatedType="ipad"
              buyRoute="/buyIpad"
            />
          }
        />
        <Route
          path="/mac/:name"
          element={
            <ProductDetail
              apiEndpoint="macs"
              productType="Mac"
              relatedType="mac"
              buyRoute="/buyMac"
            />
          }
        />
        <Route
          path="/watch/:name"
          element={
            <ProductDetail
              apiEndpoint="watchs"
              productType="Watch"
              relatedType="watch"
              buyRoute="/buyWatch"
            />
          }
        />
        <Route
          path="/earphone/:name"
          element={
            <ProductDetail
              apiEndpoint="earphones"
              productType="Earphone"
              relatedType="earphone"
              buyRoute="/buyEarphone"
            />
          }
        />

        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
