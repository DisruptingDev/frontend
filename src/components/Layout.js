import { useEffect } from 'react'
import Head from 'next/head'

export default function Layout({ children }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://chat-widget.hiverhq.com/chat-widget/js/sdk.js'
    script.defer = true
    script.async = true
    script.onload = () => {
      window.chatwootSDK.run({
        websiteToken: 'BVzRWDgxipHacrSLUQ43pN8y',
        baseUrl: 'http://chatwoot-rails-api-service:80'
      })
    }
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <>
      <Head>
        {/* Otros meta tags */}
      </Head>
      {children}
    </>
  )
}