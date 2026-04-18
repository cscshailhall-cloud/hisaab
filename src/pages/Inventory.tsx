import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  MoreVertical,
  Trash2,
  Edit
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  status: string;
  purchase_price?: number;
  selling_price?: number;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "",
    threshold: "",
    purchase_price: "",
    selling_price: ""
  });

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchInventory)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleEditClick = (item: InventoryItem) => {
    setNewItem({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      threshold: item.threshold.toString(),
      purchase_price: (item.purchase_price || 0).toString(),
      selling_price: (item.selling_price || 0).toString(),
    });
    setEditingItemId(item.id);
    setShowAddDialog(true);
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity || !newItem.unit || !newItem.threshold) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = {
        name: newItem.name,
        quantity: parseInt(newItem.quantity),
        unit: newItem.unit,
        threshold: parseInt(newItem.threshold),
        purchase_price: newItem.purchase_price ? parseFloat(newItem.purchase_price) : 0,
        selling_price: newItem.selling_price ? parseFloat(newItem.selling_price) : 0,
        status: parseInt(newItem.quantity) <= parseInt(newItem.threshold) ? "Low Stock" : "In Stock"
      };

      if (editingItemId) {
        const { error } = await supabase.from("inventory").update(itemData).eq("id", editingItemId);
        if (error) throw error;
        toast.success("Item updated");
      } else {
        const { error } = await supabase.from("inventory").insert(itemData);
        if (error) throw error;
        toast.success("Item added to inventory");
      }

      setShowAddDialog(false);
      setEditingItemId(null);
      setNewItem({ name: "", quantity: "", unit: "", threshold: "", purchase_price: "", selling_price: "" });
    } catch (error: any) {
      toast.error(editingItemId ? "Failed to update item" : "Failed to add item", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item removed");
    } catch (error: any) {
      toast.error("Failed to delete item", { description: error.message });
    }
  };

  const filteredInventory = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalItems: items.length,
    lowStock: items.filter(i => i.quantity <= i.threshold).length,
    totalValue: items.reduce((acc, curr) => acc + ((curr.purchase_price || 0) * curr.quantity), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">Monitor stock levels and manage center supplies.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Items</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.lowStock}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Stock Value</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalValue.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search inventory..." 
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
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold">Quantity</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Stock Level</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const percentage = Math.min((item.quantity / (item.threshold * 2)) * 100, 100);
                  const isLow = item.quantity <= item.threshold;

                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">Unit: {item.unit}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={isLow ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}
                        >
                          {isLow ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-medium text-gray-500">
                            <span>{(percentage || 0).toFixed(0)}%</span>
                            <span>Threshold: {item.threshold}</span>
                          </div>
                          <Progress value={percentage} className={`h-1.5 ${isLow ? 'bg-red-100' : 'bg-gray-100'}`} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEditClick(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setEditingItemId(null);
          setNewItem({ name: "", quantity: "", unit: "", threshold: "", purchase_price: "", selling_price: "" });
        }
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingItemId ? "Edit Inventory Item" : "Add Inventory Item"}</DialogTitle>
            <DialogDescription>
              {editingItemId ? "Update the details for this item." : "Add a new item to your center inventory."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="i-name">Item Name</Label>
              <Input 
                id="i-name" 
                placeholder="e.g., A4 Paper" 
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="i-qty">Quantity</Label>
                <Input 
                  id="i-qty" 
                  type="number" 
                  placeholder="0" 
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="i-unit">Unit</Label>
                <Input 
                  id="i-unit" 
                  placeholder="e.g., Rims" 
                  value={newItem.unit}
                  onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="i-thr">Threshold</Label>
                <Input 
                  id="i-thr" 
                  type="number" 
                  placeholder="10" 
                  value={newItem.threshold}
                  onChange={(e) => setNewItem({...newItem, threshold: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="i-pprice">Purchase Price</Label>
                <Input 
                  id="i-pprice" 
                  type="number" 
                  placeholder="0.00" 
                  value={newItem.purchase_price}
                  onChange={(e) => setNewItem({...newItem, purchase_price: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="i-sprice">Selling Price</Label>
                <Input 
                  id="i-sprice" 
                  type="number" 
                  placeholder="0.00" 
                  value={newItem.selling_price}
                  onChange={(e) => setNewItem({...newItem, selling_price: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600" onClick={handleAddItem} disabled={isSubmitting}>
              {isSubmitting ? (editingItemId ? "Updating..." : "Adding...") : (editingItemId ? "Update Item" : "Add Item")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
