import React from "react";
import { Header } from "@/components/ui/header";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  BarChart3, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle,
  Zap
} from "lucide-react";

export default function Billing() {
  // Placeholder data - in a real app, this would come from an API
  const currentPlan = {
    name: "Pro Plan",
    price: "$49",
    period: "month",
    status: "active",
    nextBilling: "July 15, 2023",
    features: [
      "Unlimited agents",
      "Advanced web automation",
      "Turbo API key support",
      "24/7 support",
    ]
  };
  
  const usage = {
    apiCalls: {
      current: 3827,
      limit: 10000,
      percentage: 38.27
    },
    automationTasks: {
      current: 42,
      limit: 100,
      percentage: 42
    },
    storage: {
      current: 2.7,
      limit: 10,
      percentage: 27
    }
  };
  
  const invoices = [
    { id: "INV-001", date: "Jun 1, 2023", amount: "$49.00", status: "Paid" },
    { id: "INV-002", date: "May 1, 2023", amount: "$49.00", status: "Paid" },
    { id: "INV-003", date: "Apr 1, 2023", amount: "$49.00", status: "Paid" }
  ];
  
  const paymentMethods = [
    { 
      id: 1, 
      type: "Credit Card", 
      last4: "4242", 
      expiry: "12/24", 
      isDefault: true 
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Billing" />
      
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-background">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="mt-1 text-muted-foreground">Manage your subscription, billing information, and usage</p>
        </div>
        
        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscription">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Current Plan */}
              <Card>
                <CardHeader className="px-6 py-4 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-foreground">Current Plan</h2>
                    <Badge variant="outline" className="bg-green-500 bg-opacity-10 text-green-400">
                      {currentPlan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-foreground">{currentPlan.price}</span>
                    <span className="text-muted-foreground ml-1">/{currentPlan.period}</span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-foreground mb-3">{currentPlan.name}</h3>
                  
                  <div className="text-sm text-muted-foreground mb-4">
                    Next billing on {currentPlan.nextBilling}
                  </div>
                  
                  <div className="space-y-2">
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-4 bg-card border-t border-border flex justify-between">
                  <Button variant="outline">Cancel Subscription</Button>
                  <Button>Upgrade Plan</Button>
                </CardFooter>
              </Card>
              
              {/* Available Plans */}
              <Card>
                <CardHeader className="px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-medium text-foreground">Available Plans</h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Basic Plan */}
                    <div className={`p-4 rounded-md border ${currentPlan.name === "Basic Plan" ? "border-primary" : "border-border"}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Basic Plan</h3>
                        <div className="text-right">
                          <div className="font-bold">$19</div>
                          <div className="text-xs text-muted-foreground">per month</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        For individuals and small projects
                      </div>
                      <Button 
                        variant={currentPlan.name === "Basic Plan" ? "default" : "outline"} 
                        className="w-full"
                        disabled={currentPlan.name === "Basic Plan"}
                      >
                        {currentPlan.name === "Basic Plan" ? "Current Plan" : "Switch to Basic"}
                      </Button>
                    </div>
                    
                    {/* Pro Plan */}
                    <div className={`p-4 rounded-md border ${currentPlan.name === "Pro Plan" ? "border-primary" : "border-border"}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <h3 className="font-medium">Pro Plan</h3>
                          <Badge className="ml-2 bg-primary text-primary-foreground">Popular</Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$49</div>
                          <div className="text-xs text-muted-foreground">per month</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        For professionals and growing teams
                      </div>
                      <Button 
                        variant={currentPlan.name === "Pro Plan" ? "default" : "outline"} 
                        className="w-full"
                        disabled={currentPlan.name === "Pro Plan"}
                      >
                        {currentPlan.name === "Pro Plan" ? "Current Plan" : "Switch to Pro"}
                      </Button>
                    </div>
                    
                    {/* Enterprise Plan */}
                    <div className={`p-4 rounded-md border ${currentPlan.name === "Enterprise Plan" ? "border-primary" : "border-border"}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <h3 className="font-medium">Enterprise Plan</h3>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$199</div>
                          <div className="text-xs text-muted-foreground">per month</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        For large teams and organizations
                      </div>
                      <Button 
                        variant={currentPlan.name === "Enterprise Plan" ? "default" : "outline"} 
                        className="w-full"
                        disabled={currentPlan.name === "Enterprise Plan"}
                      >
                        {currentPlan.name === "Enterprise Plan" ? "Current Plan" : "Switch to Enterprise"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="usage">
            <Card>
              <CardHeader className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-medium text-foreground">Resource Usage</h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* API Calls Usage */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <BarChart3 className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">API Calls</h3>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {usage.apiCalls.current.toLocaleString()} / {usage.apiCalls.limit.toLocaleString()}
                      </div>
                    </div>
                    <Progress value={usage.apiCalls.percentage} className="h-2" />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{usage.apiCalls.percentage}% used</span>
                      <span>Resets in 15 days</span>
                    </div>
                  </div>
                  
                  {/* Automation Tasks Usage */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                        <h3 className="font-medium">Automation Tasks</h3>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {usage.automationTasks.current} / {usage.automationTasks.limit}
                      </div>
                    </div>
                    <Progress value={usage.automationTasks.percentage} className="h-2" />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{usage.automationTasks.percentage}% used</span>
                      <span>Resets in 15 days</span>
                    </div>
                  </div>
                  
                  {/* Storage Usage */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
                        <h3 className="font-medium">Storage</h3>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {usage.storage.current} GB / {usage.storage.limit} GB
                      </div>
                    </div>
                    <Progress value={usage.storage.percentage} className="h-2" />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{usage.storage.percentage}% used</span>
                      <span>Unlimited time</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="text-base font-medium mb-4">Usage History</h3>
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Detailed usage history coming soon</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-6 py-4 bg-card border-t border-border">
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Usage Report
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card>
              <CardHeader className="px-6 py-4 border-b border-border">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-foreground">Payment Methods</h2>
                  <Button size="sm">Add Payment Method</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="mb-4">No payment methods found</p>
                    <Button>Add Payment Method</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 bg-secondary rounded-md">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-background rounded-md flex items-center justify-center mr-4">
                            <CreditCard className="h-5 w-5 text-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{method.type} •••• {method.last4}</div>
                            <div className="text-sm text-muted-foreground">Expires {method.expiry}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {method.isDefault && (
                            <Badge variant="outline" className="mr-2">Default</Badge>
                          )}
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoices">
            <Card>
              <CardHeader className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-medium text-foreground">Billing History</h2>
              </CardHeader>
              <CardContent className="p-6">
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No invoices found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-border">
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Invoice</th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Amount</th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice, index) => (
                          <tr key={invoice.id} className={index !== invoices.length - 1 ? "border-b border-border" : ""}>
                            <td className="px-4 py-3 text-sm">{invoice.id}</td>
                            <td className="px-4 py-3 text-sm">{invoice.date}</td>
                            <td className="px-4 py-3 text-sm">{invoice.amount}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="outline" className="bg-green-500 bg-opacity-10 text-green-400">
                                {invoice.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="px-6 py-4 bg-card border-t border-border">
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download All Invoices
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
