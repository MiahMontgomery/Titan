import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
<<<<<<< HEAD
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[rgba(10,12,16,0.95)]">
      <Card className="w-full max-w-md mx-4 titan-box border-primary/30">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="status-indicator inactive mb-4"></div>
            <h1 className="text-2xl font-bold titan-green">404 Page Not Found</h1>
            <div className="h-0.5 w-16 bg-primary/40 my-4 rounded-full"></div>
          </div>

          <p className="text-sm text-gray-400 text-center mb-6">
            The requested resource could not be located on the Titan system.
          </p>
          
          <div className="flex justify-center">
            <Link href="/">
              <button className="inline-flex items-center justify-center px-4 py-2 border border-primary/30 
                           text-primary hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_10px_rgba(1,249,198,0.3)]
                           rounded transition-all duration-300">
                Return to Dashboard
              </button>
            </Link>
          </div>
=======

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
        </CardContent>
      </Card>
    </div>
  );
}
