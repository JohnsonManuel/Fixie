interface DynamicContent {
  hero: {
    title: string;
    subtitle: string[];
    ctaText: string;
  };
  capabilities: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  benefits: Array<{
    number: string;
    title: string;
    description: string;
  }>;
  integrations: string[];
  useCases: Array<{
    icon: string;
    title: string;
  }>;
  stats: {
    users: string;
    companies: string;
    uptime: string;
  };
  lastUpdated: string;
}

class DynamicDataService {
  private static instance: DynamicDataService;
  private cachedData: DynamicContent | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  static getInstance(): DynamicDataService {
    if (!DynamicDataService.instance) {
      DynamicDataService.instance = new DynamicDataService();
    }
    return DynamicDataService.instance;
  }

  async getDynamicContent(): Promise<DynamicContent> {
    const now = Date.now();
    
    if (this.cachedData && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      const data = await this.fetchLatestContent();
      this.cachedData = data;
      this.lastFetch = now;
      return data;
    } catch (error) {
      console.error('Failed to fetch dynamic content:', error);
      return this.getEmergencyFallback();
    }
  }

  private async fetchLatestContent(): Promise<DynamicContent> {
    // Simulate API call to content management system
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          hero: {
            title: "We Fix IT.",
            subtitle: [
              "Fixie is your team's AI-powered IT sidekick — resolving passwords, access issues, and everyday problems instantly. No forms, no tickets, no waiting.",
              "Your employees just ask, Fixie handles Level-1 support, and IT focuses on strategic work that drives business value."
            ],
            ctaText: "Book a demo"
          },
          capabilities: [
            {
              icon: "🏢",
              title: "AI-Powered Servicedesk Management",
              description: "Intelligent automation for modern IT support workflows with machine learning"
            },
            {
              icon: "⏱️",
              title: "Zero Downtime Operations",
              description: "Proactive monitoring and instant issue resolution with 99.9% uptime guarantee"
            },
            {
              icon: "⚡",
              title: "Universal Integrations",
              description: "Connect seamlessly with 200+ IT tools and platforms in your ecosystem"
            },
            {
              icon: "🔒",
              title: "Enterprise Security",
              description: "SOC 2 compliant with end-to-end encryption and advanced threat protection"
            }
          ],
          features: [
            {
              icon: "🧠",
              title: "Advanced AI Resolution Engine",
              description: "GPT-4 powered system that understands context, learns from interactions, and provides intelligent solutions"
            },
            {
              icon: "🔗",
              title: "Native ITSM Integrations",
              description: "Deep integrations with ServiceNow, Jira, Zendesk, Freshdesk, and 50+ enterprise platforms"
            },
            {
              icon: "🛠️",
              title: "Automated Tool Execution",
              description: "Safely execute real-time actions: system restarts, user provisioning, software installations, and more"
            },
            {
              icon: "📊",
              title: "Real-time Analytics Dashboard",
              description: "Live insights on resolution times, user satisfaction, cost savings, and performance metrics"
            }
          ],
          benefits: [
            {
              number: "87%",
              title: "Faster Resolution Times",
              description: "Dramatically reduce IT issue resolution time and boost user satisfaction scores"
            },
            {
              number: "24/7",
              title: "Always Available Support",
              description: "AI never sleeps, providing consistent global support across all time zones"
            },
            {
              number: "65%",
              title: "Lower Support Costs",
              description: "Automate high-volume tickets and reduce manual workload for IT teams"
            }
          ],
          integrations: [
            "Slack", "Microsoft Teams", "Jira", "ServiceNow", "Zendesk", "Freshdesk", 
            "AWS", "Azure", "Google Cloud", "Okta", "Active Directory", "Zoom", 
            "GNOME", "ManageEngine", "Intune", "Salesforce"
          ],
          useCases: [
            { icon: "🔐", title: "Password resets & account unlocks" },
            { icon: "📧", title: "Email configuration & troubleshooting" },
            { icon: "🌐", title: "VPN & network connectivity fixes" },
            { icon: "🖨️", title: "Printer setup & troubleshooting" },
            { icon: "💾", title: "Software installation & updates" },
            { icon: "✅", title: "Endpoint compliance & security checks" }
          ],
          stats: {
            users: "15K+",
            companies: "750+",
            uptime: "99.9%"
          },
          lastUpdated: new Date().toISOString()
        });
      }, 150);
    });
  }

  private getEmergencyFallback(): DynamicContent {
    return {
      hero: {
        title: "We Fix IT.",
        subtitle: [
          "AI-powered IT support platform for modern teams.",
          "Instant resolution, no waiting."
        ],
        ctaText: "Get Started"
      },
      capabilities: [
        { icon: "🏢", title: "AI Support", description: "Intelligent IT assistance" },
        { icon: "⏱️", title: "Fast Response", description: "Quick issue resolution" },
        { icon: "⚡", title: "Integrations", description: "Connect your tools" },
        { icon: "🔒", title: "Secure", description: "Enterprise-grade security" }
      ],
      features: [
        { icon: "🧠", title: "AI Engine", description: "Smart problem solving" },
        { icon: "🔗", title: "Integrations", description: "Connect everything" },
        { icon: "🛠️", title: "Automation", description: "Automated workflows" },
        { icon: "📊", title: "Analytics", description: "Performance insights" }
      ],
      benefits: [
        { number: "80%", title: "Faster", description: "Quicker resolutions" },
        { number: "24/7", title: "Available", description: "Always online" },
        { number: "50%", title: "Savings", description: "Cost reduction" }
      ],
      integrations: ["Slack", "Teams", "Jira", "ServiceNow"],
      useCases: [
        { icon: "🔐", title: "Password resets" },
        { icon: "📧", title: "Email issues" },
        { icon: "🌐", title: "Network problems" }
      ],
      stats: { users: "10K+", companies: "500+", uptime: "99%" },
      lastUpdated: new Date().toISOString()
    };
  }

  clearCache(): void {
    this.cachedData = null;
    this.lastFetch = 0;
  }
}

export default DynamicDataService;
export type { DynamicContent };