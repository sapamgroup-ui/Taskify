import { Helmet } from 'react-helmet'

export default function SEO({ title, description, url, image, type = 'website' }) {
  const siteTitle = 'Taskify — India\'s #1 Local Task Marketplace'
  const defaultDesc = 'Find trusted local Taskers for any job — cleaning, plumbing, delivery, web development and more. Set your price, pick your Tasker, get it done.'
  const fullTitle = title ? `${title} | Taskify` : siteTitle

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDesc} />
      <meta name="keywords" content="task marketplace, freelance, local services, handyman, cleaning, plumbing, delivery, Taskify, India" />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || 'https://taskify-uum5.vercel.app'} />
      <meta property="og:image" content={image || 'https://taskify-uum5.vercel.app/og-image.png'} />
      <meta property="og:site_name" content="Taskify" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDesc} />
      
      {/* Canonical */}
      <link rel="canonical" href={url || 'https://taskify-uum5.vercel.app'} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Taskify",
          "url": "https://taskify-uum5.vercel.app",
          "description": defaultDesc,
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://taskify-uum5.vercel.app/tasks?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  )
}