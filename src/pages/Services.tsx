import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Tag } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newService, setNewService] = useState({ name: "", price: "", category: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });
    return () => unsubscribe();
  }, []);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddService = async () => {
    if (!newService.name || !newService.price) {
      toast.error("Name and Price are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "services"), {
        ...newService,
        price: parseFloat(newService.price),
        createdAt: serverTimestamp(),
      });
      toast.success("Service added successfully");
      setShowAddDialog(false);
      setNewService({ name: "", price: "", category: "" });
    } catch (error) {
      toast.error("Failed to add service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try {
      await deleteDoc(doc(db, "services", id));
      toast.success("Service deleted");
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500">Manage the services and rates for your center.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Service
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search services..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                      No services found. Add your first service to start billing.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                          {service.category || "General"}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">₹{service.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteService(service.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="s-name">Service Name</Label>
              <Input 
                id="s-name" 
                placeholder="e.g., PAN Card New" 
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-price">Price (₹)</Label>
              <Input 
                id="s-price" 
                type="number" 
                placeholder="0.00" 
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-cat">Category</Label>
              <Input 
                id="s-cat" 
                placeholder="e.g., Government" 
                value={newService.category}
                onChange={(e) => setNewService({...newService, category: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600" onClick={handleAddService} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
