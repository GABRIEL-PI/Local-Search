import { useState, useEffect } from 'react'
import { settingsApi } from '@/lib/api'
import { UserSettings, WhatsAppAccount } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { useUIStore } from '@/stores/uiStore'
import {
  Settings as SettingsIcon, MessageCircle, Key, Clock,
  Plus, Check, RefreshCw, Smartphone
} from 'lucide-react'

export default function Settings() {
  const { showSuccess, showError } = useUIStore()
  const [config, setConfig] = useState<UserSettings | null>(null)
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    limite_disparos_dia: 50,
    horario_inicio: '08:00',
    horario_fim: '19:00',
    claude_api_key: '',
    evolution_api_url: '',
    evolution_api_key: '',
  })

  const [newAccount, setNewAccount] = useState({ nome: '', instancia_id: '' })
  const [addingAccount, setAddingAccount] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [configRes, accountsRes] = await Promise.all([
        settingsApi.get(),
        settingsApi.getWhatsAppAccounts(),
      ])
      setConfig(configRes.data)
      setForm({
        limite_disparos_dia: configRes.data.limite_disparos_dia,
        horario_inicio: configRes.data.horario_inicio,
        horario_fim: configRes.data.horario_fim,
        claude_api_key: '',
        evolution_api_url: configRes.data.evolution_api_url || '',
        evolution_api_key: '',
      })
      setAccounts(accountsRes.data)
    } catch {
      showError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Record<string, unknown> = {
        limite_disparos_dia: form.limite_disparos_dia,
        horario_inicio: form.horario_inicio,
        horario_fim: form.horario_fim,
        evolution_api_url: form.evolution_api_url || null,
      }
      if (form.claude_api_key) data.claude_api_key = form.claude_api_key
      if (form.evolution_api_key) data.evolution_api_key = form.evolution_api_key

      await settingsApi.update(data)
      showSuccess('Configurações salvas!')
      loadAll()
    } catch {
      showError('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount.nome || !newAccount.instancia_id) return
    setAddingAccount(true)
    try {
      await settingsApi.createWhatsAppAccount(newAccount)
      showSuccess('Conta adicionada!')
      setNewAccount({ nome: '', instancia_id: '' })
      const res = await settingsApi.getWhatsAppAccounts()
      setAccounts(res.data)
    } catch {
      showError('Erro ao adicionar conta')
    } finally {
      setAddingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie as integrações e limites da plataforma</p>
      </div>

      {/* WhatsApp Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <CardTitle>Contas WhatsApp</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma conta conectada</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{acc.nome}</p>
                      <p className="text-xs text-gray-500">ID: {acc.instancia_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{acc.disparos_hoje} hoje</span>
                    <Badge
                      variant={
                        acc.status === 'conectado' ? 'success' :
                        acc.status === 'qrcode' ? 'warning' : 'danger'
                      }
                    >
                      {acc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Adicionar Nova Conta</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nome da conta"
                value={newAccount.nome}
                onChange={(e) => setNewAccount({ ...newAccount, nome: e.target.value })}
                placeholder="Ex: WhatsApp Principal"
              />
              <Input
                label="ID da Instância (Evolution API)"
                value={newAccount.instancia_id}
                onChange={(e) => setNewAccount({ ...newAccount, instancia_id: e.target.value })}
                placeholder="Ex: minha-instancia"
              />
            </div>
            <Button
              size="sm"
              className="mt-3"
              onClick={handleAddAccount}
              loading={addingAccount}
              disabled={!newAccount.nome || !newAccount.instancia_id}
            >
              <Plus className="w-4 h-4" />
              Adicionar Conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <CardTitle>Integrações API</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              label="Claude API Key (Anthropic)"
              type="password"
              value={form.claude_api_key}
              onChange={(e) => setForm({ ...form, claude_api_key: e.target.value })}
              placeholder={config?.has_claude_key ? '••••••••• (configurada)' : 'sk-ant-...'}
              helperText="Necessário para geração de propostas com IA"
            />
            {config?.has_claude_key && (
              <div className="flex items-center gap-1 mt-1">
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">Chave configurada</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Evolution API URL"
              value={form.evolution_api_url}
              onChange={(e) => setForm({ ...form, evolution_api_url: e.target.value })}
              placeholder="http://localhost:8080"
              helperText="URL da sua instância Evolution API"
            />
            <Input
              label="Evolution API Key"
              type="password"
              value={form.evolution_api_key}
              onChange={(e) => setForm({ ...form, evolution_api_key: e.target.value })}
              placeholder={config?.has_evolution_key ? '••••••••• (configurada)' : 'sua-api-key'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <CardTitle>Limites e Horários</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limite de disparos por dia: <strong className="text-blue-600">{form.limite_disparos_dia}</strong>
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={form.limite_disparos_dia}
              onChange={(e) => setForm({ ...form, limite_disparos_dia: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10</span><span>200</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário início</label>
              <input
                type="time"
                value={form.horario_inicio}
                onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário fim</label>
              <input
                type="time"
                value={form.horario_fim}
                onChange={(e) => setForm({ ...form, horario_fim: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} loading={saving} size="lg">
        <Check className="w-4 h-4" />
        Salvar Configurações
      </Button>
    </div>
  )
}
