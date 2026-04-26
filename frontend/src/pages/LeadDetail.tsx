import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { leadsApi, proposalsApi } from '@/lib/api'
import { Lead, Nota, Proposal, DadosExtras } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LeadScore from '@/components/leads/LeadScore'
import { useUIStore } from '@/stores/uiStore'
import {
  ArrowLeft, Globe, Phone, Mail, MapPin, Star,
  FileText, MessageCircle, Plus, Clock, CheckCircle,
  Sparkles, RefreshCw, Camera, Wifi, ExternalLink,
  DollarSign, Users, Image, ThumbsUp, Navigation, Calendar
} from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, formatDate, formatCurrency, cn } from '@/lib/utils'

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useUIStore()

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [generatingProposal, setGeneratingProposal] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'fotos' | 'reviews' | 'proposals' | 'notes'>('info')

  useEffect(() => {
    if (!id) return
    loadLead()
  }, [id])

  const loadLead = async () => {
    setLoading(true)
    try {
      const res = await leadsApi.get(Number(id))
      setLead(res.data)
    } catch {
      showError('Lead nao encontrado')
      navigate('/app/crm')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !id) return
    setAddingNote(true)
    try {
      await leadsApi.addNote(Number(id), noteText)
      setNoteText('')
      showSuccess('Nota adicionada')
      loadLead()
    } catch {
      showError('Erro ao adicionar nota')
    } finally {
      setAddingNote(false)
    }
  }

  const handleGenerateProposal = async () => {
    if (!id) return
    setGeneratingProposal(true)
    try {
      await proposalsApi.generate(Number(id))
      showSuccess('Proposta em geracao!', 'Voce sera notificado quando estiver pronta')
    } catch {
      showError('Erro ao gerar proposta')
    } finally {
      setGeneratingProposal(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!id) return
    try {
      await leadsApi.updateStatus(Number(id), status)
      showSuccess('Status atualizado')
      loadLead()
    } catch {
      showError('Erro ao atualizar status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!lead) return null

  const extras = lead.dados_extras || {} as DadosExtras
  const images = extras.images || []
  const reviews = extras.user_reviews || []
  const about = extras.about || []
  const openHours = extras.open_hours || {}
  const reviewsPerRating = extras.reviews_per_rating || {}
  const thumbnail = extras.thumbnail || ''

  return (
    <div className="space-y-6">
      {/* Header with thumbnail */}
      <div className="flex items-start gap-4">
        <Link to="/app/crm">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        {thumbnail && (
          <img
            src={thumbnail}
            alt={lead.nome}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.nome}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {lead.categoria && (
                  <Badge variant="info">{lead.categoria}</Badge>
                )}
                {lead.cidade && (
                  <span className="text-sm text-gray-500">{lead.cidade}{lead.estado ? `, ${lead.estado}` : ''}</span>
                )}
                {lead.price_range && (
                  <span className="text-sm text-green-600 font-medium">{lead.price_range}</span>
                )}
              </div>
              {extras.description && (
                <p className="text-sm text-gray-500 mt-1">{extras.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <LeadScore score={lead.lead_score} size="lg" />
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rating bar */}
          {lead.rating && (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold">{Number(lead.rating).toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-500">({lead.reviews_count} avaliacoes)</span>
              {Object.keys(reviewsPerRating).length > 0 && (
                <div className="flex items-center gap-1">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const count = reviewsPerRating[String(n)] || 0
                    const total = Object.values(reviewsPerRating).reduce((a: number, b) => a + (b as number), 0) as number
                    const pct = total > 0 ? (count / total) * 100 : 0
                    return (
                      <div key={n} className="flex items-center gap-1 text-xs">
                        <span className="text-gray-400 w-2">{n}</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGenerateProposal} loading={generatingProposal} size="sm">
          <Sparkles className="w-4 h-4" />
          Gerar Proposta IA
        </Button>
        {(lead.whatsapp || lead.telefone) && (
          <a href={`https://wa.me/${(lead.whatsapp || lead.telefone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-700">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </a>
        )}
        {lead.google_maps_link && (
          <a href={lead.google_maps_link} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Navigation className="w-4 h-4" />
              Google Maps
            </Button>
          </a>
        )}
        {lead.url_site && (
          <a href={lead.url_site} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Globe className="w-4 h-4" />
              Site
            </Button>
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {([
            { key: 'info', label: 'Informacoes' },
            { key: 'fotos', label: `Fotos (${images.length})` },
            { key: 'reviews', label: `Avaliacoes (${reviews.length})` },
            { key: 'proposals', label: 'Propostas' },
            { key: 'notes', label: 'Notas' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* INFO TAB */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact */}
          <Card>
            <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lead.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${lead.telefone}`} className="text-sm text-blue-600 hover:underline">{lead.telefone}</a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline">{lead.email}</a>
                </div>
              )}
              {lead.endereco && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{lead.endereco}</span>
                </div>
              )}
              {extras.complete_address?.postal_code && (
                <div className="text-xs text-gray-400 ml-7">CEP: {extras.complete_address.postal_code}</div>
              )}
              {extras.owner && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{extras.owner.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hours */}
          <Card>
            <CardHeader><CardTitle>Horario de Funcionamento</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(openHours).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(openHours).map(([day, times]) => (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{day}</span>
                      <span className={cn("font-medium", Array.isArray(times) && times[0] === 'Fechado' ? 'text-red-500' : 'text-gray-900')}>
                        {Array.isArray(times) ? times.join(', ') : String(times)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Horario nao disponivel</p>
              )}
            </CardContent>
          </Card>

          {/* Digital Presence */}
          <Card>
            <CardHeader><CardTitle>Presenca Digital</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Site</span>
                </div>
                {lead.tem_site ? (
                  <Badge variant="success">Possui</Badge>
                ) : (
                  <Badge variant="danger">Sem site</Badge>
                )}
              </div>
              {lead.url_site && (
                <a href={lead.url_site} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block ml-6 truncate">
                  {lead.url_site}
                </a>
              )}
              {lead.tem_site && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm ml-6">SSL</span>
                    <Badge variant={lead.ssl_valido ? 'success' : 'danger'}>{lead.ssl_valido ? 'Valido' : 'Invalido'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm ml-6">Mobile</span>
                    <Badge variant={lead.mobile_friendly ? 'success' : 'danger'}>{lead.mobile_friendly ? 'Sim' : 'Nao'}</Badge>
                  </div>
                  {lead.site_score !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm ml-6">Score</span>
                      <span className="font-bold text-sm">{lead.site_score}/100</span>
                    </div>
                  )}
                </>
              )}
              {lead.dominio_sugerido && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">Dominio sugerido:</p>
                  <p className="text-sm font-bold text-blue-900">{lead.dominio_sugerido}</p>
                  {lead.dominio_disponivel && <Badge variant="success" className="mt-1">Disponivel!</Badge>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* About / Amenities */}
          {about.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Sobre o Negocio</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {about.map((section) => (
                  <div key={section.id}>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">{section.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {section.options.map((opt, i) => (
                        <span
                          key={i}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            opt.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'
                          )}
                        >
                          {opt.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reservations / Order Online */}
          {(extras.reservations?.length || extras.order_online?.length) ? (
            <Card>
              <CardHeader><CardTitle>Links Uteis</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {extras.reservations?.map((r, i) => (
                  <a key={`res-${i}`} href={r.link.startsWith('http') ? r.link : `https://google.com${r.link}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Calendar className="w-4 h-4" />
                    Reserva via {r.source}
                  </a>
                ))}
                {extras.order_online?.map((r, i) => (
                  <a key={`order-${i}`} href={r.link.startsWith('http') ? r.link : `https://google.com${r.link}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="w-4 h-4" />
                    Pedir online via {r.source}
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* PHOTOS TAB */}
      {activeTab === 'fotos' && (
        <div>
          {images.length === 0 ? (
            <Card><CardContent className="py-16 text-center">
              <Image className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma foto disponivel</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.image}
                    alt={img.title || `Foto ${i + 1}`}
                    className="w-full h-48 object-cover rounded-xl"
                    loading="lazy"
                  />
                  {img.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl px-3 py-2">
                      <p className="text-xs text-white font-medium">{img.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <Card><CardContent className="py-16 text-center">
              <ThumbsUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma avaliacao disponivel</p>
            </CardContent></Card>
          ) : (
            reviews.map((review, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {review.ProfilePicture && (
                      <img src={review.ProfilePicture} alt={review.Name} className="w-10 h-10 rounded-full flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{review.Name}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={cn('w-3.5 h-3.5', n <= review.Rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')}
                            />
                          ))}
                        </div>
                        {review.When && (
                          <span className="text-xs text-gray-400">{review.When}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-wrap">{review.Description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* PROPOSALS TAB */}
      {activeTab === 'proposals' && (
        <div className="space-y-3">
          <Button onClick={handleGenerateProposal} loading={generatingProposal}>
            <Sparkles className="w-4 h-4" />
            Nova Proposta IA
          </Button>
          {!lead.propostas || lead.propostas.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma proposta gerada ainda</p>
            </CardContent></Card>
          ) : (
            lead.propostas.map((p: Proposal) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        p.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                        p.status === 'recusada' ? 'bg-red-100 text-red-700' :
                        p.status === 'enviada' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      )}>{p.status}</span>
                      <span className="text-xs text-gray-400">{formatDate(p.criado_em)}</span>
                    </div>
                    <p className="text-sm mt-1">
                      Setup: <strong>{formatCurrency(p.preco_sugerido)}</strong> | Mensal: <strong>{formatCurrency(p.mensalidade_sugerida)}</strong>
                    </p>
                  </div>
                  <Link to={`/proposals/${p.id}`}>
                    <Button variant="outline" size="sm">Ver</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Adicionar uma nota..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handleAddNote} loading={addingNote} disabled={!noteText.trim()}>
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
          {lead.notas && lead.notas.length > 0 ? (
            lead.notas.map((nota: Nota) => (
              <Card key={nota.id}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{nota.conteudo}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(nota.criado_em)}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma nota ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
