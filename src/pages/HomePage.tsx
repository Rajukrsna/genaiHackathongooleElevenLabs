import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-20">
          <Badge className="mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Enterprise-Grade AI Platform
          </Badge>
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Business with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI Innovation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of enterprise software with our comprehensive AI platform.
            Secure authentication, powerful APIs, and seamless integration for modern businesses.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignInButton mode="modal">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </SignUpButton>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <FeatureCard
            icon="🔐"
            title="Enterprise Security"
            description="Bank-grade authentication with Clerk, ensuring your data remains protected with JWT tokens and role-based access control."
            gradient="from-green-500 to-emerald-600"
          />
          <FeatureCard
            icon="⚡"
            title="High Performance"
            description="Built with React 18, TypeScript, and optimized APIs for lightning-fast performance and seamless user experiences."
            gradient="from-blue-500 to-cyan-600"
          />
          <FeatureCard
            icon="🔄"
            title="Real-time Sync"
            description="Advanced state management with React Query, providing instant updates and offline-first capabilities."
            gradient="from-purple-500 to-pink-600"
          />
        </div>

        {/* Stats Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 mb-20 border border-white/20">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600 font-medium">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">10ms</div>
              <div className="text-gray-600 font-medium">Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600 font-medium">Enterprises</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Support</div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            Built with cutting-edge technologies and enterprise-grade architecture
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <TechBadge>React 18</TechBadge>
            <TechBadge>TypeScript</TechBadge>
            <TechBadge>Node.js</TechBadge>
            <TechBadge>PostgreSQL</TechBadge>
            <TechBadge>AWS</TechBadge>
            <TechBadge>Docker</TechBadge>
          </div>
        </div>

        {/* Getting Started */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Start Guide</CardTitle>
            <CardDescription>Get up and running in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">For Developers</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Clone the repository</li>
                  <li>Install dependencies with npm</li>
                  <li>Configure environment variables</li>
                  <li>Start development server</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">For Enterprises</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Contact our sales team</li>
                  <li>Schedule a demo</li>
                  <li>Custom deployment options</li>
                  <li>24/7 enterprise support</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: { icon: string; title: string; description: string; gradient: string }) {
  return (
    <Card className="group hover:scale-105 transition-transform duration-300">
      <CardContent className="text-center pt-6">
        <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto shadow-lg`}>
          {icon}
        </div>
        <CardTitle className="mb-4">{title}</CardTitle>
        <CardDescription className="leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="outline" className="px-6 py-3 text-sm font-semibold">
      {children}
    </Badge>
  );
}
