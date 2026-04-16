import { useState } from "react";
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  MoreVertical
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

const mockInventory = [
  { id: "1", name: "A4 Paper Rims", quantity: 45, unit: "Rims", threshold: 10, status: "In Stock" },
  { id: "2", name: "Printer Ink (Black)", quantity: 4, unit: "Bottles", threshold: 5, status: "Low Stock" },
  { id: "3", name: "PVC Cards", quantity: 250, unit: "Cards", threshold: 50, status: "In Stock" },
  { id: "4", name: "Biometric Device", quantity: 2, unit: "Units", threshold: 1, status: "In Stock" },
  { id: "5", name: "Lamination Sheets", quantity: 15, unit: "Packs", threshold: 20, status: "Low Stock" },
];

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInventory = mockInventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">Monitor stock levels and manage center supplies.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
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
                <h3 className="text-2xl font-bold text-gray-900 mt-1">316</h3>
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
                <h3 className="text-2xl font-bold text-red-600 mt-1">2</h3>
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
                <h3 className="text-2xl font-bold text-gray-900 mt-1">₹12,450</h3>
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
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-medium text-gray-500">
                            <span>{percentage.toFixed(0)}%</span>
                            <span>Threshold: {item.threshold}</span>
                          </div>
                          <Progress value={percentage} className={`h-1.5 ${isLow ? 'bg-red-100' : 'bg-gray-100'}`} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <History className="w-4 h-4 text-gray-400" />
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
    </div>
  );
}
