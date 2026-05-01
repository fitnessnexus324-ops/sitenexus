import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Menu, X, Zap, Search, User, Moon, Sun, ArrowRight, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { products } from '../data/products';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [isCartBumping, setIsCartBumping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const suggestions = searchQuery.trim().length >= 2 
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (totalItems === 0) return;
    setIsCartBumping(true);
    const timer = setTimeout(() => setIsCartBumping(false), 300);
    return () => clearTimeout(timer);
  }, [totalItems]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Produtos', path: '/produtos' },
    { name: 'Sobre', path: '/sobre' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contato', path: '/contato' }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-brand-blue dark:bg-black/90 backdrop-blur-md py-4 shadow-lg shadow-black/10 dark:shadow-neon-blue/5' : 'bg-brand-blue/90 dark:bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <Zap className="w-8 h-8 text-white dark:text-neon-blue group-hover:text-glow transition-all" />
          <span className="font-display font-bold text-2xl tracking-wider hidden sm:block text-white">
            NEXUS<span className="text-white dark:text-neon-blue">FIT</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-sm font-medium text-white/90 dark:text-zinc-300 hover:text-white dark:hover:text-neon-blue transition-colors uppercase tracking-widest"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Search Bar (Desktop) */}
        <div ref={searchRef} className="hidden md:block relative w-full max-w-xs ml-auto">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-text-muted" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-white dark:bg-[#1A1A1A]/80 backdrop-blur-sm border border-transparent dark:border-white/10 rounded-full py-2 pl-10 pr-10 text-sm text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-0 dark:focus:border-neon-blue transition-all placeholder:text-zinc-400"
            />
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Loader2 className="w-4 h-4 text-brand-blue dark:text-neon-blue animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#121212] border border-light-border dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-2">
                  {suggestions.map((product) => (
                    <Link
                      key={product.id}
                      to={`/produto/${product.id}`}
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group"
                    >
                      <div className="w-10 h-10 bg-light-surface dark:bg-zinc-900 rounded-lg p-1 flex items-center justify-center shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-main dark:text-white truncate group-hover:text-brand-blue dark:group-hover:text-neon-blue transition-colors">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">{product.category}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-brand-blue dark:text-neon-blue opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="w-full mt-2 p-2 text-xs font-bold uppercase tracking-widest text-brand-blue dark:text-neon-blue hover:bg-brand-blue/10 dark:hover:bg-neon-blue/10 rounded-xl transition-colors text-center"
                  >
                    Ver todos os resultados
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-white/90 dark:text-zinc-300 hover:text-white dark:hover:text-neon-blue transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <Link to={user ? "/conta" : "/login"} className="p-2 text-white/90 dark:text-zinc-300 hover:text-white dark:hover:text-neon-blue transition-colors hidden sm:block">
            <User className="w-6 h-6" />
          </Link>
          
          <motion.button 
            onClick={() => setIsCartOpen(true)}
            animate={isCartBumping ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative p-2 text-white/90 dark:text-zinc-300 hover:text-white dark:hover:text-neon-blue transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 bg-brand-green dark:bg-neon-blue text-white dark:text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              >
                {totalItems}
              </motion.span>
            )}
          </motion.button>
          
          <button 
            className="lg:hidden p-2 text-white/90 dark:text-zinc-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              closed: { 
                opacity: 0, 
                height: 0,
                transition: { 
                  staggerChildren: 0.05, 
                  staggerDirection: -1,
                  when: "afterChildren"
                } 
              },
              open: { 
                opacity: 1, 
                height: "auto",
                transition: { 
                  staggerChildren: 0.1, 
                  delayChildren: 0.1 
                } 
              }
            }}
            className="lg:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-t border-light-border dark:border-white/10 py-6 px-6 flex flex-col gap-6 shadow-2xl overflow-hidden"
          >
            <motion.div 
              variants={{
                closed: { opacity: 0, x: -20 },
                open: { opacity: 1, x: 0 }
              }}
              className="relative w-full"
            >
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-light-surface dark:bg-[#1A1A1A] border border-light-border dark:border-white/10 rounded-full py-3 pl-10 pr-10 text-sm text-text-main dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-neon-blue transition-colors"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-brand-blue dark:text-neon-blue animate-spin" />
                  </div>
                )}
              </form>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#121212] border border-light-border dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2">
                      {suggestions.map((product) => (
                        <Link
                          key={product.id}
                          to={`/produto/${product.id}`}
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery('');
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group"
                        >
                          <div className="w-10 h-10 bg-light-surface dark:bg-zinc-900 rounded-lg p-1 flex items-center justify-center shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-main dark:text-white truncate group-hover:text-brand-blue dark:group-hover:text-neon-blue transition-colors">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider">{product.category}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-brand-blue dark:text-neon-blue opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {navLinks.map((item) => (
              <motion.div
                key={item.name}
                variants={{
                  closed: { opacity: 0, x: -20 },
                  open: { opacity: 1, x: 0 }
                }}
                whileTap={{ x: 10 }}
              >
                <Link
                  to={item.path}
                  className="text-lg font-display font-medium text-text-muted dark:text-zinc-300 hover:text-brand-blue dark:hover:text-neon-blue transition-colors uppercase tracking-widest block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
            
            <motion.div 
              variants={{
                closed: { opacity: 0, x: -20 },
                open: { opacity: 1, x: 0 }
              }}
              className="border-t border-light-border dark:border-white/10 pt-6 flex items-center gap-4"
            >
              <Link 
                to={user ? "/conta" : "/login"}
                className="flex items-center gap-2 text-text-muted dark:text-zinc-300 hover:text-brand-blue dark:hover:text-neon-blue transition-colors uppercase tracking-widest text-sm font-bold"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" /> {user ? "Minha Conta" : "Entrar / Cadastrar"}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
