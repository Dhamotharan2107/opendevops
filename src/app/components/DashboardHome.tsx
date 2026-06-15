import { Link } from 'react-router';
import {
  Rocket,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ExternalLink,
  GitBranch,
  Clock,
  TrendingUp,
  Zap,
  ArrowRight,
  Globe,
  Bot,
  BarChart3,
  Check
} from 'lucide-react';

export function DashboardHome() {
  const projects = [
    {
      name: 'E-commerce Platform',
      repo: 'github.com/acme/ecommerce',
      branch: 'main',
      status: 'running',
      lastDeploy: '5 minutes ago',
      url: 'https://ecommerce.example.com'
    },
    {
      name: 'Mobile App API',
      repo: 'github.com/acme/mobile-api',
      branch: 'develop',
      status: 'error',
      lastDeploy: '2 hours ago',
      url: 'https://api.example.com'
    },
    {
      name: 'Admin Dashboard',
      repo: 'github.com/acme/admin',
      branch: 'main',
      status: 'running',
      lastDeploy: '1 day ago',
      url: 'https://admin.example.com'
    },
    {
      name: 'Analytics Service',
      repo: 'github.com/acme/analytics',
      branch: 'staging',
      status: 'deploying',
      lastDeploy: 'Deploying now...',
      url: 'https://analytics.example.com'
    }
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, John</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              icon: Rocket,
              label: 'Total Projects',
              value: '12',
              change: '+2 this week',
              trend: 'up',
              gradient: 'from-blue-500 to-cyan-500',
              border: 'border-blue-500/30'
            },
            {
              icon: Activity,
              label: 'Running Applications',
              value: '8',
              change: '2 deploying',
              trend: 'neutral',
              gradient: 'from-green-500 to-emerald-500',
              border: 'border-green-500/30'
            },
            {
              icon: AlertTriangle,
              label: 'Errors Today',
              value: '3',
              change: '-5 from yesterday',
              trend: 'down',
              gradient: 'from-red-500 to-rose-500',
              border: 'border-red-500/30'
            },
            {
              icon: Zap,
              label: 'AI Tests Executed',
              value: '47',
              change: '+12 today',
              trend: 'up',
              gradient: 'from-purple-500 to-pink-500',
              border: 'border-purple-500/30'
            }
          ].map((stat, i) => (
            <div
              key={i}
              className={`relative overflow-hidden border ${stat.border} rounded-2xl p-6 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl group hover:from-card/70 hover:to-card/50 hover:shadow-2xl transition-all duration-500 hover:scale-105`}
            >
              {/* Animated gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} style={{ zIndex: -1 }} />

              <div className="relative">
                {/* Icon */}
                <div className="mb-4 relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                    <stat.icon className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <div className={`absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
                </div>

                {/* Value */}
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-sm text-muted-foreground mb-3 font-medium">
                  {stat.label}
                </div>

                {/* Change indicator */}
                <div className="flex items-center gap-2">
                  {stat.trend === 'up' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500 font-medium">{stat.change}</span>
                    </div>
                  )}
                  {stat.trend === 'down' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                      <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
                      <span className="text-xs text-red-500 font-medium">{stat.change}</span>
                    </div>
                  )}
                  {stat.trend === 'neutral' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                      <Activity className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-500 font-medium">{stat.change}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Projects</h2>
            <Link
              to="/dashboard/projects"
              className="text-sm text-primary hover:underline"
            >
              View all projects
            </Link>
          </div>

          <div className="border border-border/50 rounded-2xl overflow-hidden bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-gradient-to-r from-muted/40 to-muted/20">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Last Deploy
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Public URL
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-0 hover:bg-gradient-to-r hover:from-accent/40 hover:to-accent/20 transition-all duration-300 group"
                    >
                      <td className="py-5 px-6">
                        <Link
                          to="/dashboard/project/1"
                          className="flex items-center gap-3 group/link"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            project.status === 'running'
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                              : project.status === 'error'
                              ? 'bg-gradient-to-br from-red-500 to-rose-600'
                              : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                          } shadow-lg`}>
                            <Rocket className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold group-hover/link:text-primary transition-colors">
                              {project.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                              {project.repo}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-lg border border-border/50 w-fit">
                          <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{project.branch}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          {project.status === 'running' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-sm font-medium text-green-500">Running</span>
                            </div>
                          )}
                          {project.status === 'error' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-medium text-red-500">Error</span>
                            </div>
                          )}
                          {project.status === 'deploying' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                              <span className="text-sm font-medium text-blue-500">Deploying</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{project.lastDeploy}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </a>
                      </td>
                      <td className="py-5 px-6">
                        <Link
                          to="/dashboard/project/1"
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/btn"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Deployment Timeline */}
        <div>
          <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {[
              {
                type: 'deployment',
                project: 'E-commerce Platform',
                message: 'Deployed to production',
                time: '5 minutes ago',
                status: 'success'
              },
              {
                type: 'test',
                project: 'Mobile App API',
                message: 'AI test completed with 2 warnings',
                time: '15 minutes ago',
                status: 'warning'
              },
              {
                type: 'error',
                project: 'Mobile App API',
                message: 'Connection timeout error detected',
                time: '2 hours ago',
                status: 'error'
              },
              {
                type: 'deployment',
                project: 'Admin Dashboard',
                message: 'Deployed to staging',
                time: '1 day ago',
                status: 'success'
              }
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 border border-border/50 rounded-lg bg-card/30 backdrop-blur-sm"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success'
                      ? 'bg-green-500'
                      : activity.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium mb-1">{activity.project}</div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {activity.message}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
