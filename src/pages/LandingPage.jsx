import React, { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useInView, useSpring, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Sparkles,
    Users,
    BookOpen,
    MessageSquare,
    Brain,
    Clock,
    Trophy,
    Store,
    GraduationCap,
    Zap,
    Star,
    Check,
    X,
    Target,
    Flame
} from 'lucide-react';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return isMobile;
};

const GLOW = {
    purple: { icon: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500/30', bg: 'bg-purple-500/10' },
    yellow: { icon: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500/30', bg: 'bg-yellow-500/10' },
    blue: { icon: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/30', bg: 'bg-blue-500/10' },
    emerald: { icon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10' },
    pink: { icon: 'text-pink-600 dark:text-pink-400', ring: 'ring-pink-500/30', bg: 'bg-pink-500/10' },
    violet: { icon: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/30', bg: 'bg-violet-500/10' },
    sky: { icon: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/30', bg: 'bg-sky-500/10' },
    amber: { icon: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/30', bg: 'bg-amber-500/10' },
    teal: { icon: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500/30', bg: 'bg-teal-500/10' }
};

const features = [
    {
        icon: Brain,
        title: 'AI Content Generator',
        description: 'Generate comprehensive notes, summaries, and quizzes from any topic in seconds.',
        glow: 'purple',
        badge: 'Most Used',
        badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
    },
    {
        icon: Trophy,
        title: 'Gamified Challenges',
        description: 'Earn XP, badges, and climb leaderboards through interactive quizzes and streaks.',
        glow: 'yellow',
        badge: 'Popular',
        badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30'
    },
    {
        icon: Users,
        title: 'Live Study Rooms',
        description: 'Join virtual rooms to collaborate with peers in real-time with video and chat.',
        glow: 'blue'
    },
    {
        icon: Store,
        title: 'Teacher Marketplace',
        description: 'Find expert tutors or sell your own high-quality study materials.',
        glow: 'emerald',
        badge: 'New',
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
    },
    {
        icon: Clock,
        title: 'Focus Room',
        description: 'Distraction-free environment with Pomodoro timer, ambient sounds, and deep-work tracking.',
        glow: 'pink'
    },
    {
        icon: MessageSquare,
        title: 'Community Forums',
        description: 'Ask questions, share insights, and engage with thousands of motivated learners.',
        glow: 'violet'
    },
    {
        icon: BookOpen,
        title: 'Resource Hub',
        description: 'A shared digital library of notes, PDFs, and guides rated by the community.',
        glow: 'sky'
    },
    {
        icon: GraduationCap,
        title: 'Mentorship Network',
        description: 'Connect with experienced mentors who guide you through tough subjects one-on-one.',
        glow: 'amber'
    },
    {
        icon: Zap,
        title: 'Smart Analytics',
        description: 'Track your study hours, weak areas, and progress with AI-powered dashboards.',
        glow: 'teal'
    }
];

const workflow = [
    { step: '01', title: 'Set the ritual', detail: 'Pick a duration, mood, and focus goal to anchor each session.' },
    { step: '02', title: 'Enter the room', detail: 'Drop into a guided environment built for the task in front of you.' },
    { step: '03', title: 'Close the loop', detail: 'Reflect, capture outcomes, and queue the next milestone.' }
];

const stats = [
    { value: '50K+', label: 'Active Scholars', icon: Users },
    { value: '1M+', label: 'Study Hours', icon: Clock },
    { value: '98%', label: 'Success Rate', icon: Target },
    { value: '4.9/5', label: 'User Rating', icon: Star }
];

const testimonials = [
    {
        name: 'Sarah L.',
        role: 'University Student',
        avatar: 'SL',
        color: 'bg-purple-600',
        quote: "StudyBuddy's AI notes saved me hours of work. I can finally focus on understanding concepts instead of just transcribing lectures.",
        stars: 5
    },
    {
        name: 'David C.',
        role: 'High School Teacher',
        avatar: 'DC',
        color: 'bg-pink-600',
        quote: 'I use the marketplace to share my supplemental materials. The platform is intuitive and easy to use.',
        stars: 5
    },
    {
        name: 'Maria G.',
        role: 'College Sophomore',
        avatar: 'MG',
        color: 'bg-blue-600',
        quote: "The focus room and study streaks are brilliant. They keep me accountable and motivated every week.",
        stars: 5
    }
];

const pricingPlans = [
    {
        title: 'Community Plan',
        monthlyPrice: '$0',
        yearlyPrice: '$0',
        monthlyPkr: 'Free Forever',
        yearlyPkr: 'Free Forever',
        desc: 'Everything you need to study smart - free, forever.',
        ctaText: 'Get Started',
        features: [
            'AI Notes Generator (10/day)',
            'Flashcards and Quizzes (5/day)',
            'Study Rooms (Unlimited)',
            'Focus Room and Pomodoro',
            'Resource Hub (Download)'
        ],
        excluded: [
            'AI Study Assistant (Chatbot)',
            'Upload to Marketplace',
            'Advanced Analytics',
            'Priority Support'
        ]
    },
    {
        title: 'Pro Plan',
        monthlyPrice: '$7',
        yearlyPrice: '$5',
        monthlyPkr: 'PKR 1,500 /mo',
        yearlyPkr: 'PKR 14,400 /yr',
        desc: 'Unlock smarter studying with premium power.',
        highlight: true,
        ctaText: 'Upgrade to Pro',
        features: [
            'Unlimited AI Notes and Flashcards',
            'Smart Planner with AI',
            'Emergency Study Mode',
            'AI Study Assistant (30/day)',
            'Sell Resources (20/mo)',
            'No Ads'
        ],
        excluded: [
            'Unlimited AI Voice Assistant',
            'Sell Unlimited Resources',
            'Custom AI Tutor Training'
        ]
    },
    {
        title: 'Elite Plan',
        monthlyPrice: '$15',
        yearlyPrice: '$12',
        monthlyPkr: 'PKR 3,200 /mo',
        yearlyPkr: 'PKR 30,700 /yr',
        desc: 'Study, earn, and teach without limits.',
        ctaText: 'Go Elite',
        features: [
            'Everything in Pro, PLUS:',
            'Unlimited AI Voice Tutor',
            'Sell Unlimited Resources',
            'Advanced Seller Analytics',
            'AI Tutor Bot (Custom Trained)',
            'Priority Support and Badge'
        ]
    }
];

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } }
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: (i * 37 + 11) % 100,
    y: (i * 53 + 7) % 100,
    size: (i % 3) + 1.5,
    duration: 12 + (i % 8),
    delay: (i % 5) * 1.2,
    driftX: ((i % 5) - 2) * 10
}));

const FloatingParticles = memo(function FloatingParticles() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            {PARTICLES.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-purple-600/10 dark:bg-[#8c30e8]/20"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                    animate={{ y: [0, -40, 0], x: [0, p.driftX, 0], opacity: [0.1, 0.45, 0.1] }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
});

function SectionBadge({ color, icon: Icon, label }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 12 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease, type: 'spring', stiffness: 200 }}
            className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${color}`}
        >
            <Icon className="h-3 w-3" /> {label}
        </motion.div>
    );
}

function SectionHeading({ children, className = '' }) {
    const words = children.split(' ');
    return (
        <motion.h2
            className={`text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white ${className}`}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
        >
            {words.map((word, i) => (
                <motion.span key={i} variants={fadeUp} className="inline-block mr-[0.28em] last:mr-0">
                    {word}
                </motion.span>
            ))}
        </motion.h2>
    );
}

function AnimatedDivider() {
    return (
        <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease }}
            className="mx-auto h-px w-full max-w-2xl bg-purple-600/20 dark:bg-[#8c30e8]/20"
        />
    );
}

const StatCard = memo(function StatCard({ value, label, icon: Icon, index }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    const numericMatch = value.match(/\d+(\.\d+)?/);
    const target = numericMatch ? parseFloat(numericMatch[0]) : 0;
    const suffix = numericMatch ? value.replace(numericMatch[0], '') : '';
    const hasDecimal = target % 1 !== 0;

    useEffect(() => {
        if (!isInView || target === 0) return;
        const steps = 60;
        const inc = target / steps;
        let cur = 0;

        const timer = setInterval(() => {
            cur += inc;
            if (cur >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(cur);
            }
        }, 2000 / steps);

        return () => clearInterval(timer);
    }, [isInView, target]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease, delay: index * 0.1 }}
            whileHover={{ y: -6, scale: 1.04 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] p-6 md:p-8 hover:border-purple-300 dark:hover:border-[#8c30e8]/30 hover:shadow-lg hover:shadow-purple-600/5 dark:hover:shadow-[#8c30e8]/10 transition-all duration-300"
        >
            <motion.div
                className="mb-3 rounded-xl bg-purple-50 dark:bg-[#8c30e8]/10 p-3"
                whileHover={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 0.4 }}
            >
                <Icon className="h-5 w-5 text-purple-600 dark:text-[#8c30e8]" />
            </motion.div>
            <div className="mb-1 text-3xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                {hasDecimal ? count.toFixed(1) : Math.round(count)}{suffix}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">{label}</div>
        </motion.div>
    );
});

const FeatureCard = memo(function FeatureCard({ feature, index }) {
    const Icon = feature.icon;
    const g = GLOW[feature.glow] || GLOW.purple;
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease, delay: (index % 3) * 0.1 + Math.floor(index / 3) * 0.12 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] p-7 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-xl hover:shadow-purple-600/5 dark:hover:shadow-[#8c30e8]/10 transition-colors duration-300 cursor-pointer"
        >
            <div
                className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }}
            />

            {feature.badge && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: (index % 3) * 0.1 + 0.35, duration: 0.4, type: 'spring' }}
                    className={`absolute right-4 top-4 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${feature.badgeColor}`}
                >
                    {feature.badge}
                </motion.div>
            )}

            <motion.div
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full ring-2 ${g.ring} ${g.bg}`}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
            >
                <Icon className={`h-5 w-5 ${g.icon}`} />
            </motion.div>

            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-gray-400">{feature.description}</p>
        </motion.div>
    );
});

function AnimatedProgressBar({ pct }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    return (
        <div ref={ref} className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <motion.div
                className="h-full rounded-full bg-purple-600 dark:bg-[#8c30e8]"
                initial={{ width: 0 }}
                animate={inView ? { width: `${pct}%` } : {}}
                transition={{ duration: 1.3, ease, delay: 0.35 }}
            />
        </div>
    );
}

const PricingCard = memo(function PricingCard({ plan, isYearly, index }) {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const pkr = isYearly ? plan.yearlyPkr : plan.monthlyPkr;
    const [hovered, setHovered] = useState(false);
    const isActive = hovered || plan.highlight;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.65, ease, delay: index * 0.13 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            whileHover={{ y: -10, scale: 1.025 }}
            className={`relative flex flex-col rounded-2xl border p-8 h-full cursor-pointer transition-all duration-300 ${
                plan.highlight
                    ? 'border-purple-600 dark:border-[#8c30e8] bg-purple-50 dark:bg-[#8c30e8]/10 shadow-[0_0_50px_rgba(140,48,232,0.08)]'
                    : hovered
                    ? 'border-purple-300 dark:border-[#8c30e8]/50 bg-purple-50/40 dark:bg-[#8c30e8]/5 shadow-[0_0_35px_rgba(140,48,232,0.05)]'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121]'
            }`}
        >
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute inset-0 rounded-2xl bg-purple-600/[0.02] dark:bg-[#8c30e8]/[0.02]"
                    />
                )}
            </AnimatePresence>

            {plan.highlight && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.13 + 0.3, type: 'spring', stiffness: 280 }}
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 dark:bg-[#8c30e8] px-5 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-lg"
                >
                    Most Popular
                </motion.div>
            )}

            <div className="mb-8">
                <h3 className={`mb-2 text-xl font-bold transition-colors duration-300 ${isActive ? 'text-purple-700 dark:text-[#a760eb]' : 'text-slate-900 dark:text-white'}`}>
                    {plan.title}
                </h3>
                <div className="flex items-baseline gap-1">
                    <motion.span
                        key={price}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease }}
                        className={`text-5xl font-black transition-colors duration-300 ${isActive ? 'text-purple-600 dark:text-[#8c30e8]' : 'text-slate-900 dark:text-white'}`}
                    >
                        {price}
                    </motion.span>
                    {price !== '$0' && <span className="text-sm text-slate-500 dark:text-gray-400">/{isYearly ? 'yr' : 'mo'}</span>}
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-gray-400 font-medium">{pkr}</p>
                <p className="mt-5 text-sm text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10 pb-6">{plan.desc}</p>
            </div>

            <div className="flex-1 space-y-3.5 mb-8">
                {plan.features.map((feat, i) => (
                    <motion.div
                        key={feat}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 + index * 0.08, duration: 0.4, ease }}
                        className="flex items-start gap-3"
                    >
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10'}`}>
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>
                            {feat}
                        </span>
                    </motion.div>
                ))}

                {plan.excluded?.map((feat) => (
                    <div key={feat} className="flex items-start gap-3 opacity-50">
                        <X className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 dark:text-gray-500" />
                        <span className="text-sm font-medium text-slate-500 dark:text-gray-400 line-through">{feat}</span>
                    </div>
                ))}
            </div>

            <Link
                to="/register"
                className={`block w-full rounded-xl py-3.5 text-center text-sm font-bold transition-all duration-300 ${
                    isActive
                        ? 'bg-purple-600 dark:bg-[#8c30e8] text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 dark:hover:bg-[#a760eb] hover:shadow-xl'
                        : 'border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
            >
                {plan.ctaText}
            </Link>
        </motion.div>
    );
});

const TestimonialsMarquee = memo(function TestimonialsMarquee({ isMobile }) {
    const tripled = [...testimonials, ...testimonials, ...testimonials];

    return (
        <div className="relative flex w-full overflow-hidden py-8">
            <motion.div
                className="flex gap-6"
                animate={isMobile ? {} : { x: ['0%', '-33.333%'] }}
                transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
            >
                {tripled.map((t, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -6, scale: 1.02 }}
                        transition={{ duration: 0.3, ease }}
                        className="w-[380px] shrink-0 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] p-7 flex flex-col justify-between hover:border-purple-300 dark:hover:border-[#8c30e8]/30 hover:shadow-lg hover:shadow-purple-600/5 dark:hover:shadow-[#8c30e8]/10 transition-all duration-300"
                    >
                        <div>
                            <div className="mb-4 flex gap-1 text-yellow-500 dark:text-yellow-400">
                                {Array.from({ length: t.stars }).map((_, j) => (
                                    <Star key={j} size={15} fill="currentColor" />
                                ))}
                            </div>
                            <p className="mb-8 text-sm font-medium italic leading-relaxed text-slate-600 dark:text-gray-300">"{t.quote}"</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${t.color}`}>
                                {t.avatar}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</div>
                                <div className="text-xs font-medium text-slate-500 dark:text-gray-400">{t.role}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 dark:from-[#0a0a0f] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 dark:from-[#0a0a0f] to-transparent" />
        </div>
    );
});

const LandingPage = () => {
    const prefersReducedMotion = useReducedMotion();
    const isMobile = useIsMobile();
    const [isYearly, setIsYearly] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isMobile || prefersReducedMotion) return;

        const onMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 2,
                y: (e.clientY / window.innerHeight - 0.5) * 2
            });
        };

        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, [isMobile, prefersReducedMotion]);

    const springX = useSpring(mousePos.x * 30, { stiffness: 40, damping: 20 });
    const springY = useSpring(mousePos.y * 20, { stiffness: 40, damping: 20 });

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
            
            {/* ── BACKGROUND ORBS (Solid Color Blur, No Gradients) ── */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <motion.div
                    className="absolute left-1/4 top-0 h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-purple-600/5 dark:bg-[#8c30e8]/10 blur-[140px]"
                    style={{ x: springX, y: springY }}
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute right-1/4 top-1/3 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-blue-600/5 dark:bg-blue-500/10 blur-[140px]"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
                <motion.div
                    className="absolute left-1/2 bottom-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-purple-600/5 dark:bg-[#8c30e8]/10 blur-[120px]"
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
                />
                <FloatingParticles />
            </div>

            {/* ══════════════ HERO ══════════════ */}
            <section className="relative px-6 pb-20 pt-28 md:pt-40 text-center">
                <motion.div initial="hidden" animate="show" variants={stagger} className="mx-auto max-w-5xl">
                    <motion.h1
                        className="mb-8 font-sans text-5xl md:text-[84px] leading-[1.05] font-extrabold tracking-tight text-slate-900 dark:text-white"
                        initial="hidden"
                        animate="show"
                        variants={stagger}
                    >
                        <motion.span className="block" variants={stagger}>
                            {['Studying', 'made', 'social.'].map((w, i) => (
                                <motion.span
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, y: 60, rotateX: -25 },
                                        show: {
                                            opacity: 1,
                                            y: 0,
                                            rotateX: 0,
                                            transition: { duration: 0.75, ease, delay: i * 0.1 }
                                        }
                                    }}
                                    className="inline-block mr-[0.22em] last:mr-0"
                                >
                                    {w}
                                </motion.span>
                            ))}
                        </motion.span>
                        <motion.span
    className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-purple-600 to-purple-200 dark:from-[#8c30e8] dark:via-[#8c30e8] dark:to-[#8c30e8]/20"
    variants={{
        hidden: { opacity: 0, y: 60 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease, delay: 0.38 } }
    }}
>
    Success made certain.
</motion.span>
                    </motion.h1>

                    <motion.p variants={fadeUp} className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
                        Where learning meets innovation. Build knowledge, connect with mentors, and achieve your goals in a community that never stops growing.
                    </motion.p>

                    <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                            <Link
                                to="/register"
                                className="group inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full bg-purple-600 dark:bg-[#8c30e8] hover:bg-purple-700 dark:hover:bg-[#a760eb] px-10 py-4 text-base font-bold text-white shadow-xl shadow-purple-600/20 transition-all"
                            >
                                Begin a session
                                <motion.span className="inline-flex" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                                    <ArrowRight className="h-5 w-5" />
                                </motion.span>
                            </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                            <Link
                                to="/student-dashboard"
                                className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-10 py-4 text-base font-bold text-slate-900 dark:text-white transition-all hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                                View dashboard
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.p variants={fadeUp} className="mt-8 text-sm text-slate-500 dark:text-gray-400 font-bold">
                        No credit card required • Free forever plan
                    </motion.p>
                </motion.div>

                <motion.div className="mt-16 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                    <motion.div className="flex flex-col items-center gap-1" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                        <div className="h-8 w-[1px] bg-purple-600/30 dark:bg-[#8c30e8]/40" />
                        <div className="h-1 w-1 rounded-full bg-purple-600/40 dark:bg-[#8c30e8]/50" />
                    </motion.div>
                </motion.div>

                {/* Stats */}
                <div className="mx-auto mt-20 max-w-5xl">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {stats.map((s, i) => (
                            <StatCard key={i} {...s} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ══════════════ PROBLEM ══════════════ */}
            <section className="relative px-6 py-28 overflow-hidden">
                <motion.div
                    className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: 'linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px)',
                        backgroundSize: '60px 60px'
                    }}
                    animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <div className="mx-auto max-w-6xl relative z-10">
                    <div className="mb-14 text-center">
                        <SectionBadge color="border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400" icon={Flame} label="The Old Way" />
                        <SectionHeading className="mb-4">Sound Familiar?</SectionHeading>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.25, ease }}
                            className="text-slate-500 dark:text-gray-400 font-medium max-w-xl mx-auto"
                        >
                            Traditional studying is broken. These are the three biggest traps students fall into.
                        </motion.p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            {
                                icon: Sparkles,
                                title: 'Scattered Materials',
                                desc: 'Notes across multiple apps, PDFs in random folders, and lecture recordings you can never find on time.'
                            },
                            {
                                icon: Users,
                                title: 'Studying Alone',
                                desc: "No study group, no accountability partner, and no one to explain concepts you don't understand." 
                            },
                            {
                                icon: Flame,
                                title: 'Burnout and Overwhelm',
                                desc: 'Cramming at midnight, missing deadlines, and the constant feeling that you are behind.'
                            }
                        ].map((p, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 45, rotateY: -8 }}
                                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ duration: 0.65, ease, delay: i * 0.13 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-500/10 dark:bg-red-500/[0.03] p-7 hover:border-red-300 dark:hover:border-red-500/25 hover:shadow-lg hover:shadow-red-500/5 dark:hover:shadow-red-500/[0.04] transition-all duration-300 h-full"
                            >
                                <motion.div
                                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-red-200 bg-red-100 dark:ring-red-500/40 dark:bg-red-500/10"
                                    whileHover={{ rotate: [0, -15, 15, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <p.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </motion.div>
                                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">{p.title}</h3>
                                <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-gray-400">{p.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ══════════════ FEATURES ══════════════ */}
            <section id="features" className="relative px-6 py-28">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-16 text-center">
                        <SectionBadge color="border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400" icon={Zap} label="Core Features" />
                        <SectionHeading className="mb-4">Everything You Need to Succeed</SectionHeading>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.25, ease }}
                            className="text-slate-500 dark:text-gray-400 font-medium max-w-xl mx-auto"
                        >
                            Nine powerful modules working together so you never study the hard way again.
                        </motion.p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <FeatureCard key={i} feature={f} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ══════════════ WORKFLOW ══════════════ */}
            <section id="workflow" className="relative px-6 py-28 bg-slate-100 dark:bg-white/[0.02] border-y border-slate-200 dark:border-white/5 overflow-hidden">
                <motion.div
                    className="pointer-events-none absolute -right-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-purple-600/5 dark:bg-[#8c30e8]/10 blur-[100px]"
                    animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="mx-auto max-w-6xl relative z-10">
                    <div className="text-center mb-16">
                        <SectionBadge color="border-purple-200 bg-purple-50 text-purple-600 dark:border-[#8c30e8]/30 dark:bg-[#8c30e8]/10 dark:text-[#8c30e8]" icon={Target} label="How It Works" />
                        <SectionHeading className="mb-4">A Ritual Built For Deep Work</SectionHeading>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2, ease }}
                            className="text-slate-500 dark:text-gray-400 font-medium max-w-xl mx-auto"
                        >
                            Three simple steps. One powerful system. Focus on what matters.
                        </motion.p>
                    </div>

                    <div className="grid gap-12 lg:grid-cols-2 items-center">
                        {/* Steps */}
                        <div className="space-y-8">
                            {workflow.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.65, ease, delay: i * 0.15 }}
                                    className="flex gap-5 group"
                                >
                                    <div className="flex flex-col items-center">
                                        <motion.div
                                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 border border-purple-200 text-purple-600 dark:bg-[#8c30e8]/10 dark:border-[#8c30e8]/20 dark:text-[#8c30e8] font-mono text-sm font-bold transition-all duration-300 group-hover:bg-purple-200 dark:group-hover:bg-[#8c30e8]/25"
                                            whileHover={{ scale: 1.15, rotate: 6 }}
                                        >
                                            {step.step}
                                        </motion.div>
                                        {i < workflow.length - 1 && (
                                            <motion.div
                                                className="mt-2 h-full w-px bg-purple-600/30 dark:bg-[#8c30e8]/30"
                                                initial={{ scaleY: 0 }}
                                                whileInView={{ scaleY: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.7, delay: i * 0.15 + 0.4, ease }}
                                                style={{ transformOrigin: 'top' }}
                                            />
                                        )}
                                    </div>
                                    <div className="pb-4">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-[#8c30e8]">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-gray-400 leading-relaxed">{step.detail}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Timer Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: 60, scale: 0.93 }}
                            whileInView={{ opacity: 1, x: 0, scale: 1 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.8, ease, delay: 0.2 }}
                            whileHover={{ y: -6 }}
                            className="rounded-[1.75rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#191121] p-8 shadow-2xl shadow-purple-600/5 dark:shadow-[#8c30e8]/10"
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        className="h-3 w-3 rounded-full bg-emerald-500"
                                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 1.8, repeat: Infinity }}
                                        style={{ boxShadow: '0 0 10px rgba(16,185,129,0.6)' }}
                                    />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Focus Mode Active</span>
                                </div>
                                <span className="rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-gray-400">Session 2 / 4</span>
                            </div>

                            <div className="flex justify-center mb-8">
                                <div className="relative w-48 h-48">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                                        <circle cx="100" cy="100" r="85" strokeWidth="7" className="fill-none stroke-slate-200 dark:stroke-white/10" />
                                        <motion.circle
                                            cx="100"
                                            cy="100"
                                            r="85"
                                            strokeWidth="7"
                                            strokeLinecap="round"
                                            className="fill-none stroke-purple-600 dark:stroke-[#8c30e8]"
                                            strokeDasharray="534"
                                            initial={{ strokeDashoffset: 534 }}
                                            whileInView={{ strokeDashoffset: 181 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.6, ease, delay: 0.5 }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-bold font-mono text-slate-900 dark:text-white tracking-wider">25:00</span>
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 mt-1 uppercase tracking-widest">remaining</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 rounded-xl bg-purple-50 dark:bg-[#8c30e8]/10 border border-purple-100 dark:border-[#8c30e8]/20 p-5">
                                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-purple-600 dark:text-[#8c30e8]">Current Task</div>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">Data Structures Review</div>
                                <div className="mt-1 text-sm font-medium text-slate-500 dark:text-gray-400">Binary Trees and Graphs</div>
                            </div>

                            <div className="mb-6">
                                <div className="mb-2 flex justify-between text-xs font-bold text-slate-500 dark:text-gray-400">
                                    <span>Session Progress</span>
                                    <motion.span
                                        className="text-purple-600 dark:text-[#8c30e8]"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 1.1 }}
                                    >
                                        66%
                                    </motion.span>
                                </div>
                                <AnimatedProgressBar pct={66} />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { val: '7d', label: 'Streak', color: 'text-yellow-600 dark:text-yellow-400' },
                                    { val: '12', label: 'Notes', color: 'text-purple-600 dark:text-[#8c30e8]' },
                                    { val: '94', label: 'XP', color: 'text-slate-900 dark:text-white' }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.75 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.9 + i * 0.1, type: 'spring', stiffness: 280 }}
                                        whileHover={{ scale: 1.08, y: -2 }}
                                        className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-center hover:border-purple-300 dark:hover:border-[#8c30e8]/30 transition-colors duration-300"
                                    >
                                        <div className={`text-2xl font-bold ${item.color}`}>{item.val}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-gray-400 font-bold mt-1 uppercase tracking-wider">{item.label}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ══════════════ TESTIMONIALS ══════════════ */}
            <section className="relative py-28 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-12 text-center">
                        <SectionBadge color="border-yellow-200 bg-yellow-50 text-yellow-600 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400" icon={Star} label="Reviews" />
                        <SectionHeading>Loved by Students and Teachers</SectionHeading>
                    </div>
                </div>
                <TestimonialsMarquee isMobile={isMobile} />
            </section>

            <AnimatedDivider />

            {/* ══════════════ PRICING ══════════════ */}
            <section id="pricing" className="relative px-6 py-28 bg-slate-100 dark:bg-white/[0.02] border-y border-slate-200 dark:border-white/5 overflow-hidden">
                <motion.div
                    className="pointer-events-none absolute -left-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-blue-600/5 dark:bg-[#8c30e8]/10 blur-[100px]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="mx-auto max-w-7xl relative z-10">
                    <div className="mb-16 text-center">
                        <SectionHeading className="mb-6">Invest In Your Grades</SectionHeading>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.25, ease }}
                            className="flex items-center justify-center gap-4 text-sm font-bold"
                        >
                            <span className={!isYearly ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400'}>Monthly</span>
                            <button
                                onClick={() => setIsYearly((v) => !v)}
                                className="relative w-14 h-7 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20 flex items-center p-1 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                                <motion.div
                                    className="w-5 h-5 rounded-full bg-purple-600 dark:bg-[#8c30e8] shadow-md"
                                    animate={{ x: isYearly ? 26 : 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                            <span className={`flex items-center gap-2 ${isYearly ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400'}`}>
                                Annually
                                <motion.span
                                    animate={isYearly ? { scale: [1, 1.12, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider"
                                >
                                    Save 20%
                                </motion.span>
                            </span>
                        </motion.div>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3 items-stretch">
                        {pricingPlans.map((plan, i) => (
                            <PricingCard key={plan.title} plan={plan} isYearly={isYearly} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            <AnimatedDivider />

            {/* ══════════════ FINAL CTA ══════════════ */}
            <section className="relative px-6 py-36 text-center overflow-hidden">
                <motion.div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
                    animate={{ opacity: [0.3, 0.65, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <div className="h-[400px] w-[700px] rounded-full bg-purple-600/5 dark:bg-[#8c30e8]/10 blur-[120px]" />
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={stagger}
                    className="mx-auto max-w-3xl relative z-10"
                >
                    <motion.div variants={fadeUp} className="mb-4">
                        <SectionBadge color="border-purple-200 bg-purple-50 text-purple-600 dark:border-[#8c30e8]/30 dark:bg-[#8c30e8]/10 dark:text-[#8c30e8]" icon={Sparkles} label="Get Started Free" />
                    </motion.div>

                    <motion.h2
                        className="mb-6 font-sans text-5xl md:text-6xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white"
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={stagger}
                    >
                        {['Stop', 'Procrastinating.'].map((w, i) => (
                            <motion.span key={i} variants={fadeUp} className="inline-block mr-3">
                                {w}
                            </motion.span>
                        ))}
                        <br />
                        {['Start', 'Achieving.'].map((w, i) => (
                            <motion.span
                                key={i}
                                variants={fadeUp}
                                className="inline-block mr-3 text-purple-600 dark:text-[#8c30e8]"
                            >
                                {w}
                            </motion.span>
                        ))}
                    </motion.h2>

                    <motion.p variants={fadeUp} className="mb-10 text-lg font-medium text-slate-500 dark:text-gray-400">
                        Join the smartest study community today. Setup takes less than 60 seconds.
                    </motion.p>

                    <motion.div variants={fadeUp}>
                        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} className="inline-block">
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-3 rounded-full bg-slate-900 dark:bg-white px-10 py-4 text-lg font-bold text-white dark:text-slate-900 shadow-xl hover:shadow-2xl transition-shadow"
                            >
                                Create Free Account
                                <motion.span className="inline-flex" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                                    <ArrowRight className="h-5 w-5" />
                                </motion.span>
                            </Link>
                        </motion.div>
                        <p className="mt-5 text-sm font-bold text-slate-500 dark:text-gray-400">Free forever plan • No credit card required</p>
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
};

export default LandingPage;