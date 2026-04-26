import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  Zap,
  Search,
  Sparkles,
  Send,
  BarChart3,
  Globe,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Star,
  MapPin,
  Smartphone,
  TrendingUp,
  Clock,
  ChevronRight,
  Play,
  Gift,
  Heart,
  Scissors,
  Stethoscope,
  UtensilsCrossed,
  Scale,
  Wrench,
  CakeSlice,
  Flame,
  Phone,
  Mail,
  Instagram,
  MousePointer2,
  Eye,
  Users,
  Rocket,
  ExternalLink,
} from 'lucide-react'

/* ─── Scroll Reveal Hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function Reveal({ className = 'reveal', children, style }: { className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useReveal()
  return <div ref={ref} className={className} style={style}>{children}</div>
}

/* ─── Typing Effect ─── */
function TypingText({ texts, className }: { texts: string[]; className?: string }) {
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[index]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60)
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setIndex((i) => (i + 1) % texts.length)
    }
    return () => clearTimeout(timeout)
  }, [displayed, deleting, index, texts])

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse text-blue-400">|</span>
    </span>
  )
}

/* ─── Counter Animation ─── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1500
        const step = target / (duration / 16)
        let current = 0
        const timer = setInterval(() => {
          current += step
          if (current >= target) {
            setCount(target)
            clearInterval(timer)
          } else {
            setCount(Math.floor(current))
          }
        }, 16)
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString('pt-BR')}{suffix}</span>
}

/* ─── Showcase LP Card ─── */
interface ShowcaseLP {
  name: string
  category: string
  icon: React.ReactNode
  gradient: string
  accentColor: string
  image: string
  rating: number
  reviews: number
  description: string
  tags: string[]
  demoUrl: string
}

function ShowcaseCard({ lp, index }: { lp: ShowcaseLP; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Reveal className="reveal-scale" style={{ transitionDelay: `${index * 0.1}s` }}>
      <a
        href={lp.demoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer block no-underline"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Image header */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={lp.image}
            alt={lp.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${lp.gradient} opacity-60`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Category badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-gray-700">
            {lp.icon}
            {lp.category}
          </div>

          {/* Generated by AI badge */}
          <div className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Gerado por IA
          </div>

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white text-xl font-bold drop-shadow-lg">{lp.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < lp.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`}
                />
              ))}
              <span className="text-white/80 text-xs ml-1">{lp.rating}.0 ({lp.reviews})</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{lp.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {lp.tags.map((tag) => (
              <span
                key={tag}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border`}
                style={{ borderColor: lp.accentColor + '40', color: lp.accentColor, backgroundColor: lp.accentColor + '10' }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* View LP button */}
          <div className="flex gap-2 pt-1">
            <span
              className="flex-1 py-2.5 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all group-hover:opacity-90"
              style={{ backgroundColor: lp.accentColor }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Landing Page
            </span>
          </div>
        </div>

        {/* Hover shimmer */}
        {hovered && (
          <div className="absolute inset-0 pointer-events-none animate-shimmer rounded-2xl" />
        )}
      </a>
    </Reveal>
  )
}

/* ─── Data ─── */

const SHOWCASE_LPS: ShowcaseLP[] = [
  {
    name: 'Restaurante Sabor da Terra',
    category: 'Restaurante',
    icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    gradient: 'from-orange-600/80 to-red-600/40',
    accentColor: '#ea580c',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    rating: 5,
    reviews: 487,
    description: 'A melhor comida caseira da regiao. Almoco executivo, rodizio aos finais de semana e ambiente familiar aconchegante.',
    tags: ['Almoco executivo', 'Delivery', 'Estacionamento'],
    demoUrl: '/demos/restaurante-sabor-da-terra.html',
  },
  {
    name: 'Barbearia Old School',
    category: 'Barbearia',
    icon: <Scissors className="w-3.5 h-3.5" />,
    gradient: 'from-amber-800/80 to-stone-800/40',
    accentColor: '#92400e',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop',
    rating: 5,
    reviews: 312,
    description: 'Corte classico e moderno com cerveja artesanal. Ambiente exclusivo masculino com atendimento premium.',
    tags: ['Agendamento online', 'Barba', 'Cerveja gratis'],
    demoUrl: '/demos/barbearia-old-school.html',
  },
  {
    name: 'Clinica Vida Plena',
    category: 'Clinica',
    icon: <Stethoscope className="w-3.5 h-3.5" />,
    gradient: 'from-teal-600/80 to-cyan-600/40',
    accentColor: '#0d9488',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop',
    rating: 5,
    reviews: 203,
    description: 'Clinica multidisciplinar com mais de 15 especialidades. Exames, consultas e procedimentos em um so lugar.',
    tags: ['Convenios', 'Exames', 'Telemedicina'],
    demoUrl: '/demos/clinica-vida-plena.html',
  },
  {
    name: 'Smash Burger House',
    category: 'Hamburgueria',
    icon: <Flame className="w-3.5 h-3.5" />,
    gradient: 'from-red-700/80 to-yellow-600/40',
    accentColor: '#dc2626',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
    rating: 5,
    reviews: 892,
    description: 'Smash burgers artesanais com blend exclusivo de 180g. Batatas rusticas e milkshakes que voce nunca viu.',
    tags: ['Delivery', 'iFood', 'Combos'],
    demoUrl: '/demos/smash-burger-house.html',
  },
  {
    name: 'Padaria Trigo & Mel',
    category: 'Padaria',
    icon: <CakeSlice className="w-3.5 h-3.5" />,
    gradient: 'from-amber-500/80 to-orange-400/40',
    accentColor: '#d97706',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop',
    rating: 4,
    reviews: 156,
    description: 'Paes artesanais, bolos sob encomenda e cafe especial. Producao propria diaria desde 1998.',
    tags: ['Cafe da manha', 'Encomendas', 'Paes artesanais'],
    demoUrl: '/demos/padaria-trigo-mel.html',
  },
  {
    name: 'Advocacia Barros & Lima',
    category: 'Advocacia',
    icon: <Scale className="w-3.5 h-3.5" />,
    gradient: 'from-slate-800/80 to-blue-900/40',
    accentColor: '#1e40af',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
    rating: 5,
    reviews: 98,
    description: 'Escritorio especializado em direito empresarial, trabalhista e tributario. Mais de 20 anos de experiencia.',
    tags: ['Consulta online', 'Empresarial', 'Trabalhista'],
    demoUrl: '/demos/advocacia-barros-lima.html',
  },
  {
    name: 'TechFix Assistencia',
    category: 'Assistencia Tecnica',
    icon: <Wrench className="w-3.5 h-3.5" />,
    gradient: 'from-indigo-700/80 to-purple-600/40',
    accentColor: '#7c3aed',
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=400&fit=crop',
    rating: 5,
    reviews: 267,
    description: 'Conserto de celulares, notebooks e tablets. Orcamento gratis em 15 minutos. Pecas originais com garantia.',
    tags: ['Orcamento gratis', 'Garantia', 'Pecas originais'],
    demoUrl: '/demos/techfix-assistencia.html',
  },
  {
    name: 'Studio Beleza Pura',
    category: 'Salao de Beleza',
    icon: <Heart className="w-3.5 h-3.5" />,
    gradient: 'from-pink-600/80 to-rose-400/40',
    accentColor: '#db2777',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
    rating: 5,
    reviews: 445,
    description: 'Corte, coloracao, manicure e tratamentos capilares. Profissionais premiados e ambiente sofisticado.',
    tags: ['Agendamento', 'Noiva', 'Coloracao'],
    demoUrl: '/demos/studio-beleza-pura.html',
  },
]

const STEPS = [
  {
    icon: Search,
    title: 'A IA encontra os negocios',
    desc: 'Varre o Google Maps e identifica negocios locais sem site ou com presenca digital fraca. Leads quentes, prontos pra comprar.',
    color: 'from-blue-500 to-cyan-400',
    number: '01',
  },
  {
    icon: Sparkles,
    title: 'Gera a proposta completa',
    desc: 'Em segundos cria landing page personalizada, argumento de venda e preco sugerido. O cliente ve o site ANTES de fechar.',
    color: 'from-violet-500 to-purple-400',
    number: '02',
  },
  {
    icon: Send,
    title: 'Voce envia e fecha',
    desc: 'Dispara a proposta pelo WhatsApp com um clique. Follow-ups automaticos, CRM integrado e cobranca recorrente.',
    color: 'from-emerald-500 to-green-400',
    number: '03',
  },
]

const FEATURES = [
  { icon: Globe, title: 'Scraping Inteligente', desc: 'Coleta automatica de dados do Google Maps com score de oportunidade em tempo real.' },
  { icon: Sparkles, title: 'IA Generativa', desc: 'Landing pages, copys e argumentos de venda criados por inteligencia artificial.' },
  { icon: MessageCircle, title: 'WhatsApp Integrado', desc: 'Disparo, follow-ups e respostas em tempo real direto pelo WhatsApp.' },
  { icon: BarChart3, title: 'CRM Kanban', desc: 'Pipeline visual com drag-and-drop pra gerenciar todo o funil de vendas.' },
  { icon: ShieldCheck, title: 'Aprovacao Humana', desc: 'Nada e enviado sem sua aprovacao. Voce tem controle total do processo.' },
  { icon: TrendingUp, title: 'Receita Recorrente', desc: 'Cobranca automatica mensal. Transforme cada venda em renda passiva.' },
]

/* ─── Page ─── */

export default function LandingPage() {
  const navigate = useNavigate()
  const goLogin = () => navigate('/login')

  // Parallax for hero background
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ━━━ NAV ━━━ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              LocalReach <span className="text-blue-600">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
            <a href="#exemplos" className="hover:text-gray-900 transition-colors">Exemplos</a>
            <a href="#como-funciona" className="hover:text-gray-900 transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goLogin} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              Entrar
            </button>
            <button
              onClick={goLogin}
              className="group px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Comecar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-24 px-6 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] opacity-40"
            style={{ transform: `translate(-50%, ${scrollY * 0.15}px)` }}
          >
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-200 rounded-full blur-[120px] animate-float" />
            <div className="absolute top-40 right-20 w-80 h-80 bg-violet-200 rounded-full blur-[100px] animate-float-slow" />
            <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-cyan-200 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center">
          {/* FREE badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 mb-6">
            <div className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Gift className="w-3 h-3" />
              100% Gratis
            </div>
            <span className="text-sm font-medium text-green-700">Comece agora sem pagar nada</span>
          </div>

          <h1 className="animate-fade-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
            Crie sites incriveis para{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              negocios locais
            </span>{' '}
            <br className="hidden sm:block" />
            <span className="text-gray-400">com inteligencia artificial</span>
          </h1>

          <div className="animate-fade-up delay-200 mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            <p>
              A IA descobre negocios sem presenca digital e gera landing pages prontas para{' '}
            </p>
            <div className="h-8 mt-1">
              <TypingText
                texts={[
                  'restaurantes',
                  'barbearias',
                  'clinicas',
                  'hamburguerias',
                  'padarias',
                  'escritorios de advocacia',
                  'assistencias tecnicas',
                  'saloes de beleza',
                  'petshops',
                  'academias',
                ]}
                className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"
              />
            </div>
          </div>

          <div className="animate-fade-up delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={goLogin}
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base font-semibold rounded-2xl transition-all shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/35 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Gift className="w-5 h-5" />
              Comecar gratis — e pra sempre
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById('exemplos')?.scrollIntoView({ behavior: 'smooth' })}
              className="group w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 text-base font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 border border-gray-200 shadow-sm hover:shadow-md"
            >
              <Eye className="w-5 h-5" />
              Ver exemplos reais
            </button>
          </div>

          {/* Social proof animated */}
          <div className="animate-fade-up delay-400 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Gratis para sempre
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Sem cartao de credito
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Setup em 2 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Sites ilimitados
            </span>
          </div>
        </div>

        {/* Hero mockup with float animation */}
        <div className="mt-16 max-w-5xl mx-auto animate-fade-up delay-500">
          <div className="relative animate-float-slow">
            <div className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-2xl shadow-gray-300/30 bg-white">
              {/* Browser chrome */}
              <div className="h-10 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 flex items-center gap-2 px-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-4 flex-1 max-w-md">
                  <div className="bg-white rounded-md h-6 flex items-center px-3 text-xs text-gray-400 border border-gray-200">
                    <span className="text-green-600 mr-1">&#128274;</span>
                    app.localreach.ai/crm
                  </div>
                </div>
              </div>
              {/* Dashboard Preview */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Leads hoje', value: '127', change: '+23%', color: 'from-blue-500 to-blue-600', icon: Users },
                    { label: 'Propostas IA', value: '48', change: '+15%', color: 'from-violet-500 to-purple-600', icon: Sparkles },
                    { label: 'WhatsApp enviados', value: '32', change: '+8%', color: 'from-emerald-500 to-green-600', icon: MessageCircle },
                    { label: 'Vendas fechadas', value: '7', change: '+40%', color: 'from-amber-500 to-orange-600', icon: Rocket },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-gray-400 font-medium">{stat.label}</p>
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-[10px] text-green-600 font-medium mt-0.5">{stat.change} vs ontem</p>
                    </div>
                  ))}
                </div>
                {/* Kanban mini */}
                <div className="grid grid-cols-4 gap-2 hidden md:grid">
                  {[
                    { stage: 'Prospectado', count: 48, color: 'bg-blue-500' },
                    { stage: 'Proposta Gerada', count: 23, color: 'bg-violet-500' },
                    { stage: 'Abordado', count: 15, color: 'bg-amber-500' },
                    { stage: 'Fechado', count: 7, color: 'bg-emerald-500' },
                  ].map((col) => (
                    <div key={col.stage} className="bg-white rounded-xl border border-gray-100 p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-2 h-2 rounded-full ${col.color}`} />
                        <span className="text-[10px] font-semibold text-gray-500">{col.stage}</span>
                        <span className="ml-auto text-[10px] text-gray-300 bg-gray-50 px-1 rounded">{col.count}</span>
                      </div>
                      {[1, 2].map((i) => (
                        <div key={i} className="mb-1.5 p-2 bg-gray-50 rounded-lg">
                          <div className="h-2 w-3/4 bg-gray-200 rounded mb-1.5" />
                          <div className="h-1.5 w-1/2 bg-gray-100 rounded" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating elements around the mockup */}
            <div className="absolute -top-4 -right-4 md:-right-8 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-green-500/30 text-sm font-bold animate-bounce-subtle flex items-center gap-2">
              <Gift className="w-4 h-4" />
              GRATIS
            </div>
            <div className="absolute -bottom-3 -left-3 md:-left-6 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-lg text-xs font-medium text-gray-600 animate-float" style={{ animationDelay: '1s' }}>
              <span className="flex items-center gap-1.5">
                <MousePointer2 className="w-3.5 h-3.5 text-blue-500" />
                LP gerada em 8 segundos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ MARQUEE DE NICHOS ━━━ */}
      <section className="py-8 border-y border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50 overflow-hidden">
        <p className="text-center text-xs text-gray-400 mb-4 font-medium tracking-widest uppercase">Funciona para qualquer negocio local</p>
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...SHOWCASE_LPS, ...SHOWCASE_LPS].map((lp, i) => (
              <span
                key={`${lp.name}-${i}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 mx-2 bg-white rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-blue-200 hover:bg-blue-50 transition-colors flex-shrink-0 cursor-default"
              >
                {lp.icon}
                {lp.category}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ STATS ━━━ */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 50000, suffix: '+', label: 'Leads analisados' },
            { value: 8, suffix: '%', label: 'Taxa de conversao' },
            { value: 30, suffix: 's', label: 'Tempo por analise', prefix: '< ' },
            { value: 1200, suffix: '+', label: 'Sites gerados', prefix: '' },
          ].map((s) => (
            <Reveal key={s.label} className="reveal text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-gray-900">
                {s.prefix}<AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ━━━ EXEMPLOS DE LPS ━━━ */}
      <section id="exemplos" className="py-20 md:py-28 px-6 scroll-mt-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-6">
              <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">Exemplos reais</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Veja o que a IA gera{' '}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  em segundos
                </span>
              </h2>
              <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
                Cada landing page e gerada automaticamente com dados reais do Google Maps.
                O dono do negocio ve o site pronto — e fecha na hora.
              </p>
            </div>
          </Reveal>

          {/* Showcase grid */}
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SHOWCASE_LPS.map((lp, i) => (
              <ShowcaseCard key={lp.name} lp={lp} index={i} />
            ))}
          </div>

          {/* CTA below examples */}
          <Reveal>
            <div className="mt-12 text-center">
              <p className="text-gray-500 mb-4">
                Esses sao apenas exemplos. A IA cria um site unico para <strong className="text-gray-700">cada negocio</strong>.
              </p>
              <button
                onClick={goLogin}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-semibold rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              >
                <Gift className="w-5 h-5" />
                Quero criar sites assim — de graca
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ COMO FUNCIONA ━━━ */}
      <section id="como-funciona" className="py-20 md:py-28 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">Como funciona</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Tres passos. Zero complicacao.
              </h2>
              <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
                Do lead frio a venda fechada em minutos, nao semanas.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} style={{ transitionDelay: `${i * 0.15}s` }}>
                <div className="relative group p-6 rounded-2xl bg-white border border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-5xl font-black text-gray-100 group-hover:text-blue-100 transition-colors">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ DIFERENCIAL — "VER ANTES DE COMPRAR" ━━━ */}
      <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal className="reveal-left">
            <div>
              <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">O pulo do gato</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                O cliente ve o site{' '}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  antes de pagar
                </span>
              </h2>
              <p className="mt-5 text-gray-500 leading-relaxed text-lg">
                Voce mostra ao dono do restaurante, da barbearia, da clinica, uma previa <strong className="text-gray-700">REAL</strong> de como o site dele vai ficar — com o nome do negocio, as fotos, o mapa, o botao de WhatsApp.
              </p>
              <p className="mt-4 text-gray-500 leading-relaxed text-lg">
                A resistencia desaparece. O ciclo de vendas cai de <strong className="text-gray-700">semanas para minutos</strong>.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Landing page personalizada por categoria',
                  'Cores, fotos e dados extraidos automaticamente',
                  'Botao de WhatsApp e mapa de localizacao',
                  'Preview compartilhavel por link',
                  'Tudo 100% gratis — sem limite',
                ].map((item, i) => (
                  <div key={item} className="flex items-start gap-3 group">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-500 transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Animated LP Preview */}
          <Reveal className="reveal-right">
            <div className="relative">
              {/* Phone frame */}
              <div className="mx-auto w-[280px] md:w-[320px] relative">
                <div className="rounded-[2.5rem] overflow-hidden border-[8px] border-gray-900 bg-gray-900 shadow-2xl shadow-gray-900/30">
                  {/* Phone notch */}
                  <div className="h-7 bg-gray-900 relative">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-b-2xl" />
                  </div>
                  {/* LP content */}
                  <div className="bg-white">
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop"
                        alt="Restaurant"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white text-lg font-bold">Cantina Bella</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1,2,3,4,5].map((i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          ))}
                          <span className="text-white/70 text-[10px] ml-1">4.8 (523)</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 space-y-2.5">
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Sabor italiano autentico no coracao da cidade. Massas frescas, vinhos selecionados e sobremesas artesanais.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <MapPin className="w-3 h-3" /> R. Italia, 456 — Centro
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Clock className="w-3 h-3" /> Seg-Sab, 11h-23h
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <button className="flex-1 py-2 bg-green-500 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </button>
                        <button className="flex-1 py-2 bg-red-500 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
                          <Phone className="w-3 h-3" /> Reservar
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button className="flex-1 py-1.5 bg-gray-100 text-gray-500 text-[10px] rounded-lg flex items-center justify-center gap-1">
                          <Instagram className="w-3 h-3" /> Instagram
                        </button>
                        <button className="flex-1 py-1.5 bg-gray-100 text-gray-500 text-[10px] rounded-lg flex items-center justify-center gap-1">
                          <MapPin className="w-3 h-3" /> Como chegar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute top-8 -left-4 md:-left-16 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-xl animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Venda fechada!</p>
                    <p className="text-[10px] text-gray-400">R$ 1.200 + R$ 150/mes</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 -right-4 md:-right-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl px-4 py-3 shadow-xl shadow-blue-600/30 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold">Gerado por IA</p>
                    <p className="text-[10px] text-blue-200">em 8 segundos</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-2 -left-2 md:-left-10 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-xl animate-float" style={{ animationDelay: '2.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Lead Score: 92</p>
                    <p className="text-[10px] text-gray-400">Oportunidade quente</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ FUNCIONALIDADES ━━━ */}
      <section id="funcionalidades" className="py-20 md:py-28 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">Funcionalidades</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Tudo que voce precisa.{' '}
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">Tudo gratis.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="group relative p-6 rounded-2xl border border-gray-100 bg-white hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-violet-50/50 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110">
                    <f.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SOCIAL PROOF ━━━ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">O que dizem</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Quem usa, recomenda
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Em 2 semanas fechei 12 clientes. Antes eu levava um mes pra fechar 3. O fato do cliente ver o site pronto antes de pagar muda completamente o jogo.',
                name: 'Rafael M.',
                role: 'Freelancer — Curitiba, PR',
                initials: 'RM',
                color: 'from-blue-500 to-violet-500',
              },
              {
                quote: 'Minha agencia triplicou o faturamento. O LocalReach faz em 10 segundos o que minha equipe fazia em 3 horas. E o melhor: e de graca.',
                name: 'Amanda S.',
                role: 'Agencia digital — SP',
                initials: 'AS',
                color: 'from-emerald-500 to-teal-500',
              },
              {
                quote: 'Eu nao sabia nada de programacao e agora vendo sites pra comercio local. A IA faz tudo, eu so envio pelo WhatsApp e fecho.',
                name: 'Carlos P.',
                role: 'Autonomo — BH, MG',
                initials: 'CP',
                color: 'from-amber-500 to-orange-500',
              },
            ].map((t, i) => (
              <Reveal key={t.name} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 leading-relaxed flex-1">"{t.quote}"</blockquote>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ GRATIS SECTION ━━━ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="relative rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-10 md:p-16 text-white overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full" />

              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
                  <Gift className="w-5 h-5" />
                  <span className="text-sm font-bold">Sim, e gratis de verdade</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                  Sem pegadinha.<br />Sem cartao.<br />Sem limite de tempo.
                </h2>

                <p className="mt-6 text-green-100 text-lg max-w-lg mx-auto leading-relaxed">
                  O LocalReach AI e 100% gratuito. Crie quantos sites quiser, prospecte quantos leads quiser, use sem restricao. Pra sempre.
                </p>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {[
                    { icon: Users, label: 'Leads ilimitados' },
                    { icon: Sparkles, label: 'IA ilimitada' },
                    { icon: Globe, label: 'Sites ilimitados' },
                    { icon: MessageCircle, label: 'WhatsApp gratis' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                      <item.icon className="w-6 h-6 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold">{item.label}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={goLogin}
                  className="mt-10 group inline-flex items-center gap-2 px-10 py-5 bg-white text-green-600 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all active:translate-y-0"
                >
                  <Rocket className="w-6 h-6" />
                  Criar minha conta gratis agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Pronto pra transformar negocios locais?
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Crie sua conta em 30 segundos e comece a gerar sites com IA agora mesmo.
            </p>
            <button
              onClick={goLogin}
              className="mt-8 group inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              <Gift className="w-6 h-6" />
              Comecar gratis agora
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-4 text-sm text-gray-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Gratis para sempre — sem cartao de credito
            </p>
          </div>
        </Reveal>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-gray-100 py-10 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold">
              LocalReach <span className="text-blue-600">AI</span>
            </span>
            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full ml-1">GRATIS</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Termos de uso</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Privacidade</a>
            <a href="mailto:contato@localreach.ai" className="hover:text-gray-600 transition-colors flex items-center gap-1">
              <Mail className="w-3 h-3" /> Contato
            </a>
          </div>
          <p className="text-xs text-gray-300">&copy; 2026 LocalReach AI</p>
        </div>
      </footer>
    </div>
  )
}
