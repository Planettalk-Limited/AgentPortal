'use client'

export default function CookiesPage() {

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="prose max-w-none document-style">
          <h1 className="document-title">Cookie Policy</h1>
          
          <div className="max-w-5xl mx-auto">
            {/* Introduction Section */}
            <div className="document-section">
              <h2 className="section-title">What are cookies?</h2>
              <div>
                <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.</p>
                <p>We use cookies and similar technologies on our websites and apps to improve your customer experience. Some cookies are necessary and should not be disabled if you want to make use of the full functionality of our websites and mobile apps. Other cookies can be disabled, but this may affect your customer experience.</p>
              </div>
            </div>
            
            {/* Types of Cookies Section */}
            <div className="document-section">
              <h2 className="section-title">Types of cookies we use</h2>
              
              <div className="document-table-wrapper">
                <div className="document-table">
                  <table>
                    <tbody>
                      <tr>
                        <td className="table-header w-1/3">
                          Essential Cookies
                        </td>
                        <td>
                          <p>These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td className="table-header">
                          Performance Cookies
                        </td>
                        <td>
                          <p>These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td className="table-header">
                          Functional Cookies
                        </td>
                        <td>
                          <p>These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages.</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td className="table-header">
                          Marketing Cookies
                        </td>
                        <td>
                          <p>These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Managing Cookies Section */}
            <div className="document-section">
              <h2 className="section-title">Managing your cookie preferences</h2>
              
              <div>
                <p>You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.</p>
                
                <h3 className="subsection-title">Browser Settings</h3>
                <p>Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit:</p>
                <ul className="document-list">
                  <li><a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">www.aboutcookies.org</a></li>
                  <li><a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">www.allaboutcookies.org</a></li>
                </ul>
                
                <h3 className="subsection-title">Third-party cookies</h3>
                <p>When you visit our website, you may receive cookies that are set by third parties. These are typically used for advertising and analytics purposes. For more information about these cookies and how to opt out, please visit the third party's website directly.</p>
              </div>
            </div>
            
            {/* Contact Section */}
            <div className="document-section">
              <div>
                <h2 className="section-title">Contact us</h2>
                <p className="mb-4">If you have any questions about our use of cookies, please contact us:</p>
                
                <div className="document-subsection">
                  <p className="font-medium">Email:</p>
                  <p className="mb-4">privacy@planettalk.com</p>
                  
                  <p className="font-medium">Mail:</p>
                  <p className="mb-4">
                    Planettalk Limited<br />
                    71-75 Shelton Street<br />
                    London WC2H 9JQ<br />
                    United Kingdom
                  </p>
                </div>
              </div>
              
              {/* Footer section */}
              <div className="document-footer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <a href="#" className="underline">
                    Back to top
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* Document styling - Mobile First */
        .document-style {
          background-color: white;
          color: #333333;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          padding: 0 1rem;
        }
        
        .document-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-align: center;
          line-height: 1.2;
        }
        
        .document-section {
          margin-bottom: 1.5rem;
          border: none;
          box-shadow: none;
          background: white;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          line-height: 1.3;
          word-wrap: break-word;
        }
        
        .subsection-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.3;
        }
        
        .document-subsection {
          background-color: white;
          padding: 0;
          border: none;
          margin-bottom: 0.75rem;
        }
        
        /* Table styling - Mobile First */
        .document-table-wrapper {
          width: 100%;
          margin: 1rem 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .document-table {
          width: 100%;
          border: 1px solid #000;
          border-collapse: collapse;
          min-width: 100%;
        }
        
        .document-table table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          padding: 0;
          min-width: 320px;
        }
        
        .document-table th,
        .document-table td {
          border: 1px solid #000;
          padding: 0.5rem;
          vertical-align: top;
          margin: 0;
          font-size: 0.875rem;
          word-wrap: break-word;
          hyphens: auto;
        }
        
        .table-header {
          background-color: #f8f9fa;
          font-weight: 600;
          border: 1px solid #000;
          padding: 0.5rem;
          margin: 0;
          font-size: 0.875rem;
        }
        
        /* Lists - Mobile optimized */
        .document-list {
          list-style-type: disc;
          padding-left: 1rem;
          margin-top: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .document-list li {
          margin-bottom: 0.375rem;
          word-wrap: break-word;
          hyphens: auto;
        }
        
        /* Footer - Mobile responsive */
        .document-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #000;
          font-size: 0.875rem;
        }
        
        .document-footer .flex {
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }
        
        /* Mobile-specific table layout */
        @media (max-width: 640px) {
          .document-table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #000;
            border-radius: 0.25rem;
            background: #f8f9fa;
          }
          
          .document-table tbody td {
            display: block;
            text-align: left;
            border: none;
            border-bottom: 1px solid #ddd;
            padding: 0.75rem;
          }
          
          .document-table tbody td:last-child {
            border-bottom: none;
          }
          
          .document-table .table-header {
            background-color: #e9ecef;
            font-weight: 700;
            border-bottom: 2px solid #000;
            display: block;
            text-align: center;
          }
          
          /* Add labels for mobile context */
          .document-table tbody td:nth-of-type(2)::before {
            content: "Description: ";
            font-weight: 600;
            display: block;
            margin-bottom: 0.25rem;
            color: #495057;
          }
        }
        
        /* Link styling for better mobile touch */
        a {
          color: #0066cc;
          text-decoration: underline;
          padding: 0.125rem 0;
          margin: -0.125rem 0;
          min-height: 44px;
          display: inline-block;
          line-height: 1.4;
        }
        
        a:hover {
          color: #004499;
        }
        
        /* Responsive breakpoints */
        @media (min-width: 640px) {
          .document-style {
            padding: 0 1.5rem;
          }
          
          .document-title {
            font-size: 2rem;
          }
          
          .section-title {
            font-size: 1.5rem;
          }
          
          .subsection-title {
            font-size: 1.25rem;
          }
          
          .document-list {
            padding-left: 1.25rem;
          }
          
          .document-table th,
          .document-table td {
            padding: 0.75rem;
            font-size: 0.9rem;
          }
          
          .table-header {
            padding: 0.75rem;
            font-size: 0.9rem;
          }
          
          .document-footer .flex {
            flex-direction: row;
            justify-content: space-between;
          }
          
          /* Reset table layout for larger screens */
          .document-table tbody tr {
            display: table-row;
            margin-bottom: 0;
            border: none;
            border-radius: 0;
            background: white;
          }
          
          .document-table tbody td {
            display: table-cell;
            border: 1px solid #000;
            border-bottom: 1px solid #000;
          }
          
          .document-table .table-header {
            display: table-cell;
            text-align: left;
            background-color: #f8f9fa;
          }
          
          .document-table tbody td:nth-of-type(2)::before {
            content: none;
          }
        }
        
        @media (min-width: 768px) {
          .document-style {
            padding: 0 2rem;
          }
          
          .document-table th,
          .document-table td {
            padding: 0.75rem;
            font-size: 1rem;
          }
          
          .table-header {
            padding: 0.75rem;
            font-size: 1rem;
          }
        }
        
        @media (min-width: 1024px) {
          .document-style {
            padding: 0;
          }
        }
        
        /* Text selection and touch optimization */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        p, li {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        /* Improve readability on very small screens */
        @media (max-width: 480px) {
          .document-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
          }
          
          .section-title {
            font-size: 1.125rem;
            margin-bottom: 0.5rem;
          }
          
          .document-section {
            margin-bottom: 1rem;
          }
          
          .document-list {
            padding-left: 0.75rem;
          }
          
          .document-table th,
          .document-table td {
            padding: 0.375rem;
            font-size: 0.8rem;
          }
          
          .table-header {
            padding: 0.375rem;
            font-size: 0.8rem;
          }
          
          a {
            font-size: 0.9rem;
            min-height: 40px;
          }
        }
      `}</style>
    </div>
  )
}
