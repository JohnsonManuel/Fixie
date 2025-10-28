// Google Analytics 4 and tracking utilities
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export const initGA = (measurementId: string) => {
  // Create gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  
  // Initialize with current date
  window.gtag('js', new Date());
  
  // Configure GA4
  window.gtag('config', measurementId, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
    // Enhanced ecommerce and conversion tracking
    allow_enhanced_conversions: true,
    allow_google_signals: true,
    // Custom parameters for IT support platform
    custom_map: {
      'custom_parameter_1': 'user_type',
      'custom_parameter_2': 'company_size',
      'custom_parameter_3': 'current_itsm'
    }
  });
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      event_label: parameters?.label || '',
      value: parameters?.value || 0,
      ...parameters
    });
  }
};

// Track demo requests (high-value conversion)
export const trackDemoRequest = (source: string, userType?: string) => {
  trackEvent('demo_request', {
    event_category: 'conversion',
    event_label: source,
    value: 100, // High value event
    user_type: userType,
    conversion_type: 'demo_request'
  });
};

// Track ServiceNow comparison views
export const trackServiceNowComparison = (page: string) => {
  trackEvent('servicenow_comparison_view', {
    event_category: 'product_interest',
    event_label: page,
    value: 50,
    competitor: 'servicenow'
  });
};

// Track feature interactions
export const trackFeatureInteraction = (feature: string, action: string) => {
  trackEvent('feature_interaction', {
    event_category: 'product_engagement',
    event_label: feature,
    action: action,
    value: 10
  });
};

// Track scroll depth (for engagement measurement)
export const trackScrollDepth = (percentage: number) => {
  trackEvent('scroll_depth', {
    event_category: 'engagement',
    event_label: `${percentage}%`,
    value: percentage
  });
};

// Track time on page
export const trackTimeOnPage = (seconds: number, page: string) => {
  trackEvent('time_on_page', {
    event_category: 'engagement',
    event_label: page,
    value: seconds
  });
};

// Track outbound links
export const trackOutboundLink = (url: string, linkText: string) => {
  trackEvent('outbound_link_click', {
    event_category: 'external_engagement',
    event_label: url,
    link_text: linkText
  });
};

// Track form submissions
export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent('form_submission', {
    event_category: 'conversion',
    event_label: formName,
    success: success,
    value: success ? 25 : 0
  });
};

// Track search queries (if you add search functionality)
export const trackSearch = (query: string, results: number) => {
  trackEvent('search', {
    event_category: 'site_search',
    event_label: query,
    search_term: query,
    results_count: results
  });
};

// Enhanced ecommerce tracking for demo bookings
export const trackDemoBooking = (demoType: string, userInfo: any) => {
  trackEvent('purchase', {
    transaction_id: `demo_${Date.now()}`,
    value: 0, // Free demo but high intent
    currency: 'USD',
    items: [{
      item_id: 'demo_booking',
      item_name: `Fixie Demo - ${demoType}`,
      item_category: 'Demo',
      quantity: 1,
      price: 0
    }],
    // Custom parameters
    demo_type: demoType,
    company_size: userInfo.companySize,
    current_solution: userInfo.currentSolution
  });
};