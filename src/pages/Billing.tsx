import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Receipt, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Printer,
  Share2,
  CheckCircle2,
  X,
  FileDown,
  Image as ImageIcon,
  QrCode,
  AlertCircle,
  Eye,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  ModernTemplate, 
  ClassicTemplate, 
  MinimalTemplate, 
  InvoiceData 
} from "@/components/InvoiceTemplates";
import { useAuth } from "@/context/AuthContext";

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  mobile: string;
}

interface SelectedService {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tax: number;
}

export default function Billing() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [tempSelectedServices, setTempSelectedServices] = useState<string[]>([]);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState("");
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "" });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (!error) setCustomers(data as any[]);
    };
    const fetchServices = async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (!error) setServices(data as any[]);
    };
    const fetchConfig = async () => {
      const { data } = await supabase.from('app_configurations').select('*').maybeSingle();
      if (data) setConfig(data);
    };

    fetchCustomers();
    fetchServices();
    fetchConfig();

    const customerChannel = supabase.channel('customers_billing').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchCustomers).subscribe();
    const serviceChannel = supabase.channel('services_billing').on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, fetchServices).subscribe();

    return () => {
      supabase.removeChannel(customerChannel);
      supabase.removeChannel(serviceChannel);
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.mobile.includes(customerSearch)
    );
  }, [customerSearch, customers]);

  const filteredServices = useMemo(() => {
    return services.filter(s => 
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || 
      s.category.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [serviceSearch, services]);

  const subtotal = useMemo(() => {
    return selectedServices.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  }, [selectedServices]);

  const taxAmount = useMemo(() => {
    return selectedServices.reduce((acc, curr) => acc + (curr.price * curr.quantity * (curr.tax / 100)), 0);
  }, [selectedServices]);

  const total = subtotal + taxAmount - discount;

  const addService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const existing = selectedServices.find(s => s.id === serviceId);
    if (existing) {
      setSelectedServices(selectedServices.map(s => 
        s.id === serviceId ? { ...s, quantity: s.quantity + 1 } : s
      ));
    } else {
      setSelectedServices([...selectedServices, {
        id: service.id,
        name: service.name,
        price: service.price,
        quantity: 1,
        tax: 18 // Default GST
      }]);
    }
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedServices(selectedServices.map(s => 
      s.id === serviceId ? { ...s, quantity } : s
    ));
  };

  const handleAddQuickCustomer = async () => {
    if (!newCustomer.name || !newCustomer.mobile) {
      toast.error("Please fill name and mobile");
      return;
    }

    setIsAddingCustomer(true);
    const { data, error } = await supabase
      .from("customers")
      .insert([newCustomer])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add customer");
    } else {
      toast.success("Customer added successfully");
      setCustomers([...customers, data]);
      setSelectedCustomer(data.id);
      setShowAddCustomerDialog(false);
      setNewCustomer({ name: "", mobile: "" });
    }
    setIsAddingCustomer(false);
  };

  const handleGenerateBill = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert([{
          customer_id: selectedCustomer,
          total_amount: total,
          payment_method: paymentMethod,
          status: paymentMethod === 'not_paid' ? 'Pending' : 'Paid',
          items: selectedServices,
          discount: discount
        }])
        .select()
        .single();

      if (error) throw error;
      
      setGeneratedInvoiceId(invoice.id);
      setShowBillDialog(true);
      toast.success("Bill generated successfully!");
    } catch (error: any) {
      toast.error("Failed to generate bill", { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${generatedInvoiceId.slice(-6)}.pdf`);
      toast.success("PDF Downloaded");
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const renderInvoicePreview = () => {
    if (!selectedCustomer || !config) return null;
    const customer = customers.find(c => c.id === selectedCustomer);
    
    const invoiceData: InvoiceData = {
      invoice_no: generatedInvoiceId ? `${config.invoice_prefix || 'INV-'}${generatedInvoiceId.slice(-6).toUpperCase()}` : "PREVIEW",
      date: new Date().toISOString(),
      customer_name: customer?.name || "Customer",
      customer_phone: customer?.mobile,
      items: selectedServices,
      subtotal,
      tax_amount: taxAmount,
      discount,
      total,
      status: paymentMethod === 'not_paid' ? 'Pending' : 'Paid',
      business_name: profile?.shop_name,
      business_address: profile?.address,
      business_phone: profile?.phone,
      business_gst: config?.gst_number
    };

    const props = {
      data: invoiceData,
      accentColor: config.accent_color,
      showLogo: config.show_logo,
      showQR: config.show_qr,
      showBank: config.show_bank
    };

    if (config.invoice_template === 'classic') return <div id="invoice-preview"><ClassicTemplate {...props} /></div>;
    if (config.invoice_template === 'minimal') return <div id="invoice-preview"><MinimalTemplate {...props} /></div>;
    return <div id="invoice-preview"><ModernTemplate {...props} /></div>;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-0">
      {/* Search & Billing Flow */}
      <div className="flex-1 space-y-6">
        {/* Customer & Service Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Select Customer
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setShowAddCustomerDialog(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Quick Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Name or Mobile..." 
                  className="pl-9 h-11 border-gray-100 bg-gray-50 focus:bg-white transition-colors"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {filteredCustomers.map(customer => (
                  <div 
                    key={customer.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                      selectedCustomer === customer.id 
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" 
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    )}
                    onClick={() => setSelectedCustomer(customer.id)}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.mobile}</p>
                    </div>
                    {selectedCustomer === customer.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                Add Services
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search services..." 
                  className="pl-9 h-11 border-gray-100 bg-gray-50 focus:bg-white transition-colors"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                {filteredServices.map(service => (
                  <div 
                    key={service.id}
                    className="p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-100 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{service.name}</p>
                      <p className="text-xs text-blue-600 font-medium">₹{service.price}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg"
                      onClick={() => addService(service.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Items Table */}
        <Card className="border-none shadow-sm">
          <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Selected Items</CardTitle>
            <Badge variant="outline" className="text-xs bg-gray-50">{selectedServices.length} Items</Badge>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100">
                <TableHead className="text-xs bg-gray-50/50">Service</TableHead>
                <TableHead className="text-xs bg-gray-50/50 text-right">Price</TableHead>
                <TableHead className="text-xs bg-gray-50/50 text-center">Qty</TableHead>
                <TableHead className="text-xs bg-gray-50/50 text-right">GST</TableHead>
                <TableHead className="text-xs bg-gray-50/50 text-right">Total</TableHead>
                <TableHead className="text-xs bg-gray-50/50 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedServices.map(item => (
                <TableRow key={item.id} className="border-gray-50 transition-colors">
                  <TableCell className="font-medium text-sm py-4">{item.name}</TableCell>
                  <TableCell className="text-right text-sm">₹{item.price}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 w-7 p-0 rounded-md border-gray-100"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >-</Button>
                      <span className="text-sm font-bold min-w-[20px]">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 w-7 p-0 rounded-md border-gray-100"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >+</Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs text-gray-500">{item.tax}%</TableCell>
                  <TableCell className="text-right font-bold text-sm">₹{(item.price * item.quantity * (1 + item.tax/100)).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeService(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {selectedServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 opacity-20" />
                      <p className="text-sm">No services added yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Summary & Payment */}
      <div className="w-full lg:w-96">
        <Card className="border-none shadow-sm sticky top-6">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-lg font-bold">Billing Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Estimated Tax (GST)</span>
                <span className="font-bold">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-dashed border-gray-200">
                <Label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Discount (₹)</Label>
                <Input 
                  type="number" 
                  className="h-11 font-bold text-lg text-red-600"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="pt-6 border-t border-gray-100">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-gray-900 leading-none">Net Payable</span>
                  <span className="text-3xl font-black text-blue-600 leading-none">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
              <Label className="text-xs text-gray-400 uppercase font-bold">Payment Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote, color: 'emerald' },
                  { id: 'upi', label: 'UPI / QR', icon: Smartphone, color: 'purple' },
                  { id: 'card', label: 'Card', icon: CreditCard, color: 'blue' },
                  { id: 'not_paid', label: 'Unpaid', icon: X, color: 'gray' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all",
                      paymentMethod === mode.id 
                        ? `border-${mode.color}-600 bg-${mode.color}-50 text-${mode.color}-700 ring-1 ring-${mode.color}-600` 
                        : "border-gray-100 bg-white hover:border-gray-200 text-gray-600"
                    )}
                    onClick={() => setPaymentMethod(mode.id)}
                  >
                    <mode.icon className="w-4 h-4" />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              disabled={isGenerating || selectedServices.length === 0}
              onClick={handleGenerateBill}
            >
              {isGenerating ? "GENERATING..." : "GENERATE INVOICE"}
            </Button>
            
            <p className="text-[10px] text-center text-gray-400 leading-tight">
              By generating this bill, you agree to our terms of service and business policy.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Add Customer</DialogTitle>
            <DialogDescription>Add a new customer to the database instantly.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                placeholder="Ex. Rahul Kumar" 
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input 
                placeholder="Ex. 9876543210" 
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomerDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddQuickCustomer} disabled={isAddingCustomer}>
              {isAddingCustomer ? "Adding..." : "Add Content"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden flex flex-col md:flex-row h-[90vh]">
          {/* Left Side: Real Preview */}
          <div className="flex-1 bg-gray-100 overflow-y-auto p-8 border-r">
            <div className="max-w-[800px] mx-auto shadow-2xl origin-top transition-transform">
              {renderInvoicePreview()}
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="w-full md:w-80 bg-white flex flex-col">
            <div className="bg-blue-600 p-6 text-white shrink-0">
              <DialogTitle className="text-xl">Invoice Ready</DialogTitle>
              <p className="text-blue-100 text-sm mt-1">Generated Successfully</p>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <Label className="text-xs text-gray-400 uppercase font-bold">Total Amount</Label>
                  <p className="text-2xl font-black text-gray-900">₹{total.toFixed(2)}</p>
                  <Badge variant={paymentMethod === 'not_paid' ? 'destructive' : 'default'} className="mt-1">
                    {paymentMethod === 'not_paid' ? 'PENDING' : 'PAID'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-bold text-gray-900">Download & Print</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="justify-start h-12 gap-3" onClick={handleDownloadPDF}>
                    <FileDown className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-bold">Standard A4 PDF</p>
                      <p className="text-[10px] text-gray-500">Best for digital sharing</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 gap-3" onClick={() => toast.info("Thermal printing...")}>
                    <Printer className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="text-sm font-bold">Thermal Receipt</p>
                      <p className="text-[10px] text-gray-500">For 2-inch/3-inch printers</p>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-bold text-gray-900">WhatsApp Sharing</h4>
                <Button className="w-full bg-green-600 hover:bg-green-700 h-12 gap-3" onClick={() => {
                  toast.success("Sent to WhatsApp!");
                  setShowBillDialog(false);
                  setSelectedServices([]);
                  setSelectedCustomer("");
                }}>
                  <Share2 className="w-5 h-5" />
                  Send Instant Bill
                </Button>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 mt-auto">
              <Button variant="ghost" className="w-full" onClick={() => setShowBillDialog(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
