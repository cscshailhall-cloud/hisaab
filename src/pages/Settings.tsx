import { useState } from "react";
import { 
  Building2, 
  CreditCard, 
  Globe, 
  Lock, 
  Mail, 
  Palette, 
  Bell,
  Save,
  Upload,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your business profile and preferences.</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-white p-1 border border-gray-100 h-12">
          <TabsTrigger value="business" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Building2 className="w-4 h-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="branding" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Palette className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="payments" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <FileText className="w-4 h-4 mr-2" />
            Bill Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card className="border-none shadow-sm max-w-3xl">
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>This information will appear on your invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input defaultValue="CSC Digital Center" />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input placeholder="Enter GSTIN" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue="contact@csc.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+91 9876543210" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input defaultValue="123, Main Market, Sector 15, New Delhi - 110001" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button className="bg-blue-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="border-none shadow-sm max-w-3xl">
            <CardHeader>
              <CardTitle>Branding & UI</CardTitle>
              <CardDescription>Customize the look and feel of your dashboard and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-8">
                <Avatar className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gray-50 text-gray-400">
                    <Upload className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Business Logo</h4>
                  <p className="text-sm text-gray-500 mb-3">Recommended size: 512x512px. PNG or JPG.</p>
                  <Button variant="outline" size="sm">Change Logo</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label>Primary Theme Color</Label>
                  <div className="flex gap-3">
                    {["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#141414"].map((color) => (
                      <button 
                        key={color}
                        className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-200"
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-xs text-gray-500">Enable dark theme for the dashboard.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-none shadow-sm max-w-3xl">
            <CardHeader>
              <CardTitle>Payment Gateways</CardTitle>
              <CardDescription>Configure online payment options for your customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    RP
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Razorpay</h4>
                    <p className="text-xs text-gray-500">Accept Credit/Debit cards & Netbanking.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                    PP
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">PhonePe Business</h4>
                    <p className="text-xs text-gray-500">Accept UPI payments directly.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-generate UPI QR</Label>
                    <p className="text-xs text-gray-500">Show dynamic QR code on every invoice.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing">
          <Card className="border-none shadow-sm max-w-3xl">
            <CardHeader>
              <CardTitle>Bill Customization</CardTitle>
              <CardDescription>Configure how your invoices look and what information they show.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Default Bill Type</Label>
                  <Select defaultValue="a4">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4 Standard PDF</SelectItem>
                      <SelectItem value="thermal">Thermal (2-inch)</SelectItem>
                      <SelectItem value="thermal_3">Thermal (3-inch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label>Invoice Prefix</Label>
                  <Input defaultValue="INV-" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <h4 className="font-bold text-sm">Invoice Elements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Business Logo</p>
                      <p className="text-xs text-gray-500">Display logo at the top.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Payment QR Code</p>
                      <p className="text-xs text-gray-500">Add dynamic UPI QR code.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Terms & Conditions</p>
                      <p className="text-xs text-gray-500">Include standard T&C.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Bank Details</p>
                      <p className="text-xs text-gray-500">Include account info for NEFT.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show WhatsApp Details</p>
                      <p className="text-xs text-gray-500">Add contact number on bill.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Customer ID</p>
                      <p className="text-xs text-gray-500">Include unique customer ID.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <h4 className="font-bold text-sm">Template Preview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'modern', name: 'Modern A4', img: 'https://picsum.photos/seed/bill1/200/280' },
                    { id: 'classic', name: 'Classic A4', img: 'https://picsum.photos/seed/bill2/200/280' },
                    { id: 'minimal', name: 'Minimalist', img: 'https://picsum.photos/seed/bill3/200/280' },
                  ].map((t) => (
                    <div key={t.id} className="group relative cursor-pointer">
                      <div className="aspect-[1/1.4] rounded-lg border-2 border-gray-100 overflow-hidden group-hover:border-blue-500 transition-all">
                        <img src={t.img} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button variant="secondary" size="sm">Preview</Button>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-center mt-2">{t.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-50">
                <Label>Bank Account Details</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Bank Name" defaultValue="State Bank of India" />
                  <Input placeholder="Account Number" defaultValue="123456789012" />
                  <Input placeholder="IFSC Code" defaultValue="SBIN0001234" />
                  <Input placeholder="Account Holder" defaultValue="CSC Digital Center" />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-50">
                <Label>Terms & Conditions</Label>
                <Input defaultValue="1. Goods once sold will not be taken back. 2. Subject to New Delhi jurisdiction." />
              </div>

              <div className="pt-4 flex justify-end">
                <Button className="bg-blue-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save Bill Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
