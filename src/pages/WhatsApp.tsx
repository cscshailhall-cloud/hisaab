import { useState } from "react";
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

const mockCampaigns = [
  { id: "1", name: "Festival Greetings", type: "Broadcast", sent: 120, delivered: 115, read: 80, status: "Completed", date: "2024-03-10" },
  { id: "2", name: "New Service Launch", type: "Broadcast", sent: 450, delivered: 440, read: 310, status: "Completed", date: "2024-03-05" },
  { id: "3", name: "Payment Reminders", type: "Automation", sent: 15, delivered: 15, read: 12, status: "Active", date: "Ongoing" },
];

const templates = [
  { id: "t1", name: "Bill Generated", content: "Hello {{name}}, your bill for {{service}} is generated. Amount: ₹{{amount}}. View here: {{link}}" },
  { id: "t2", name: "Payment Received", content: "Thank you {{name}}! We have received your payment of ₹{{amount}} for {{service}}." },
  { id: "t3", name: "Due Reminder", content: "Dear {{name}}, a payment of ₹{{amount}} is pending for your {{service}}. Please pay by {{date}}." },
];

export default function WhatsApp() {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model", text: string }[]>([
    { role: "model", text: "Hello! I am your CSC AI Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      // Provide system context to the chatbot
      const systemContext = `
        Current System State:
        - Customer: Rahul Sharma (9876543210) has 1 pending invoice: INV-2024-002 for ₹1500.
        - Customer: Amit Kumar (9876543212) has all bills paid.
        - Recent Invoices: INV-2024-001 (Paid), INV-2024-002 (Pending), INV-2024-003 (Paid).
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
                <p className="text-sm text-gray-500 font-medium">Messages Sent</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">1,284</h3>
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
                <p className="text-sm text-gray-500 font-medium">Delivery Rate</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">98.2%</h3>
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
                <p className="text-sm text-gray-500 font-medium">Read Rate</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">72.5%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="bg-white p-1 border border-gray-100 h-12">
          <TabsTrigger value="campaigns" className="px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <History className="w-4 h-4 mr-2" />
            Campaigns
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
            {mockCampaigns.map((campaign) => (
              <Card key={campaign.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{campaign.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                            {campaign.type}
                          </Badge>
                          <span className="text-xs text-gray-500">{campaign.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 md:gap-12">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Sent</p>
                        <p className="text-lg font-bold text-gray-900">{campaign.sent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Delivered</p>
                        <p className="text-lg font-bold text-green-600">{campaign.delivered}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Read</p>
                        <p className="text-lg font-bold text-blue-600">{campaign.read}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={campaign.status === 'Active' ? "bg-blue-50 text-blue-700 border-none" : "bg-green-50 text-green-700 border-none"}>
                        {campaign.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <History className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <Select defaultValue="cloud_api">
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
                <Input placeholder="Enter Phone Number ID" />
              </div>
              <div className="space-y-2">
                <Label>Permanent Access Token</Label>
                <Input type="password" placeholder="Enter Access Token" />
              </div>
              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertCircle className="w-4 h-4" />
                  Ensure your webhook is configured in Meta Dashboard.
                </div>
                <Button className="bg-blue-600">Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
