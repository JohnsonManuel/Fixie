// SEO Configuration for all pages
export const seoConfig = {
  home: {
    title: "Fixie - AI-Powered IT Support Platform | ServiceNow Alternative for SMBs",
    description: "Enterprise-grade AI IT Support that outperforms traditional ITSM. Deploy in hours, not months. 90% cost reduction vs ServiceNow. GPT-4o powered intelligent troubleshooting for SMBs under 1,000 employees.",
    keywords: "ServiceNow alternative, AI IT support, enterprise ITSM platform, ServiceNow competitor, IT service desk software, AI helpdesk, automated IT support, ServiceNow replacement, intelligent service management, enterprise helpdesk platform, AI-powered ITSM, ServiceNow pricing alternative, ServiceNow migration, enterprise service management, Fortune 500 ITSM, IT automation platform, ServiceNow portal alternative, enterprise ticket management, AI service desk, ServiceNow cost reduction, GPT-4 IT support, conversational AI helpdesk, SMB ITSM solution, IT support automation, intelligent troubleshooting, enterprise AI platform",
    canonical: "https://fixiechat.ai",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Fixie - AI-Powered IT Support Platform",
      "description": "Enterprise-grade AI IT Support that outperforms traditional ITSM",
      "url": "https://fixiechat.ai",
      "mainEntity": {
        "@type": "SoftwareApplication",
        "name": "Fixie",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser"
      }
    }
  },
  
  servicenowAlternative: {
    title: "ServiceNow Alternative | Fixie AI-Powered ITSM Platform - 90% Cost Reduction",
    description: "Replace ServiceNow with Fixie's AI-powered ITSM platform. 90% cost reduction, deploy in hours not months. Perfect ServiceNow alternative for SMBs under 1,000 employees with enterprise-grade features.",
    keywords: "ServiceNow alternative, ServiceNow competitor, ServiceNow replacement, ServiceNow vs Fixie, ServiceNow pricing alternative, ServiceNow cost reduction, enterprise ITSM alternative, AI ITSM platform, ServiceNow migration, cheaper ServiceNow alternative, SMB ITSM solution, ServiceNow portal alternative, intelligent service management, AI service desk alternative",
    canonical: "https://fixiechat.ai/servicenow-alternative",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "ServiceNow Alternative - Fixie AI Platform",
      "description": "AI-powered ServiceNow alternative with 90% cost reduction",
      "url": "https://fixiechat.ai/servicenow-alternative"
    }
  },
  
  enterpriseITSM: {
    title: "Enterprise ITSM Platform | AI-Powered IT Service Management - Fixie",
    description: "Enterprise-grade ITSM platform powered by AI. Automated ticket management, intelligent troubleshooting, and seamless integrations. Perfect for Fortune 500 companies and growing enterprises.",
    keywords: "enterprise ITSM platform, AI ITSM solution, enterprise IT service management, Fortune 500 ITSM, enterprise helpdesk platform, AI-powered ITSM, enterprise service management, global ITSM solution, enterprise IT automation, intelligent service management, enterprise ticket management, AI service desk, enterprise ITSM software",
    canonical: "https://fixiechat.ai/enterprise-itsm",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Enterprise ITSM Platform - Fixie",
      "description": "AI-powered enterprise ITSM platform for Fortune 500 companies",
      "url": "https://fixiechat.ai/enterprise-itsm"
    }
  },
  
  servicenowMigration: {
    title: "ServiceNow Migration to Fixie | Seamless ITSM Platform Migration",
    description: "Migrate from ServiceNow to Fixie's AI-powered ITSM platform. Seamless data migration, 90% cost savings, and enhanced AI capabilities. Expert migration support included.",
    keywords: "ServiceNow migration, ServiceNow to Fixie migration, ITSM migration, ServiceNow data migration, ServiceNow replacement migration, enterprise ITSM migration, AI ITSM migration, ServiceNow alternative migration, ITSM platform migration, ServiceNow exit strategy",
    canonical: "https://fixiechat.ai/servicenow-migration",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "ServiceNow Migration - Fixie",
      "description": "Seamless migration from ServiceNow to Fixie AI platform",
      "url": "https://fixiechat.ai/servicenow-migration"
    }
  },
  
  fortune500ITSM: {
    title: "Fortune 500 ITSM Solution | Enterprise AI IT Support Platform - Fixie",
    description: "Fortune 500-grade ITSM solution with AI-powered automation. Trusted by global enterprises for intelligent IT support, automated troubleshooting, and enterprise-grade security.",
    keywords: "Fortune 500 ITSM, enterprise ITSM solution, Fortune 500 IT support, global ITSM platform, enterprise AI ITSM, Fortune 500 service management, large enterprise ITSM, global IT service platform, enterprise-grade ITSM, Fortune 500 helpdesk, multinational ITSM solution",
    canonical: "https://fixiechat.ai/fortune-500-itsm",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Fortune 500 ITSM Solution - Fixie",
      "description": "Enterprise-grade ITSM solution for Fortune 500 companies",
      "url": "https://fixiechat.ai/fortune-500-itsm"
    }
  },
  
  demo: {
    title: "Book a Demo | Fixie AI-Powered IT Support Platform Demo",
    description: "Schedule a personalized demo of Fixie's AI-powered IT support platform. See how we can reduce your IT support costs by 90% and improve resolution times.",
    keywords: "Fixie demo, AI IT support demo, ITSM platform demo, ServiceNow alternative demo, enterprise IT support demo, AI helpdesk demo, book demo, schedule demo, IT support platform demo",
    canonical: "https://fixiechat.ai/demo",
    noindex: false,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Book Demo - Fixie AI Platform",
      "description": "Schedule a personalized demo of Fixie AI platform",
      "url": "https://fixiechat.ai/demo"
    }
  }
};

export const getPageSEO = (page: keyof typeof seoConfig) => {
  return seoConfig[page] || seoConfig.home;
};