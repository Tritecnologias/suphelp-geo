// Página de Login
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSiteConfig } from '../contexts/SiteConfigContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { config } = useSiteConfig();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !senha) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      await login({ email, senha });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.siteName} className="w-12 h-12 rounded-full object-cover shadow-lg" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-tr from-lime-400 to-primary rounded-full flex items-center justify-center text-white shadow-lg">
                <Globe size={28} />
              </div>
            )}
            <span className="font-bold text-2xl text-primary tracking-tight">{config.siteName}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo de volta!</h1>
          <p className="text-slate-500">Faça login para acessar sua conta</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-slate-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-slate-500 text-sm">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-primary hover:text-secondary font-medium">
              Cadastre-se grátis
            </Link>
          </p>
          
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition"
          >
            <ArrowLeft size={16} />
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;