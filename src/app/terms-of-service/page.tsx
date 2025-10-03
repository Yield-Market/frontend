import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#1a1a2e] dark:to-[#16213e]">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Last updated: October 3, 2025
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              By accessing and using YieldMarket services, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. Use License</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Permission is granted to temporarily download one copy of YieldMarket materials for personal, non-commercial transitory viewing only.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. Disclaimer</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The materials on YieldMarket are provided on an &apos;as is&apos; basis. YieldMarket makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. Limitations</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              In no event shall YieldMarket or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use YieldMarket materials, even if YieldMarket or a YieldMarket authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. Accuracy of Materials</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The materials appearing on YieldMarket could include technical, typographical, or photographic errors. YieldMarket does not warrant that any of the materials on its website are accurate, complete, or current.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Links</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              YieldMarket has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. Modifications</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              YieldMarket may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. Governing Law</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which YieldMarket operates.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. Contact Information</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have any questions about these Terms of Service, please contact us through our official channels.
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-600">
            <Link 
              href="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}