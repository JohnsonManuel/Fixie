import React from "react";
import Layout from "../Layout";
import SEOHead from "../../components/layout/SEOHead";
import { getPageSEO } from "../../utils/seoConfig";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Zap, Shield, Users, Headphones } from "lucide-react";

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const seo = getPageSEO('pricing');

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "Forever",
      description: "Perfect for small teams getting started with AI IT support",
      features: [
        "Up to 50 employees",
        "Basic AI troubleshooting",
        "Email support",
        "Core integrations (Slack, Teams)",
        "Basic analytics",
        "Community support"
      ],
      limitations: [
        "Limited to 100 tickets/month",
        "No custom integrations",
        "No priority support"
      ],
      cta: "Get Started Free",
      popular: false,
      color: "from-gray-500 to-gray-700"
    },
    {
      name: "Professional",
      price: "$29",
      period: "per month",
      description: "Advanced AI support for growing teams and businesses",
      features: [
        "Up to 500 employees",
        "Advanced AI resolution engine",
        "Priority email & chat support",
        "All integrations included",
        "Advanced analytics & reporting",
        "Custom workflows",
        "API access",
        "SSO integration"
      ],
      limitations: [],
      cta: "Start Free Trial",
      popular: true,
      color: "from-indigo-500 to-purple-600"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "Contact us",
      description: "Enterprise-grade AI IT support with unlimited scale",
      features: [
        "Unlimited employees",
        "Custom AI model training",
        "24/7 dedicated support",
        "Custom integrations",
        "Advanced security & compliance",
        "On-premise deployment option",
        "Dedicated success manager",
        "SLA guarantees",
        "White-label options"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false,
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast Setup",
      description: "Deploy in hours, not months. Get your AI IT support running instantly."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "SOC 2, GDPR compliant with enterprise-grade security standards."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Unlimited Scale",
      description: "From 10 to 10,000+ employees, Fixie scales with your business."
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "24/7 Support",
      description: "Our AI never sleeps, providing round-the-clock IT support."
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
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Simple, Transparent{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Pricing
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8"
            >
              Choose the perfect plan for your team. Start free, scale as you grow.
            </motion.p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative rounded-2xl border p-8 ${
                    plan.popular 
                      ? 'border-indigo-500 bg-white dark:bg-neutral-800 shadow-2xl scale-105' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.period !== "Contact us" && (
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {plan.description}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-center">
                        <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-500 dark:text-gray-400">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate("/demo")}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-gray-50 dark:bg-neutral-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose Fixie?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Built for modern teams who need reliable, intelligent IT support
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg mb-4">
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
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
                Ready to Transform Your IT Support?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Join thousands of teams already using Fixie to provide better IT support
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/demo")}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => navigate("/demo")}
                  className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  Schedule Demo
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PricingPage;