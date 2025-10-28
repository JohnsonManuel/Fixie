import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  twitterImage?: string;
  noindex?: boolean;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Fixie - AI-Powered IT Support Platform | ServiceNow Alternative for SMBs"
}) => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
};

export default SEOHead;