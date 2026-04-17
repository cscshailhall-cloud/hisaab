import { useState, useEffect, useMemo } from "react";
import { 
  MessageSquare, 
  Send, 
  Users, 
  History, 
  Settings as SettingsIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  FileText,
  Bot,
  User as UserIcon,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getChatbotResponse } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function WhatsApp() {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model", text: string }[]>([
    { role: "model", text: "Hello! I am your CSC AI Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    whatsapp_provider: "cloud_api",
    whatsapp_phone_id: "",
    whatsapp_token: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: invData } = await supabase.from("invoices").select("*").order('date', { ascending: false });
      const { data: custData } = await supabase.from("customers").select("*");
      if (invData) setInvoices(invData);
      if (custData) setCustomers(custData);

      // Fetch Config
      const { data: configData } = await supabase
        .from('app_configurations')
        .select('*')
        .single();
      
      if (configData) {
        setConfig(prev => ({
          ...prev,
          whatsapp_provider: configData.whatsapp_provider || "cloud_api",
          whatsapp_phone_id: configData.whatsapp_phone_id || "",
          whatsapp_token: configData.whatsapp_token || "",
        }));
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('app_configurations')
        .upsert({
          user_id: user.id,
          whatsapp_provider: config.whatsapp_provider,
          whatsapp_phone_id: config.whatsapp_phone_id,
          whatsapp_token: config.whatsapp_token,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      toast.success("WhatsApp configuration saved");
    } catch (error: any) {
      toast.error("Failed to save", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const stats = useMemo(() => {
    return {
      sent: 1284, // These stats would ideally come from a whatsapp_logs table
      delivered: "98.2%",
      read: "72.5%",
    };
  }, []);

  const templates = [
    { id: "t1", name: "Bill Generated", content: "Hello {{name}}, your bill for {{service}} is generated. Amount: ₹{{amount}}. View here: {{link}}" },
    { id: "t2", name: "Payment Received", content: "Thank you {{name}}! We have received your payment of ₹{{amount}} for {{service}}." },
    { id: "t3", name: "Due Reminder", content: "Dear {{name}}, a payment of ₹{{amount}} is pending for your {{service}}. Please pay by {{date}}." },
  ];

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      // Provide dynamic system context to the chatbot
      const pendingInvoices = invoices.filter(i => i.status === 'Pending').slice(0, 5);
      const systemContext = `
        Current System State:
        - Recent Pending Invoices:
          ${pendingInvoices.map(i => `- ${i.customer_name}: ${i.invoice_no} for ₹${i.amount} (Date: ${new Date(i.date).toLocaleDateString()})`).join('\n          ')}
        - Total Customers: ${customers.length}
      `;

      // Format history for Gemini
      const history = chatMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const response = await getChatbotResponse(`${systemContext}\n\nUser Message: ${userMsg}`, history);
      
      // Handle AI Actions
      if (response.includes("[ACTION:SEND_INVOICE:")) {
        const invId = response.match(/\[ACTION:SEND_INVOICE:(.*?)\]/)?.[1];
        setChatMessages(prev => [...prev, { role: "model", text: response.replace(/\[ACTION:SEND_INVOICE:.*?\]/, "") }]);
        
        // Simulate sending invoice
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            role: "model", 
            text: `📄 Invoice ${invId} has been sent to the customer's WhatsApp successfully.` 
          }]);
          toast.success(`Invoice ${invId} sent!`);
        }, 1000);
      } else {
        setChatMessages(prev => [...prev, { role: "model", text: response }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration</h1>
          <p className="text-gray-500">Automate billing updates and marketing campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-700 border-none px-3 py-1">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            API Connected
          </Badge>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Messages Sent Today</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{invoices.filter(i => new Date(i.date).toDateString() === new Date().toDateString()).length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Delivered</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Auto-Responses</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">24</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="bg-white p-1 border border-gray-100 h-12">
          <TabsTrigger value="campaigns" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <History className="w-4 h-4 mr-2" />
            Sent History
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Bot className="w-4 h-4 mr-2" />
            AI Chatbot
          </TabsTrigger>
          <TabsTrigger value="templates" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <SettingsIcon className="w-4 h-4 mr-2" />
            API Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {invoices.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                 <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                   <MessageSquare className="w-8 h-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">No sent messages found</h3>
                 <p className="text-gray-500">Messages sent via billing will appear here.</p>
               </div>
            ) : (
              invoices.map((invoice) => (
                <Card key={invoice.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Bill sent to {invoice.customer_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                              BILL_NOTIFICATION
                            </Badge>
                            <span className="text-xs text-gray-500">{new Date(invoice.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 md:gap-12">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Status</p>
                          <Badge className="bg-green-100 text-green-700 border-none">Delivered</Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Amount</p>
                          <p className="text-sm font-bold text-gray-900">₹{invoice.amount}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon">
                          <History className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="chatbot">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-none shadow-sm h-[600px] flex flex-col">
                <CardHeader className="border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">AI Chatbot Simulator</CardTitle>
                        <CardDescription className="text-xs">Test how the AI replies to customers</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setChatMessages([{ role: "model", text: "Hello! I am your CSC AI Assistant. How can I help you today?" }])}>
                      Clear Chat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-3 max-w-[80%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", msg.role === 'user' ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600")}>
                        {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn("p-3 rounded-2xl text-sm leading-relaxed", msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-50 text-gray-800 rounded-tl-none")}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <div className="p-4 border-t border-gray-50">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex gap-2"
                  >
                    <Input 
                      placeholder="Type a message to test the AI..." 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isTyping}
                    />
                    <Button type="submit" disabled={isTyping || !input.trim()}>
                      {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Chatbot Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Auto-Reply</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Human Handover</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="pt-4 border-t border-gray-50">
                    <Label className="text-xs text-gray-400 uppercase tracking-wider">Active Model</Label>
                    <p className="text-sm font-bold text-gray-900 mt-1">Gemini 3 Flash</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-blue-600 text-white">
                <CardContent className="p-6">
                  <h4 className="font-bold mb-2">AI Training</h4>
                  <p className="text-sm text-blue-100 leading-relaxed mb-4">
                    The AI is trained on your service list and business profile. It will automatically detect service inquiries and provide accurate information.
                  </p>
                  <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50">
                    Update Knowledge Base
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="border-none shadow-sm flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
                    {template.content}
                  </div>
                </CardContent>
                <div className="p-4 border-t border-gray-50 flex justify-end gap-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-blue-600">Use</Button>
                </div>
              </Card>
            ))}
            <button className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all group">
              <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Create New Template</span>
            </button>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="border-none shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Configure your WhatsApp Cloud API or Twilio credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>WhatsApp Provider</Label>
                <Select 
                  value={config.whatsapp_provider} 
                  onValueChange={(val) => setConfig({...config, whatsapp_provider: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloud_api">WhatsApp Cloud API (Official)</SelectItem>
                    <SelectItem value="twilio">Twilio WhatsApp API</SelectItem>
                    <SelectItem value="gupshup">Gupshup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input 
                  value={config.whatsapp_phone_id} 
                  onChange={(e) => setConfig({...config, whatsapp_phone_id: e.target.value})}
                  placeholder="Enter Phone Number ID" 
                />
              </div>
              <div className="space-y-2">
                <Label>Permanent Access Token</Label>
                <Input 
                  type="password" 
                  value={config.whatsapp_token} 
                  onChange={(e) => setConfig({...config, whatsapp_token: e.target.value})}
                  placeholder="Enter Access Token" 
                />
              </div>
              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertCircle className="w-4 h-4" />
                  Ensure your webhook is configured in Meta Dashboard.
                </div>
                <Button className="bg-blue-600" onClick={handleSaveConfig} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
