/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import DiscountPopup from './components/DiscountPopup';
import Chatbot from './components/Chatbot';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { HelmetProvider } from 'react-helmet-async';
import Cart from './components/Cart';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-[#0B0B0B]">
    <Loader2 className="w-10 h-10 text-brand-blue dark:text-neon-blue animate-spin" />
  </div>
);

function MainContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-[#0B0B0B] text-text-main dark:text-white selection:bg-brand-blue dark:selection:bg-neon-blue selection:text-white dark:selection:text-black font-sans transition-colors duration-300">
      <Navbar />
      <Cart />
      <main>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Suspense fallback={<PageLoader />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/produto/:id" element={<ProductDetail />} />
                <Route path="/sucesso" element={<SuccessPage />} />
                <Route path="/sobre" element={<AboutPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/contato" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/conta" element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <DiscountPopup />
      <Chatbot />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark" storageKey="nexus-theme">
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Router>
                <ScrollToTop />
                <MainContent />
              </Router>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
