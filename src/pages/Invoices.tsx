import { useState, useMemo } from "react";
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
  ImageIcon,
  QrCode
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

const mockInvoices = [
  { id: "INV-2024-001", customer: "Rahul Sharma", date: "2024-03-10", amount: 250, status: "Paid", method: "UPI" },
  { id: "INV-2024-002", customer: "Priya Patel", date: "2024-03-12", amount: 1500, status: "Pending", method: "-" },
  { id: "INV-2024-003", customer: "Amit Kumar", date: "2024-03-14", amount: 2800, status: "Paid", method: "Cash" },
  { id: "INV-2024-004", customer: "Sneha Reddy", date: "2024-03-15", amount: 6200, status: "Paid", method: "Card" },
  { id: "INV-2024-005", customer: "Vikram Singh", date: "2024-03-16", amount: 750, status: "Overdue", method: "-" },
];

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter(invoice => 
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-700 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-700 border-none"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "Overdue":
        return <Badge className="bg-red-100 text-red-700 border-none"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = (action: string, invoice: any) => {
    switch (action) {
      case "view":
        setSelectedInvoice(invoice);
        setShowPreview(true);
        break;
      case "download":
        toast.success(`Downloading ${invoice.id}...`);
        break;
      case "share":
        toast.success(`Sharing ${invoice.id} via WhatsApp...`);
        break;
      case "delete":
        toast.error(`${invoice.id} deleted.`);
        break;
      case "edit":
        toast.info(`Editing ${invoice.id}...`);
        break;
    }
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
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 font-medium">Total Invoiced</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹11,500</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 font-medium">Outstanding</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">₹2,250</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 font-medium">Paid This Month</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">₹9,250</h3>
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
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Method</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium text-blue-600">{invoice.id}</TableCell>
                    <TableCell className="font-medium">{invoice.customer}</TableCell>
                    <TableCell className="text-gray-500">{invoice.date}</TableCell>
                    <TableCell className="font-bold">₹{invoice.amount}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">{invoice.method}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAction("view", invoice)}>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction("edit", invoice)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("download", invoice)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("share", invoice)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share on WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleAction("delete", invoice)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl">Invoice Preview</DialogTitle>
              <p className="text-blue-100 text-sm mt-1">{selectedInvoice?.id} • {selectedInvoice?.date}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <FileText className="w-8 h-8" />
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-xs text-gray-400 uppercase font-bold">Customer</Label>
                <p className="font-bold text-gray-900">{selectedInvoice?.customer}</p>
              </div>
              <div className="text-right">
                <Label className="text-xs text-gray-400 uppercase font-bold">Total Amount</Label>
                <p className="text-2xl font-black text-gray-900">₹{selectedInvoice?.amount.toFixed(2)}</p>
                <Badge variant={selectedInvoice?.status === 'Paid' ? 'default' : 'destructive'} className="mt-1">
                  {selectedInvoice?.status.toUpperCase()}
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
              <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Actions</h4>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => handleAction("download", selectedInvoice)}>
                  <Download className="w-6 h-6 text-blue-600" />
                  <span>Download PDF</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Printer className="w-6 h-6 text-gray-600" />
                  <span>Print Thermal</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <ImageIcon className="w-6 h-6 text-purple-600" />
                  <span>Export Image</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <QrCode className="w-6 h-6 text-green-600" />
                  <span>Payment QR</span>
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Resend to Customer</p>
                  <p className="text-xs text-blue-700">Send via WhatsApp</p>
                </div>
              </div>
              <Button size="sm" className="bg-blue-600" onClick={() => {
                handleAction("share", selectedInvoice);
                setShowPreview(false);
              }}>Send Now</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
