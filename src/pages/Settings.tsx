import { useState, useEffect, useMemo } from "react";
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
  FileText,
  CheckCircle2,
  Loader2,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { 
  ModernTemplate, 
  ClassicTemplate, 
  MinimalTemplate, 
  InvoiceData 
} from "@/components/InvoiceTemplates";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";

const MOCK_INVOICE: InvoiceData = {
  invoice_no: "INV-2026-001",
  date: new Date().toISOString(),
  customer_name: "John Doe",
  customer_phone: "+91 98765 43210",
  customer_address: "123, Rose Villa, MG Road, Pune",
  items: [
    { id: "1", name: "Professional Web Design", price: 12500, quantity: 1, tax: 18 },
    { id: "2", name: "Mobile App Consulting", price: 4500, quantity: 2, tax: 18 },
  ],
  subtotal: 21500,
  tax_amount: 3870,
  discount: 500,
  total: 24870,
  status: "Paid",
  business_name: "CSC Digital Center",
  business_address: "123, Main Market, New Delhi",
  business_phone: "+91 11 2233 4455",
  business_gst: "07AAAAA0000A1Z5"
};

export default function Settings() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Business State
  const [businessName, setBusinessName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Config State
  const [config, setConfig] = useState<any>({
    razorpay_key_id: "",
    razorpay_key_secret: "",
    phonepe_merchant_id: "",
    phonepe_salt_key: "",
    upi_id: "",
    invoice_prefix: "INV-",
    bill_type: "a4",
    invoice_template: "modern",
    whatsapp_provider: "cloud_api",
    whatsapp_phone_id: "",
    whatsapp_token: ""
  });

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.shop_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchConfig = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_configurations')
        .select('*')
        .eq('user_id', user.uid)
        .single();
      
      if (data) {
        setConfig(prev => ({
          ...prev,
          ...data,
          invoice_template: data.invoice_template || "modern"
        }));
        if (data.gst_number) setGstNumber(data.gst_number);
      }
      setIsLoading(false);
    };
    fetchConfig();
  }, [user]);

  const handleSaveBusiness = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          shop_name: businessName,
          phone: phone,
          address: address,
        })
        .eq('id', user.uid);
      
      if (profileError) throw profileError;

      const { error: configError } = await supabase
        .from('app_configurations')
        .upsert({
          user_id: user.uid,
          gst_number: gstNumber,
        }, { onConflict: 'user_id' });
      
      if (configError) throw configError;

      toast.success("Business profile saved");
    } catch (error: any) {
      toast.error("Failed to save", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async (updates: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Create a clean config object ensuring we don't send anything the schema isn't expecting
      const payload = {
        ...config,
        ...updates
      };
      
      delete payload.font_family; // Explicitly remove legacy props to stop crashes
      delete payload.accent_color;
      delete payload.show_logo;
      delete payload.show_qr;
      delete payload.show_bank;
      delete payload.show_tnc;

      const { error } = await supabase
        .from('app_configurations')
        .upsert({
          user_id: user.uid,
          ...payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      setConfig({ ...config, ...updates });
      toast.success("Settings updated");
    } catch (error: any) {
      toast.error("Failed to update", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const renderTemplate = (id: string, data: InvoiceData, scale: boolean = false) => {
    const props = { 
      data, 
      accentColor: "#2563eb",
      showLogo: true,
      showQR: true,
      showBank: true
    };
    
    let component;
    if (id === 'modern') component = <ModernTemplate {...props} />;
    else if (id === 'classic') component = <ClassicTemplate {...props} />;
    else if (id === 'minimal') component = <MinimalTemplate {...props} />;
    else component = <ModernTemplate {...props} />;

    if (scale) {
      return (
        <div className="w-full aspect-[1/1.4] relative overflow-hidden bg-gray-50 border rounded-lg group-hover:border-blue-300 transition-colors">
          <div className="absolute inset-0 origin-top-left scale-[0.35] w-[285%] h-[285%] pointer-events-none">
            {component}
          </div>
        </div>
      );
    }
    return component;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="Enter GSTIN" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={email} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button className="bg-blue-600" onClick={handleSaveBusiness} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
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
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        RP
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Razorpay</h4>
                        <p className="text-xs text-gray-500">Accept Credit/Debit cards & Netbanking.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Key ID</Label>
                      <Input 
                        value={config.razorpay_key_id} 
                        onChange={(e) => setConfig({...config, razorpay_key_id: e.target.value})}
                        placeholder="rzp_test_..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Key Secret</Label>
                      <Input 
                        type="password"
                        value={config.razorpay_key_secret} 
                        onChange={(e) => setConfig({...config, razorpay_key_secret: e.target.value})}
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                        PP
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">PhonePe Business</h4>
                        <p className="text-xs text-gray-500">Accept UPI payments directly.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Merchant ID</Label>
                      <Input 
                        value={config.phonepe_merchant_id} 
                        onChange={(e) => setConfig({...config, phonepe_merchant_id: e.target.value})}
                        placeholder="MID123..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Salt Key</Label>
                      <Input 
                        type="password"
                        value={config.phonepe_salt_key} 
                        onChange={(e) => setConfig({...config, phonepe_salt_key: e.target.value})}
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100">
                  <div className="space-y-2">
                    <Label>Business UPI ID (for QR codes)</Label>
                    <Input 
                      value={config.upi_id} 
                      onChange={(e) => setConfig({...config, upi_id: e.target.value})}
                      placeholder="business@oksbi" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button className="bg-blue-600" onClick={() => handleSaveConfig({})} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Payment Settings
                </Button>
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
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
                <div className="space-y-4">
                  <Label>Default Bill Type</Label>
                  <Select value={config.bill_type} onValueChange={(val) => handleSaveConfig({ bill_type: val })}>
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
                  <Input 
                    value={config.invoice_prefix} 
                    onChange={(e) => setConfig({...config, invoice_prefix: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm">Select Default A4 Template</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { id: 'modern', name: 'Modern Blue', desc: 'Bold, professional, clean headers.' },
                    { id: 'classic', name: 'Classic Professional', desc: 'Traditional serif layout, structured.' },
                    { id: 'minimal', name: 'Minimalist', desc: 'Very clean, focus on content.' }
                  ].map((t) => (
                    <div 
                      key={t.id} 
                      className={cn(
                        "group relative cursor-pointer flex flex-col gap-2",
                        config.invoice_template === t.id && "text-blue-600"
                      )}
                      onClick={() => handleSaveConfig({ invoice_template: t.id })}
                    >
                      {renderTemplate(t.id, MOCK_INVOICE, true)}
                      <div className="flex justify-between items-center px-1 pt-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold">{t.name}</p>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{t.desc}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant={config.invoice_template === t.id ? "default" : "outline"}
                          className={cn("h-7 text-[10px]", config.invoice_template === t.id ? "bg-blue-600" : "")}
                          onClick={() => handleSaveConfig({ invoice_template: t.id })}
                        >
                          {config.invoice_template === t.id ? 'Default' : 'Select'}
                        </Button>
                      </div>
                      <Dialog>
                        <DialogTrigger className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                          <Eye className="w-4 h-4" />
                        </DialogTrigger>
                        <DialogContent className="max-w-[800px] h-[90vh] overflow-y-auto p-0">
                          {renderTemplate(t.id, MOCK_INVOICE)}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button className="bg-blue-600" onClick={() => handleSaveConfig({})} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save All Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
