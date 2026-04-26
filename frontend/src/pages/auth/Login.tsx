import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'
import { Zap, Eye, EyeOff, CheckCircle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (mode === 'login') {
        await login(form.email, form.senha)
        navigate('/app')
      } else {
        setSubmitting(true)
        await authApi.register(form.nome, form.email, form.senha)
        setRegisterSuccess(true)
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr?.response?.data?.detail || 'Erro ao processar sua solicitacao')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">LocalReach AI</h1>
          <p className="text-blue-200 mt-1">Prospeccao e vendas para negocios locais</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {registerSuccess ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Solicitacao Enviada!</h2>
              <p className="text-gray-500 mb-1">Sua solicitacao de acesso foi registrada.</p>
              <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mt-4">
                <Clock className="w-4 h-4" />
                Aguarde a aprovacao do administrador
              </div>
              <button
                onClick={() => { setRegisterSuccess(false); setMode('login'); setForm({ nome: '', email: '', senha: '' }) }}
                className="mt-6 text-sm text-blue-600 hover:underline font-medium"
              >
                Voltar para login
              </button>
            </div>
          ) : (
            <>
              <div className="flex border-b border-gray-100 mb-6">
                <button
                  onClick={() => { setMode('login'); setError('') }}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    mode === 'login'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => { setMode('register'); setError('') }}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    mode === 'register'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Solicitar Acesso
                </button>
              </div>

              {mode === 'register' && (
                <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg p-3 mb-4">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  O acesso sera liberado apos aprovacao do administrador
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <Input
                    label="Nome completo"
                    name="nome"
                    type="text"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    required
                    autoComplete="name"
                  />
                )}

                <Input
                  label="E-mail"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />

                <div className="relative">
                  <Input
                    label="Senha"
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    value={form.senha}
                    onChange={handleChange}
                    placeholder="********"
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={isLoading || submitting}
                >
                  {mode === 'login' ? 'Entrar' : 'Solicitar Acesso'}
                </Button>
              </form>

              {mode === 'login' && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  Nao tem conta?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Solicite acesso
                  </button>
                </p>
              )}
            </>
          )}
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          &copy; 2026 LocalReach AI. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
