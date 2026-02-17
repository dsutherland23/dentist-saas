"use client"

/**
 * DENTAL CHART DEMO PAGE
 * 
 * This page demonstrates the ProductionDentalChart component
 * with usage examples and documentation.
 */

import React from 'react'
import { ProductionDentalChart } from '@/components/dental-chart-v2/ProductionDentalChart'

export default function DentalChartDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Production-Ready Dental Chart Component
          </h1>
          <p className="text-slate-600">
            A fully responsive, accessible, and feature-rich React component for dental professionals.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon="👥"
            title="Adult & Pediatric"
            description="Supports both 32 adult and 20 pediatric teeth"
          />
          <FeatureCard
            icon="🔢"
            title="Dual Numbering"
            description="FDI and Universal numbering systems"
          />
          <FeatureCard
            icon="📱"
            title="Fully Responsive"
            description="Works seamlessly on all devices"
          />
          <FeatureCard
            icon="♿"
            title="Accessible"
            description="ARIA labels and keyboard navigation"
          />
          <FeatureCard
            icon="🎯"
            title="Multi-Select"
            description="Ctrl/Cmd+Click for multiple teeth"
          />
          <FeatureCard
            icon="🔍"
            title="Zoom & Pan"
            description="Interactive zoom controls and drag to pan"
          />
          <FeatureCard
            icon="💾"
            title="Export Data"
            description="Export selections to JSON or CSV"
          />
          <FeatureCard
            icon="✨"
            title="Smooth Animations"
            description="Beautiful transitions and interactions"
          />
        </div>

        {/* Live Demo */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Live Demo</h2>
            <p className="text-blue-100 text-sm mt-1">
              Try all features below - click teeth, toggle views, zoom, and export!
            </p>
          </div>
          
          <div className="h-[600px] sm:h-[700px]">
            <ProductionDentalChart />
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quick Start */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Start</h3>
            <div className="space-y-3">
              <Step number="1" title="Import the component">
                <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                  {'import { ProductionDentalChart } from "@/components/dental-chart-v2/ProductionDentalChart"'}
                </code>
              </Step>
              
              <Step number="2" title="Add to your page">
                <code className="text-sm bg-slate-100 px-2 py-1 rounded block">
                  {'<ProductionDentalChart />'}
                </code>
              </Step>
              
              <Step number="3" title="That's it!">
                <p className="text-sm text-slate-600">
                  The component is fully self-contained with all features built-in.
                </p>
              </Step>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              <Shortcut keys="Click" description="Select single tooth" />
              <Shortcut keys="Ctrl/Cmd + Click" description="Multi-select teeth" />
              <Shortcut keys="Tab" description="Navigate between teeth" />
              <Shortcut keys="Enter / Space" description="Select focused tooth" />
              <Shortcut keys="Escape" description="Clear all selections" />
              <Shortcut keys="Drag" description="Pan the dental chart" />
            </div>
          </div>
        </div>

        {/* Export Data Examples */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Export Data Format</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* JSON Example */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">JSON Output</h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "timestamp": "2026-02-17T14:30:00.000Z",
  "toothType": "adult",
  "numberingSystem": "FDI",
  "selectedTeeth": [
    {
      "id": "11",
      "fdi": "11",
      "universal": "8",
      "label": "UR Central Incisor",
      "type": "adult"
    },
    {
      "id": "21",
      "fdi": "21",
      "universal": "9",
      "label": "UL Central Incisor",
      "type": "adult"
    }
  ],
  "totalSelected": 2
}`}
              </pre>
            </div>

            {/* CSV Example */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">CSV Output</h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`FDI Number,Universal Number,Label,Type
11,8,UR Central Incisor,adult
21,9,UL Central Incisor,adult
16,3,UR 1st Molar,adult
26,14,UL 1st Molar,adult`}
              </pre>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Technical Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Technologies</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• React 18+ with TypeScript</li>
                <li>• SVG for scalable graphics</li>
                <li>• Tailwind CSS for styling</li>
                <li>• React Hooks for state management</li>
                <li>• ARIA compliant for accessibility</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Performance</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Optimized SVG rendering</li>
                <li>• Memoized computations</li>
                <li>• Smooth 60fps animations</li>
                <li>• Efficient event handling</li>
                <li>• Minimal re-renders</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm py-6">
          <p>Built with ❤️ for dental professionals</p>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-slate-900 text-sm mb-1">{title}</h4>
        {children}
      </div>
    </div>
  )
}

function Shortcut({ keys, description }: { keys: string; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <kbd className="px-2 py-1 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded">
        {keys}
      </kbd>
      <span className="text-sm text-slate-600">{description}</span>
    </div>
  )
}
