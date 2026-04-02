import { useState } from 'react'
import { leadsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useUIStore } from '@/stores/uiStore'
import { UserCheck, ChevronRight, CheckCircle, Globe, Phone, Mail, Building } from 'lucide-react'

interface OnboardingForm {
  lead_id: number | null
  business_name: string
  segment: string
  phone: string
  email: string
  address: string
  website: string
  plan: string
  monthly_value: string
  notes: string
}

const PLANS = [
  { value: 'basico', label: 'Básico', price: 'R$ 47/mês' },
  { value: 'padrao', label: 'Padrão', price: 'R$ 67/mês' },
  { value: 'premium', label: 'Premium', price: 'R$ 97/mês' },
  { value: 'pro', label: 'Pro', price: 'R$ 150/mês' },
]

const STEPS = [
  { id: 1, label: 'Dados do Cliente', icon: Building },
  { id: 2, label: 'Plano Contratado', icon: CheckCircle },
  { id: 3, label: 'Confirmação', icon: UserCheck },
]

export default function Onboarding() {
  const { showSuccess, showError } = useUIStore()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState<OnboardingForm>({
    lead_id: null,
    business_name: '',
    segment: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    plan: 'padrao',
    monthly_value: '97',
    notes: '',
  })

  const handleNext = () => {
    if (step === 1 && !form.business_name) {
      showError('Informe o nome do negócio')
      return
    }
    setStep((s) => Math.min(s + 1, 3))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Create lead if no lead_id
      let leadId = form.lead_id
      if (!leadId) {
        const leadRes = await leadsApi.create({
          nome: form.business_name,
          categoria: form.segment,
          telefone: form.phone,
          email: form.email,
          endereco: form.address,
          url_site: form.website,
          tem_site: !!form.website,
        })
        leadId = leadRes.data.id

        // Update to "fechado"
        await leadsApi.updateStatus(leadId!, 'fechado', 'Cliente onboarded')
      }

      if (form.notes && leadId) {
        await leadsApi.addNote(leadId, `[ONBOARDING] Plano: ${form.plan} - R$ ${form.monthly_value}/mês\n${form.notes}`)
      }

      showSuccess('Cliente cadastrado com sucesso!', `${form.business_name} agora é cliente!`)
      setDone(true)
    } catch {
      showError('Erro ao cadastrar cliente')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Cliente cadastrado!</h2>
        <p className="text-gray-500 mt-2 mb-6">{form.business_name} foi adicionado com sucesso.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setDone(false); setStep(1); setForm({ lead_id: null, business_name: '', segment: '', phone: '', email: '', address: '', website: '', plan: 'padrao', monthly_value: '97', notes: '' }) }}>
            Novo Onboarding
          </Button>
          <Button onClick={() => window.location.href = '/crm'}>
            Ver no CRM
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Onboarding de Cliente</h1>
        <p className="text-sm text-gray-500 mt-1">Cadastre um novo cliente após fechamento</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${step >= s.id ? 'text-blue-600' : 'text-gray-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                step > s.id ? 'bg-blue-600 border-blue-600 text-white' :
                step === s.id ? 'border-blue-600 text-blue-600 bg-blue-50' :
                'border-gray-200 text-gray-400'
              }`}>
                {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 transition-colors ${step > s.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 - Client Data */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Nome do Negócio *"
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  placeholder="Ex: Restaurante do João"
                  required
                />
              </div>
              <Input
                label="Segmento / Categoria"
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value })}
                placeholder="Ex: Restaurante"
              />
              <Input
                label="Telefone / WhatsApp"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contato@negocio.com"
              />
              <Input
                label="Site (se houver)"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
              <div className="sm:col-span-2">
                <Input
                  label="Endereço"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Rua, número, cidade"
                />
              </div>
            </div>
            <Button onClick={handleNext} className="w-full">
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 - Plan */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Plano Contratado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setForm({ ...form, plan: p.value, monthly_value: p.price.replace('R$ ', '').replace('/mês', '') })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.plan === p.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold text-gray-900">{p.label}</p>
                  <p className="text-sm text-blue-600 font-medium">{p.price}</p>
                </button>
              ))}
            </div>

            <Input
              label="Valor da mensalidade (R$)"
              type="number"
              value={form.monthly_value}
              onChange={(e) => setForm({ ...form, monthly_value: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Detalhes do contrato, observações importantes..."
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Revisar
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 - Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Confirmar Cadastro</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{form.business_name}</span>
              </div>
              {form.segment && (
                <p className="text-sm text-gray-600">Segmento: {form.segment}</p>
              )}
              {form.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5" />
                  {form.phone}
                </div>
              )}
              {form.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5" />
                  {form.email}
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <p className="text-sm text-gray-600">
                  Plano: <strong className="capitalize">{form.plan}</strong> — R$ {form.monthly_value}/mês
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleSubmit} loading={submitting} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4" />
                Confirmar Cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
