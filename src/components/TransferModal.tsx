/**
 * TransferModal Component
 *
 * BRANCH MANAGER FLOW - Transfer order to another branch
 * Used in branch dashboard when manager encounters:
 * - Wrong area selected by customer
 * - Item unavailable at current branch
 * - Branch overloaded
 * - Delivery too far
 *
 * Features:
 * - Searchable dropdown for target branch (NO TYPING)
 * - Transfer reason dropdown
 * - List of alternative branches with available items
 * - Customer notification preview
 * - Real-time socket notification after transfer
 */

"use client";

import { useState } from "react";
import { toast } from "@/components/ui/Toast";

interface Branch {
  _id: string;
  name: string;
  contactNumber: string;
  activeOrders: number;
  address?: {
    street?: string;
    city?: string;
  };
}

interface TransferModalProps {
  orderId: string;
  currentBranchId: string;
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete?: (data: any) => void;
  branches?: Branch[];
  unavailableItems?: string[];
}

const TRANSFER_REASONS = [
  { value: "WRONG_AREA", label: "Customer selected wrong area" },
  { value: "BRANCH_OVERLOADED", label: "Our branch is too busy" },
  { value: "ITEM_UNAVAILABLE", label: "Item not in stock" },
  { value: "DELIVERY_FAR", label: "Delivery address too far" },
  { value: "BRANCH_CLOSED", label: "Emergency branch closure" },
  { value: "MANAGER_REQUEST", label: "Manager request" },
];

const inputCls = "w-full px-4 py-2.5 bg-background border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-white placeholder:text-white/25 text-sm transition-all";

export function TransferModal({
  orderId,
  currentBranchId,
  isOpen,
  onClose,
  onTransferComplete,
  branches = [],
  unavailableItems = [],
}: TransferModalProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const filteredBranches = branches.filter(
    (b) =>
      b._id !== currentBranchId &&
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleTransfer() {
    if (!selectedBranch || !selectedReason) {
      toast.error("Please select branch and transfer reason");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/orders/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          fromBranchId: currentBranchId,
          toBranchId: selectedBranch._id,
          reason: selectedReason,
          unavailableItems,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Order transferred successfully");
        onTransferComplete?.(data.data);
        resetForm();
        onClose();
      } else {
        toast.error(data.error || "Failed to transfer order");
      }
    } catch (error) {
      console.error("Error transferring order:", error);
      toast.error("Failed to transfer order");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedBranch(null);
    setSelectedReason("");
    setNotes("");
    setSearchQuery("");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ background: "linear-gradient(145deg, rgba(10,18,35,0.98), rgba(5,13,26,0.99))", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Header */}
        <div className="sticky top-0 border-b border-white/8 p-5 flex justify-between items-center"
          style={{ background: "rgba(10,18,35,0.98)" }}>
          <h2 className="text-lg font-black text-white">Transfer Order</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Transfer Reason */}
          <div>
            <label className="block text-sm font-bold text-white/60 mb-1.5">
              Transfer Reason
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className={inputCls}
            >
              <option value="">Select reason...</option>
              {TRANSFER_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {/* Select Target Branch */}
          <div>
            <label className="block text-sm font-bold text-white/60 mb-1.5">
              Transfer To Branch
            </label>
            {selectedBranch ? (
              <div className="p-3 bg-blue-400/10 border border-blue-400/20 rounded-xl">
                <p className="font-semibold text-blue-400">{selectedBranch.name}</p>
                <p className="text-blue-400/70 text-sm">
                  {selectedBranch.activeOrders} active orders
                </p>
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="text-blue-400 text-sm underline mt-2"
                >
                  Change Branch
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowBranchDropdown(true)}
                  className={inputCls}
                />
                {showBranchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl z-10 max-h-48 overflow-y-auto"
                    style={{ background: "rgba(13,24,41,0.99)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {filteredBranches.length > 0 ? (
                      <ul className="divide-y divide-white/5">
                        {filteredBranches.map((branch) => (
                          <li key={branch._id}>
                            <button
                              onClick={() => {
                                setSelectedBranch(branch);
                                setShowBranchDropdown(false);
                                setSearchQuery("");
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors"
                            >
                              <p className="font-semibold text-white">{branch.name}</p>
                              <p className="text-sm text-white/40">
                                {branch.activeOrders} orders
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-white/40">
                        No branches found
                      </div>
                    )}
                  </div>
                )}
                {showBranchDropdown && (
                  <div className="fixed inset-0 z-0" onClick={() => setShowBranchDropdown(false)} />
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-white/60 mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this transfer..."
              className={inputCls}
              rows={3}
            />
          </div>

          {/* Customer Notification Preview */}
          <div className="bg-amber-400/8 border border-amber-400/20 p-3 rounded-xl">
            <p className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wide">
              Customer will receive:
            </p>
            <p className="text-sm text-amber-400/80">
              "Your order has been reassigned to a nearby branch for faster service."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-white/8 p-5 flex gap-3"
          style={{ background: "rgba(10,18,35,0.98)" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-white/10 text-white/70 rounded-xl font-bold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={loading || !selectedBranch || !selectedReason}
            className="flex-1 py-2.5 bg-primary text-black rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Transferring..." : "Transfer Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
