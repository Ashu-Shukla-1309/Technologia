import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white text-gray-600 py-16 border-t border-gray-200 font-sans mt-auto">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          {/* Tech Resources Column */}
          <div>
            <h3 className="text-gray-900 font-black mb-6 uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li className="hover:text-blue-600 cursor-pointer transition">Firmware & Drivers</li>
              <li className="hover:text-blue-600 cursor-pointer transition">User Manuals</li>
              <li className="hover:text-blue-600 cursor-pointer transition">Developer API</li>
              <li className="hover:text-blue-600 cursor-pointer transition">Gadget Care Guides</li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-gray-900 font-black mb-6 uppercase tracking-wider">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-blue-600 transition">About Technologia</Link></li>
              <li><Link to="/profile" className="hover:text-blue-600 transition">Careers</Link></li>
              <li className="hover:text-blue-600 cursor-pointer transition">Sustainability</li>
              <li><Link to="/" className="hover:text-blue-600 transition">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-gray-900 font-black mb-6 uppercase tracking-wider">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/orders" className="hover:text-blue-600 transition">Track Order</Link></li>
              <li className="hover:text-blue-600 cursor-pointer transition">Warranty Claim</li>
              <li className="hover:text-blue-600 cursor-pointer transition">Return Center</li>
              <li><Link to="/profile" className="hover:text-blue-600 transition">Contact Expert</Link></li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="text-gray-900 font-black mb-6 uppercase tracking-wider">Social</h3>
            <div className="flex gap-4">
              <a 
                href="https://www.linkedin.com/in/ashutoshshukla1309/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-100 p-3 rounded-full hover:bg-blue-600 hover:text-white text-gray-600 transition-all shadow-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a 
                href="https://github.com/Ashu-Shukla-1309" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-100 p-3 rounded-full hover:bg-gray-900 hover:text-white text-gray-600 transition-all shadow-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-xs text-gray-400">
          <p>© 2026 Technologia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;