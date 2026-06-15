import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Lock, Zap, ArrowRight, Check, Star } from 'lucide-react';
import { useApp } from '../../lib/store';

type Plan = 'free' | 'pro' | 'enterprise';

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };

const PRO_FEATURES = [
  'AI-powered testing & automation',
  'Live terminal & SSH access',
  'Advanced monitoring & metrics',
  'Error tracking & alerting',
  'Full log viewer',
  'Task & bug management',
  'Team collaboration',
  'Real-time chat',
];

interface PlanGateProps {
  children: ReactNode;
  requiredPlan?: Plan;
  featureName?: string;
}

export function PlanGate({ children, requiredPlan = 'pro', featureName }: PlanGateProps) {
  const { state } = useApp();
  const userPlan = (state.user as any)?.plan ?? 'free';
  const hasAccess = (PLAN_ORDER[userPlan] ?? 0) >= (PLAN_ORDER[requiredPlan] ?? 1);

  if (hasAccess) return <>{children}</>;

  return <UpgradeWall requiredPlan={requiredPlan} featureName={featureName} />;
}

function UpgradeWall({ requiredPlan, featureName }: { requiredPlan: Plan; featureName?: string }) {
  const planLabel = requiredPlan === 'enterprise' ? 'Enterprise' : 'Pro';

  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg text-center"
      >
        {/* Icon */}
        <div className="relative inline-flex mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
            <Lock className="w-9 h-9 text-violet-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {featureName ? `${featureName} requires ${planLabel}` : `Upgrade to ${planLabel}`}
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
          This feature is available on the <span className="text-white font-medium">{planLabel} plan</span>.
          Contact your admin to upgrade your account.
        </p>

        {/* Feature list */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-left">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
            <span className="text-sm font-semibold text-white">What's included in {planLabel}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-violet-400" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-violet-300 flex items-center gap-3">
          <Zap className="w-4 h-4 flex-shrink-0 text-violet-400" fill="currentColor" />
          <span>Ask your admin to upgrade your plan at <strong className="text-white">/admin-prd/users</strong></span>
          <ArrowRight className="w-4 h-4 flex-shrink-0 ml-auto" />
        </div>
      </motion.div>
    </div>
  );
}
