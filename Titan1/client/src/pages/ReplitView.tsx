import { useState, useEffect } from 'react';
import { ReplitStyleWebview } from '@/components/ReplitStyleWebview';

export default function ReplitView() {
  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-semibold text-white">Titan Replit-Style Live View</h1>
        <p className="text-gray-400 text-sm mt-1">Watch AI reasoning and code generation in real-time</p>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ReplitStyleWebview />
      </div>
    </div>
  );
}