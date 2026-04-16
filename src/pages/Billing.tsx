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
  AlertCircle
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
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  useEffect(() => {
    const unsubCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });
    const unsubServices = onSnapshot(collection(db, "services"), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });
    return () => {
      unsubCustomers();
      unsubServices();
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

  const removeService = (id: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setSelectedServices(selectedServices.map(s => 
      s.id === id ? { ...s, quantity: qty } : s
    ));
  };

  const addMultipleServices = () => {
    const newServices = tempSelectedServices.map(id => {
      const service = services.find(s => s.id === id);
      return {
        id: service!.id,
        name: service!.name,
        price: service!.price,
        quantity: 1,
        tax: 18
      };
    });

    setSelectedServices(prev => {
      const existingIds = prev.map(s => s.id);
      const filteredNew = newServices.filter(s => !existingIds.includes(s.id));
      return [...prev, ...filteredNew];
    });
    setTempSelectedServices([]);
    toast.success(`${newServices.length} services added`);
  };

  const handleGenerateBill = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Please add at least one service");
      return;
    }

    setIsGenerating(true);
    try {
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
      const customer = customers.find(c => c.id === selectedCustomer);
      
      const invoiceData = {
        invoiceNo,
        customerId: selectedCustomer,
        customerName: customer?.name || "Unknown",
        date: new Date().toISOString(),
        amount: total,
        status: paymentMethod === 'not_paid' ? 'Pending' : 'Paid',
        method: paymentMethod,
        items: selectedServices,
        discount,
        taxAmount,
        subtotal,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "invoices"), invoiceData);
      setGeneratedInvoiceId(docRef.id);

      // Update customer stats
      const customerRef = doc(db, "customers", selectedCustomer);
      await updateDoc(customerRef, {
        totalSpent: increment(total),
        billsCount: increment(1),
        outstanding: increment(paymentMethod === 'not_paid' ? total : 0),
        totalPaid: increment(paymentMethod !== 'not_paid' ? total : 0),
        lastVisit: new Date().toISOString()
      });

      setShowBillDialog(true);
      if (paymentMethod === 'not_paid') {
        toast.warning("Bill generated as Pending", {
          description: "Amount added to customer ledger."
        });
      } else {
        toast.success("Bill generated successfully!");
      }
    } catch (error) {
      console.error("Error generating bill:", error);
      toast.error("Failed to generate bill");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.mobile) {
      toast.error("Name and Mobile are required");
      return;
    }
    setIsAddingCustomer(true);
    try {
      const docRef = await addDoc(collection(db, "customers"), {
        ...newCustomer,
        outstanding: 0,
        totalSpent: 0,
        totalPaid: 0,
        billsCount: 0,
        createdAt: serverTimestamp(),
      });
      setSelectedCustomer(docRef.id);
      setShowAddCustomerDialog(false);
      setNewCustomer({ name: "", mobile: "" });
      toast.success("Customer added and selected");
    } catch (error) {
      toast.error("Failed to add customer");
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("invoice-template");
    if (!element) return;

    toast.info("Preparing PDF...");
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${generatedInvoiceId || 'Bill'}.pdf`);
      toast.success("PDF Downloaded!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Hidden Invoice Template for PDF Generation */}
      <div className="fixed -left-[9999px] top-0">
        <div id="invoice-template" className="w-[210mm] min-h-[297mm] bg-white p-10 text-gray-900 font-sans">
          <div className="flex justify-between items-start border-b-4 border-blue-600 pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-black text-blue-600 uppercase tracking-tighter">INVOICE</h1>
              <p className="text-gray-500 mt-1 font-bold">#{Date.now().toString().slice(-6)}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">CSC Digital Center</h2>
              <p className="text-sm text-gray-500">123, Main Market, Sector 15, New Delhi</p>
              <p className="text-sm text-gray-500">Contact: +91 9876543210</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-10">
            <div>
              <p className="text-xs font-black text-blue-600 uppercase mb-2 tracking-widest">Bill To</p>
              <h3 className="text-lg font-bold">{customers.find(c => c.id === selectedCustomer)?.name || "Customer Name"}</h3>
              <p className="text-sm text-gray-500">{customers.find(c => c.id === selectedCustomer)?.mobile}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-blue-600 uppercase mb-2 tracking-widest">Invoice Details</p>
              <p className="text-sm"><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</p>
              <p className="text-sm"><span className="font-bold">Payment:</span> {paymentMethod.toUpperCase()}</p>
            </div>
          </div>

          <table className="w-full mb-10">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="py-3 px-4 text-left font-bold uppercase text-xs">Description</th>
                <th className="py-3 px-4 text-center font-bold uppercase text-xs">Qty</th>
                <th className="py-3 px-4 text-right font-bold uppercase text-xs">Unit Price</th>
                <th className="py-3 px-4 text-right font-bold uppercase text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedServices.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-4 px-4 text-sm font-medium">{item.name}</td>
                  <td className="py-4 px-4 text-center text-sm">{item.quantity}</td>
                  <td className="py-4 px-4 text-right text-sm">₹{item.price.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right text-sm font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax (GST 18%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t-2 border-blue-600">
                <span className="text-lg font-black text-blue-600 uppercase">Total</span>
                <span className="text-2xl font-black text-gray-900">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-gray-100 grid grid-cols-2 gap-10">
            <div>
              <p className="text-xs font-black text-blue-600 uppercase mb-2 tracking-widest">Terms & Conditions</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                1. Goods once sold will not be taken back.<br/>
                2. This is a computer generated invoice.<br/>
                3. Payment should be made within 7 days.
              </p>
            </div>
            <div className="text-right flex flex-col items-end justify-end">
              <div className="w-32 h-1 bg-gray-900 mb-2"></div>
              <p className="text-xs font-bold uppercase">Authorized Signature</p>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-sm font-bold text-blue-600 italic">Thank you for your business!</p>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select Customer & Services</CardTitle>
            <CardDescription>Add customer details and services to the bill.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger render={
                      <Button variant="outline" className="flex-1 justify-between font-normal">
                        {selectedCustomer 
                          ? customers.find(c => c.id === selectedCustomer)?.name 
                          : "Select customer..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    } />
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input 
                          placeholder="Search customer..." 
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-1">
                        {filteredCustomers.length === 0 && (
                          <div className="py-6 text-center text-sm text-gray-500">No customer found.</div>
                        )}
                        {filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            className={cn(
                              "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors",
                              selectedCustomer === c.id && "bg-blue-50 text-blue-600 font-medium"
                            )}
                            onClick={() => setSelectedCustomer(c.id)}
                          >
                            {c.name} <span className="text-xs text-gray-400 ml-1">({c.mobile})</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" size="icon" onClick={() => setShowAddCustomerDialog(true)}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Add Services</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger render={
                      <Button variant="outline" className="flex-1 justify-between font-normal">
                        Select services...
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    } />
                    <PopoverContent className="w-[350px] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input 
                          placeholder="Search services..." 
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-1">
                        {filteredServices.map(s => (
                          <div key={s.id} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 rounded-md">
                            <Checkbox 
                              id={s.id} 
                              checked={tempSelectedServices.includes(s.id)}
                              onCheckedChange={(checked) => {
                                if (checked) setTempSelectedServices([...tempSelectedServices, s.id]);
                                else setTempSelectedServices(tempSelectedServices.filter(id => id !== s.id));
                              }}
                            />
                            <label htmlFor={s.id} className="flex-1 text-sm cursor-pointer">
                              {s.name} <span className="text-xs text-gray-400 ml-1">₹{s.price}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t bg-gray-50 flex justify-between items-center">
                        <span className="text-xs text-gray-500">{tempSelectedServices.length} selected</span>
                        <Button size="sm" onClick={addMultipleServices} disabled={tempSelectedServices.length === 0}>
                          Add Selected
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-gray-100">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                        No services added yet. Select a service to start billing.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedServices.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>₹{item.price}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            className="w-16 h-8" 
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>{item.tax}%</TableCell>
                        <TableCell className="font-bold">₹{item.price * item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeService(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: "cash", label: "Cash", icon: Banknote },
                { id: "upi", label: "UPI", icon: Smartphone },
                { id: "card", label: "Card", icon: CreditCard },
                { id: "other", label: "Other", icon: Receipt },
                { id: "not_paid", label: "Not Paid", icon: AlertCircle, color: "text-red-600 border-red-100 bg-red-50" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                    paymentMethod === method.id 
                      ? (method.id === 'not_paid' ? "border-red-600 bg-red-100 text-red-600" : "border-blue-600 bg-blue-50 text-blue-600")
                      : "border-gray-100 hover:border-gray-200 text-gray-600"
                  )}
                >
                  <method.icon className={cn("w-5 h-5 mb-2", method.id === 'not_paid' && !paymentMethod.includes('not_paid') && "text-red-500")} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{method.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-gray-900 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <CardHeader>
            <CardTitle className="text-lg">Bill Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Tax (GST)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-400 text-sm">
              <span>Discount</span>
              <Input 
                type="number" 
                className="w-20 h-7 bg-gray-800 border-gray-700 text-white text-right text-xs" 
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="pt-4 border-t border-gray-800 flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total Payable</p>
                <h2 className="text-3xl font-bold">₹{total.toFixed(2)}</h2>
              </div>
              <Badge className="bg-blue-600 text-white border-none mb-1">
                {paymentMethod.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          <Button 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-bold"
            disabled={isGenerating}
            onClick={handleGenerateBill}
          >
            {isGenerating ? (
              "Generating..."
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Generate & Print Bill
              </>
            )}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11">
              <Printer className="w-4 h-4 mr-2" />
              Thermal
            </Button>
            <Button variant="outline" className="h-11">
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-xs h-9">
              <Plus className="w-3 h-3 mr-2" />
              Add Extra Charges
            </Button>
            <Button variant="ghost" className="w-full justify-start text-xs h-9">
              <Plus className="w-3 h-3 mr-2" />
              Add Notes to Invoice
            </Button>
          </CardContent>
        </Card>
      </div>
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl">Invoice Generated</DialogTitle>
              <p className="text-blue-100 text-sm mt-1">#INV-2024-001 • {new Date().toLocaleDateString()}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <Receipt className="w-8 h-8" />
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-xs text-gray-400 uppercase font-bold">Customer</Label>
                <p className="font-bold text-gray-900">{customers.find(c => c.id === selectedCustomer)?.name}</p>
                <p className="text-sm text-gray-500">{customers.find(c => c.id === selectedCustomer)?.mobile}</p>
              </div>
              <div className="text-right">
                <Label className="text-xs text-gray-400 uppercase font-bold">Amount Due</Label>
                <p className="text-2xl font-black text-gray-900">₹{total.toFixed(2)}</p>
                <Badge variant={paymentMethod === 'not_paid' ? 'destructive' : 'default'} className="mt-1">
                  {paymentMethod === 'not_paid' ? 'PENDING' : 'PAID VIA ' + paymentMethod.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Bill Customization</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Show QR Code</span>
                  <Switch size="sm" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Show Bank Details</span>
                  <Switch size="sm" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Show T&C</span>
                  <Switch size="sm" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Show Logo</span>
                  <Switch size="sm" defaultChecked />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Bill Options</h4>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={handleDownloadPDF}>
                  <FileDown className="w-6 h-6 text-blue-600" />
                  <span>Download A4 PDF</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => toast.info("Thermal printing simulation...")}>
                  <Printer className="w-6 h-6 text-gray-600" />
                  <span>Print Thermal (2-inch)</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => toast.info("Image export simulation...")}>
                  <ImageIcon className="w-6 h-6 text-purple-600" />
                  <span>Export as Image</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => toast.info("QR Code generation...")}>
                  <QrCode className="w-6 h-6 text-green-600" />
                  <span>Show Payment QR</span>
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Send to Customer</p>
                  <p className="text-xs text-blue-700">Send PDF & Image via WhatsApp</p>
                </div>
              </div>
              <Button size="sm" className="bg-blue-600" onClick={() => {
                toast.success("Sent to WhatsApp!");
                setShowBillDialog(false);
                setSelectedServices([]);
                setSelectedCustomer("");
              }}>Send Now</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Add Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quick-name">Full Name</Label>
              <Input 
                id="quick-name" 
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quick-mobile">Mobile Number</Label>
              <Input 
                id="quick-mobile" 
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomerDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600" onClick={handleQuickAddCustomer} disabled={isAddingCustomer}>
              {isAddingCustomer ? "Adding..." : "Add & Select"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
