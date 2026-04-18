import { QRCodeSVG } from 'qrcode.react';
import React from "react";
import { 
  CheckCircle2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
}

export interface InvoiceData {
  invoice_no: string;
  date: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount?: number;
  discount: number;
  total: number;
  status: string;
  business_name?: string;
  business_phone?: string;
  business_address?: string;
  business_gst?: string;
  upi_id?: string;
}

interface TemplateProps {
  data: InvoiceData;
  accentColor?: string;
  showLogo?: boolean;
  showQR?: boolean;
  showBank?: boolean;
  fontFamily?: string;
}

export const ModernTemplate = ({ data, accentColor = "#2563eb", showLogo = true, showQR = true }: TemplateProps) => {
  return (
    <div className="bg-white text-gray-900 p-8 shadow-inner min-h-[800px] flex flex-col font-sans border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 pb-6 mb-8" style={{ borderColor: accentColor }}>
        <div>
          {showLogo && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
                <Receipt className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black uppercase tracking-tighter">{data.business_name || "CSC DIGITAL"}</h1>
            </div>
          )}
          <div className="text-xs text-gray-500 space-y-0.5 mt-2">
            <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.business_address || "Main Street, NY"}</p>
            <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.business_phone || "+91 9876543210"}</p>
            {data.business_gst && <p className="font-bold text-gray-700 mt-1">GSTIN: {data.business_gst}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black uppercase tracking-tight" style={{ color: accentColor }}>INVOICE</h2>
          <p className="text-sm font-bold mt-1">#{data.invoice_no}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date(data.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex justify-between mb-10 gap-8">
        <div className="flex-1 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</h3>
          <p className="font-bold text-lg">{data.customer_name}</p>
          {data.customer_phone && <p className="text-sm text-gray-600 mt-0.5">{data.customer_phone}</p>}
          {data.customer_address && <p className="text-xs text-gray-500 mt-1">{data.customer_address}</p>}
        </div>
        <div className="w-48 p-4 rounded-xl text-white" style={{ backgroundColor: accentColor }}>
          <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Total Amount</h3>
          <p className="text-2xl font-black">₹{data.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold backdrop-blur-sm">
            <span className={cn("w-1.5 h-1.5 rounded-full", data.status === 'Paid' ? "bg-green-400" : "bg-red-400")} />
            {data.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1">
        <table className="w-full">
          <thead className="text-left border-b-2" style={{ borderColor: accentColor }}>
            <tr>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service Item</th>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Qty</th>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Price</th>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Discount</th>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.items.map((item, i) => (
              <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                <td className="py-4">
                  <p className="font-bold text-gray-900">{item.name || "Unknown Item"}</p>
                </td>
                <td className="py-4 text-center font-medium">{item.quantity || 1}</td>
                <td className="py-4 text-right font-medium">₹{(item.price || 0).toFixed(2)}</td>
                <td className="py-4 text-right font-medium text-red-500">
                  {item.discount ? `-₹${item.discount.toFixed(2)}` : "-"}
                </td>
                <td className="py-4 text-right font-bold">₹{(((item.price || 0) * (item.quantity || 1)) - (item.discount || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-10 border-t pt-8">
        <div className="flex justify-between items-start">
          <div className="max-w-[15.625rem] space-y-4">
            {showQR && data.upi_id && (
              <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 inline-block">
                <div className="bg-white rounded-lg p-1 border">
                  <QRCodeSVG 
                    value={`upi://pay?pa=${data.upi_id}&pn=${encodeURIComponent(data.business_name || 'CSC Billing')}&am=${data.total}&tn=${encodeURIComponent(data.invoice_no)}`} 
                    size={80} 
                  />
                </div>
                <p className="text-[10px] font-bold text-center text-gray-400 mt-2 uppercase tracking-tighter">Pay via UPI</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terms & Conditions</p>
              <p className="text-[10px] text-gray-500 leading-relaxed italic">
                1. Payments should be made in full. 2. Goods once sold are not returnable. 
                3. Disputes are subject to Delhi jurisdiction.
              </p>
            </div>
          </div>
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-bold">₹{(data.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Tax Allocation</span>
              <span className="font-bold text-green-600">+₹{(data.tax_amount || 0).toFixed(2)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Discount</span>
                <span className="font-bold text-red-500">-₹{(data.discount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t-2" style={{ borderColor: accentColor }}>
              <span className="text-lg font-black uppercase tracking-tight" style={{ color: accentColor }}>Grand Total</span>
              <span className="text-lg font-black">₹{(data.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-10 text-center">
        <p className="text-xs font-medium text-gray-400 flex items-center justify-center gap-1 uppercase tracking-widest">
          Thank you for your business <CheckCircle2 className="w-3 h-3 text-green-500" />
        </p>
      </div>
    </div>
  );
};

export const ClassicTemplate = ({ data, showLogo = true }: TemplateProps) => {
  return (
    <div className="bg-white text-gray-900 p-12 shadow-inner min-h-[800px] flex flex-col font-serif border border-gray-200">
      <div className="text-center mb-12">
        {showLogo && <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
        <h1 className="text-4xl font-serif text-gray-900 tracking-tight mb-2 italic">{data.business_name || "Professional Services"}</h1>
        <p className="text-xs uppercase tracking-widest text-gray-500">{data.business_address}</p>
        <p className="text-xs uppercase tracking-widest text-gray-500">GSTIN: {data.business_gst || "N/A"} | PH: {data.business_phone}</p>
      </div>

      <div className="h-px bg-gray-200 w-full mb-10" />

      <div className="flex justify-between mb-12">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Invoice To</h3>
            <p className="text-xl font-bold">{data.customer_name}</p>
            <p className="text-sm text-gray-600 italic">PH: {data.customer_phone}</p>
          </div>
        </div>
        <div className="text-right space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Details</h3>
            <p className="text-sm font-bold">INV: #{data.invoice_no}</p>
            <p className="text-sm">Dated: {new Date(data.date).toLocaleDateString()}</p>
            <p className={cn("text-xs font-bold mt-1 px-2 py-0.5 inline-block border", data.status === 'Paid' ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-700")}>
              {data.status.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-gray-800">
              <th className="py-4 text-left text-sm uppercase font-bold tracking-widest">Description</th>
              <th className="py-4 text-center text-sm uppercase font-bold tracking-widest">Qty</th>
              <th className="py-4 text-right text-sm uppercase font-bold tracking-widest">Rate</th>
              <th className="py-4 text-right text-sm uppercase font-bold tracking-widest">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-none">
                <td className="py-5">
                  <p className="text-base font-bold">{item.name || "Unknown Item"}</p>
                  <p className="text-xs text-gray-500 italic">Service Charge / Goods Unit</p>
                </td>
                <td className="py-5 text-center">{item.quantity || 1}</td>
                <td className="py-5 text-right">₹{(item.price || 0).toFixed(2)}</td>
                <td className="py-5 text-right font-bold">₹{(((item.price || 0) * (item.quantity || 1)) - (item.discount || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 flex justify-end">
        <div className="w-72 space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600 font-medium italic">Basic Amount</span>
            <span className="font-bold">₹{data.subtotal.toFixed(2)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600 font-medium italic">Global Discount</span>
              <span className="font-bold text-red-500">-₹{data.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-4">
            <span className="text-2xl font-bold italic tracking-tighter">Grand Total Due</span>
            <span className="text-2xl font-bold">₹{data.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-20 flex justify-between items-end border-t pt-8">
        <div className="text-[10px] text-gray-400 uppercase tracking-widest max-w-xs leading-loose italic">
          Authorized Signatory Verification Required. This is a computer generated document.
        </div>
        <div className="text-center w-48 border-t pt-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Authorized Sign</p>
        </div>
      </div>
    </div>
  );
};

export const MinimalTemplate = ({ data }: TemplateProps) => {
  return (
    <div className="bg-white text-black p-10 min-h-[800px] flex flex-col font-sans border border-gray-100">
      <div className="flex justify-between items-start mb-16">
        <div>
          <h1 className="text-2xl font-light tracking-tight">{data.business_name}</h1>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">{data.business_address}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-4">Invoice</p>
          <p className="text-sm font-light">#{data.invoice_no}</p>
          <p className="text-[10px] text-gray-400 mt-1">{new Date(data.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-16">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-4">Bill To</p>
        <p className="text-xl font-light">{data.customer_name}</p>
        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{data.customer_phone}</p>
      </div>

      <div className="flex-1">
        <div className="grid grid-cols-12 border-b border-gray-100 pb-2 mb-4">
          <div className="col-span-8 text-[10px] items-center flex font-bold text-gray-300 uppercase tracking-[0.2em]">Item</div>
          <div className="col-span-1 text-[10px] items-center flex justify-center font-bold text-gray-300 uppercase tracking-[0.2em]">Qty</div>
          <div className="col-span-3 text-[10px] items-center flex justify-end font-bold text-gray-300 uppercase tracking-[0.2em]">Amount</div>
        </div>
        <div className="space-y-6">
          {data.items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 items-start">
              <div className="col-span-8">
                <p className="text-sm font-medium">{item.name || "Unknown Item"}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Rate: ₹{(item.price || 0).toFixed(2)}{item.discount ? ` | Discount: -₹${item.discount.toFixed(2)}` : ''}</p>
              </div>
              <div className="col-span-1 text-center text-sm font-light">{item.quantity || 1}</div>
              <div className="col-span-3 text-right text-sm font-bold">₹{(((item.price || 0) * (item.quantity || 1)) - (item.discount || 0)).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-100 flex justify-end">
        <div className="w-64 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Subtotal</span>
            <span className="text-sm font-light">₹{data.subtotal.toFixed(2)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Discount</span>
              <span className="text-sm font-light text-red-500">-₹{data.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Total</span>
            <span className="text-2xl font-light">₹{data.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-16">
        <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em]">Thank you</p>
      </div>
    </div>
  );
};
