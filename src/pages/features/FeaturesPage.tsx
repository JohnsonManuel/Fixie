import React from "react";
import Layout from "../Layout";
import SEOHead from "../../components/layout/SEOHead";
import { getPageSEO } from "../../utils/seoConfig";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Shield, 
  BarChart3, 
  Puzzle, 
  Clock, 
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Globe,
  Lock
} from "lucide-react";

const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const seo = getPageSEO('features');

  const heroFeatures = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "AI-Powered Resolution",
      description: "GPT-4o powered intelligent troubleshooting that learns from every interaction"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Chat-First Interface",
      description: "Natural conversation interface that feels like talking to a human expert"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Deployment",
      description: "Deploy in hours, not months. Get up and running immediately"
    }
  ];

  const coreFeatures = [
    {
      icon: <Brain className="w-12 h-12" />,
      title: "Intelligent Problem Solving",
      description: "Advanced AI that understands context, learns from patterns, and provides accurate solutions to complex IT issues.",
      benefits: [
        "Contextual understanding of IT problems",
        "Pattern recognition for faster resolution",
        "Continuous learning from interactions",
        "Multi-step troubleshooting guidance"
      ]
    },
    {
      icon: <Puzzle className="w-12 h-12" />,
      title: "Universal Integration",
      description: "Seamlessly connects with all your existing IT tools and platforms without disrupting your workflow.",
      benefits: [
        "200+ pre-built integrations",
        "Custom API connections",
        "Real-time data synchronization",
        "No workflow disruption"
      ]
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Enterprise Security",
      description: "Bank-level security with SOC 2, GDPR compliance and enterprise-grade data protection.",
      benefits: [
        "SOC 2 Type II certified",
        "GDPR & HIPAA compliant",
        "End-to-end encryption",
        "Role-based access control"
      ]
    },
    {
      icon: <BarChart3 className="w-12 h-12" />,
      title: "Advanced Analytics",
      description: "Comprehensive insights into IT support performance, user satisfaction, and operational efficiency.",
      benefits: [
        "Real-time performance dashboards",
        "User satisfaction metrics",
        "Resolution time analytics",
        "Predictive issue detection"
      ]
    },
    {
      icon: <Clock className="w-12 h-12" />,
      title: "24/7 Availability",
      description: "Round-the-clock AI support that never sleeps, ensuring your team gets help whenever they need it.",
      benefits: [
        "Always-on AI assistance",
        "Global timezone support",
        "Instant response times",
        "No maintenance windows"
      ]
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Smart Escalation",
      description: "Intelligent routing system that knows when to escalate to human experts for complex issues.",
      benefits: [
        "Automatic complexity detection",
        "Smart routing to specialists",
        "Seamless handoff process",
        "Context preservation"
      ]
    }
  ];

  const integrations = [
    { name: "Slack", logo: "🔗" },
    { name: "Microsoft Teams", logo: "💬" },
    { name: "Jira", logo: "🎫" },
    { name: "ServiceNow", logo: "⚙️" },
    { name: "Freshdesk", logo: "📧" },
    { name: "Zendesk", logo: "💼" },
    { name: "AWS", logo: "☁️" },
    { name: "Azure", logo: "🌐" }
  ];

  const useCases = [
    {
      title: "Password Resets & Account Management",
      description: "Automated password resets, account unlocks, and user provisioning",
      icon: <Lock className="w-6 h-6" />
    },
    {
      title: "Software Installation & Updates",
      description: "Guided software installation, updates, and troubleshooting",
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      title: "Network Connectivity Issues",
      description: "VPN setup, network diagnostics, and connectivity troubleshooting",
      icon: <Globe className="w-6 h-6" />
    },
    {
      title: "Hardware Setup & Maintenance",
      description: "Printer setup, device configuration, and hardware diagnostics",
      icon: <CheckCircle className="w-6 h-6" />
    }
  ];

  return (
    <Layout>
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={seo.canonical}
        structuredData={seo.structuredData}
      />
      
      <div className="min-h-screen bg-white dark:bg-neutral-900 pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Powerful{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  AI Features
                </span>
                {" "}for Modern IT Support
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Discover how Fixie's advanced AI capabilities transform traditional IT support 
                into an intelligent, efficient, and user-friendly experience.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {heroFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-xl mb-4">
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-20 px-6 bg-gray-50 dark:bg-neutral-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Core Features That Set Us Apart
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Everything you need for intelligent, scalable IT support
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {coreFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
                        <div className="text-indigo-600 dark:text-indigo-400">
                          {feature.icon}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {feature.description}
                      </p>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Common Use Cases
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                See how Fixie handles everyday IT support scenarios
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                        <div className="text-indigo-600 dark:text-indigo-400">
                          {useCase.icon}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {useCase.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="py-20 px-6 bg-gray-50 dark:bg-neutral-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Seamless Integrations
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Connect with all your favorite tools and platforms
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
              {integrations.map((integration, index) => (
                <motion.div
                  key={integration.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="text-3xl mb-2">{integration.logo}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    {integration.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Experience the Future of IT Support
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                See how Fixie can transform your IT support experience with intelligent automation
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/demo")}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Try Fixie Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <button
                  onClick={() => navigate("/pricing")}
                  className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  View Pricing
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default FeaturesPage;