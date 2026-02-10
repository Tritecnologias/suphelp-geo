// Página de Cadastro
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Mail, Lock, User, Phone, Building, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    empresa: '',
    plano: 'basico' as 'basico' | 'profissional' | 'enterprise'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.nome || !formData.email || !formData.senha) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      await register({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        telefone: formData.telefone || undefined,
        empresa: formData.empresa || undefined,
        plano: formData.plano
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar usuário');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Cadastro realizado!</h1>
          <p className="text-slate-500 mb-4">
            Sua conta foi criada com sucesso. Redirecionando para o login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-lime-400 to-primary rounded-full flex items-center justify-center text-white shadow-lg">
              <Globe size={28} />
            </div>
            <span className="font-bold text-2xl text-primary tracking-tight">SupHelp Geo</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Crie sua conta</h1>
          <p className="text-slate-500">Comece grátis e teste por 7 dias</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-slate-700 mb-1">
                Nome completo *
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                  placeholder="Seu nome"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700 mb-1">
                Senha *
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                  placeholder="Mín. 6 caracteres"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-slate-700 mb-1">
                Confirmar senha *
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-slate-700 mb-1">
                Telefone
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 mb-1">
                Empresa
              </label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="plano" className="block text-sm font-medium text-slate-700 mb-1">
              Plano *
            </label>
            <select
              id="plano"
              name="plano"
              value={formData.plano}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm"
              required
            >
              <option value="basico">Básico - R$ 49/mês</option>
              <option value="profissional">Profissional - R$ 149/mês</option>
              <option value="enterprise">Enterprise - R$ 499/mês</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-slate-500 text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:text-secondary font-medium">
              Faça login
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

export default RegisterPage;