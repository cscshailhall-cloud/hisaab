import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  FileText, 
  Download, 
  Share2, 
  Trash2, 
  Edit, 
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  Image as ImageIcon,
  QrCode,
  FileDown,
  Loader2
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { 
  ModernTemplate, 
  ClassicTemplate, 
  MinimalTemplate, 
  InvoiceData 
} from "@/components/InvoiceTemplates";
import { useAuth } from "@/context/AuthContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Invoices() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('invoices_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: invData } = await supabase.from("invoices").select("*, customers(name, mobile)").order("created_at", { ascending: false });
    const { data: confData } = await supabase.from('app_configurations').select('*').maybeSingle();
    
    if (invData) setInvoices(invData);
    if (confData) setConfig(confData);
    setIsLoading(false);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => 
      invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, invoices]);

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    const outstanding = invoices.filter(i => i.status !== 'Paid').reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    const paidThisMonth = invoices
      .filter(i => i.status === 'Paid' && new Date(i.created_at).getMonth() === new Date().getMonth())
      .reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    
    return { totalInvoiced, outstanding, paidThisMonth };
  }, [invoices]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview-modal');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${selectedInvoice.invoice_no || selectedInvoice.id.slice(-6)}.pdf`);
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  const renderTemplate = (invoice: any) => {
    if (!invoice || !config) return null;
    
    const invoiceData: InvoiceData = {
      invoice_no: invoice.invoice_no || `${config.invoice_prefix || 'INV-'}${invoice.id.slice(-6).toUpperCase()}`,
      date: invoice.created_at,
      customer_name: invoice.customers?.name || "Customer",
      customer_phone: invoice.customers?.mobile,
      items: invoice.items || [],
      subtotal: (invoice.items || []).reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity), 0),
      tax_amount: (invoice.items || []).reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity * (curr.tax / 100)), 0),
      discount: invoice.discount || 0,
      total: invoice.total_amount || 0,
      status: invoice.status,
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

    if (config.invoice_template === 'classic') return <div id="invoice-preview-modal"><ClassicTemplate {...props} /></div>;
    if (config.invoice_template === 'minimal') return <div id="invoice-preview-modal"><MinimalTemplate {...props} /></div>;
    return <div id="invoice-preview-modal"><ModernTemplate {...props} /></div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">View and manage all generated bills.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading && invoices.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 text-center md:text-left">
                <p className="text-sm text-gray-500 font-medium">Total Invoiced</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalInvoiced.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 text-center md:text-left">
                <p className="text-sm text-gray-500 font-medium">Outstanding</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">₹{stats.outstanding.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 text-center md:text-left">
                <p className="text-sm text-gray-500 font-medium">Paid This Month</p>
                <h3 className="text-2xl font-bold text-green-600 mt-1">₹{stats.paidThisMonth.toLocaleString()}</h3>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Search by invoice # or customer..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-md border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Invoice #</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Method</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-blue-600 uppercase">
                          {invoice.invoice_no || invoice.id.slice(-6)}
                        </TableCell>
                        <TableCell className="font-medium">{invoice.customers?.name}</TableCell>
                        <TableCell className="text-gray-500">{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-right">₹{invoice.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "border-none",
                            invoice.status === 'Paid' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          )}>
                            {invoice.status === 'Paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">{invoice.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedInvoice(invoice); setShowPreview(true); }}>
                              <Eye className="w-4 h-4 text-gray-400" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSelectedInvoice(invoice); setShowPreview(true); }}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.info("Download started...")}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast.success("Shared successfully")}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share on WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Invoice
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredInvoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-gray-400">
                          <p>No invoices found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden flex flex-col md:flex-row h-[90vh]">
          {/* Left Side: Real Preview */}
          <div className="flex-1 bg-gray-100 overflow-y-auto p-8 border-r">
            <div className="max-w-[800px] mx-auto shadow-2xl origin-top transition-all">
              {renderTemplate(selectedInvoice)}
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="w-full md:w-80 bg-white flex flex-col">
            <div className="bg-blue-600 p-6 text-white shrink-0">
              <DialogTitle className="text-xl">Invoice Actions</DialogTitle>
              <p className="text-blue-100 text-sm mt-1">#{selectedInvoice?.id.slice(-6).toUpperCase()}</p>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div>
                <Label className="text-xs text-gray-400 uppercase font-bold">Status</Label>
                <div className="mt-1">
                  <Badge className={cn(
                    "border-none",
                    selectedInvoice?.status === 'Paid' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {selectedInvoice?.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-bold text-gray-900">Options</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="justify-start h-12 gap-3" onClick={handleDownloadPDF}>
                    <FileDown className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-bold">Download PDF</p>
                      <p className="text-[10px] text-gray-500">Standard A4 Format</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-12 gap-3" onClick={() => toast.info("Thermal printing...")}>
                    <Printer className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="text-sm font-bold">Thermal Print</p>
                      <p className="text-[10px] text-gray-500">Direct to POS printer</p>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-bold text-gray-900">Sharing</h4>
                <Button className="w-full bg-green-600 hover:bg-green-700 h-12 gap-3" onClick={() => toast.success("Shared on WhatsApp!")}>
                  <Share2 className="w-5 h-5" />
                  Resend on WhatsApp
                </Button>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 mt-auto">
              <Button variant="ghost" className="w-full" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
