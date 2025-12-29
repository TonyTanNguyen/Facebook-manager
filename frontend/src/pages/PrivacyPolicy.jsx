import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Trash2, Mail, Database, Lock } from 'lucide-react';

const PrivacyPolicy = () => {
  const appName = "TGM Facebook Manager";
  const contactEmail = "support@tgmresearch.com";
  const lastUpdated = "December 29, 2025";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Introduction</h2>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {appName} ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and safeguard your information 
              when you use our Facebook Page management application.
            </p>
          </section>

          {/* Data We Collect */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Information We Collect</h2>
            </div>
            <p className="text-slate-300 mb-4">When you use our application, we collect:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li><strong>Facebook Profile Information:</strong> Name, email, and profile picture</li>
              <li><strong>Facebook Page Data:</strong> Pages you manage, page access tokens</li>
              <li><strong>Page Interactions:</strong> Comments and messages from your managed pages</li>
              <li><strong>Usage Data:</strong> How you interact with our application</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">How We Use Your Information</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>To provide and maintain our service</li>
              <li>To allow you to manage your Facebook Pages</li>
              <li>To display comments and messages from your pages</li>
              <li>To enable you to respond to comments and messages</li>
              <li>To improve our application and user experience</li>
            </ul>
          </section>

          {/* Data Storage */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Data Storage & Security</h2>
            <p className="text-slate-300 leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use secure 
              databases and implement appropriate security measures to protect against unauthorized 
              access, alteration, or destruction of your information. Access tokens are encrypted 
              and stored securely.
            </p>
          </section>

          {/* Data Deletion */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-semibold text-white">Data Deletion</h2>
            </div>
            <p className="text-slate-300 mb-4">
              You can request deletion of your data at any time by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 mb-4">
              <li>Using the "Delete Account" option in the app settings</li>
              <li>Contacting us at <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">{contactEmail}</a></li>
              <li>Removing the app from your Facebook settings</li>
            </ul>
            <p className="text-slate-300">
              Upon deletion request, we will remove all your personal data from our servers within 30 days.
            </p>
          </section>

          {/* Third Party */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p className="text-slate-300 leading-relaxed">
              Our application integrates with Facebook's API to provide its functionality. 
              Your use of Facebook is governed by Facebook's own Privacy Policy. We do not 
              sell or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Contact Us</h2>
            </div>
            <p className="text-slate-300">
              If you have questions about this Privacy Policy or wish to exercise your data rights, 
              please contact us at:{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">
                {contactEmail}
              </a>
            </p>
          </section>

          {/* Changes */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the 
              "Last updated" date.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-400">
          <p>&copy; {new Date().getFullYear()} {appName}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
