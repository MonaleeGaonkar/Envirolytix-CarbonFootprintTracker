import React from 'react';
import { TwitterIcon, InstagramIcon, LinkedInIcon } from './ui/Icons';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12 py-8 border-t border-slate-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 dark:text-slate-400">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="#" aria-label="Twitter" className="hover:text-emerald-500 transition-colors">
            <TwitterIcon className="h-6 w-6" />
          </a>
          <a href="#" aria-label="Instagram" className="hover:text-emerald-500 transition-colors">
            <InstagramIcon className="h-6 w-6" />
          </a>
          <a href="#" aria-label="LinkedIn" className="hover:text-emerald-500 transition-colors">
            <LinkedInIcon className="h-6 w-6" />
          </a>
        </div>
        <p className="text-sm mb-2">
          Contact us: <a href="mailto:contact@enviro-lytix.com" className="hover:text-emerald-500 transition-colors">contact@enviro-lytix.com</a>
        </p>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Enviro-Lytix. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
