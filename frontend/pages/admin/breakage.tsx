import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/AdminLayout";
import { assetsApi, breakagesApi, visitsApi } from "../../services/api";
import { getLatestActiveVisit } from "../../utils/visits";
import { Plus, Trash2, AlertTriangle, Calendar } from "lucide-react";

export default function BreakagePage() {
  const [breakages, setBreakages] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [wirelessSets, setWirelessSets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterVisit, setFilterVisit] = useState("");
  const { register, handleSubmit, reset, setValue } = useForm<any>();

  const load = () =>
    breakagesApi
      .getAll(filterVisit ? parseInt(filterVisit) : undefined)
      .then((r) => setBreakages(r.data));

  useEffect(() => {
    visitsApi.getAll().then((r) => {
      const allVisits = r.data;
      const latestVisit = getLatestActiveVisit(allVisits);

      setVisits(allVisits);

      if (latestVisit) {
        const latestVisitId = latestVisit.id.toString();
        setFilterVisit(latestVisitId);
        setValue("visitId", latestVisitId);
      }
    });
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const centerId = user?.centerId;
    if (centerId) {
      assetsApi.getTypes(centerId).then((typesRes) => {
        const wirelessType = (typesRes.data || []).find((t: any) => t.code === "wireless-set");
        if (!wirelessType) { setWirelessSets([]); return; }
        assetsApi.getAssets(centerId, wirelessType.id).then((assetsRes) => {
          const mapped = (assetsRes.data || []).map((a: any) => ({
            id: a.id,
            itemNumber: a.itemNumber,
            brand: a.brand,
          }));
          setWirelessSets(mapped);
        });
      });
    }
    load();
  }, [setValue]);

  useEffect(() => {
    load();
  }, [filterVisit]);

  const onSubmit = async (data: any) => {
    try {
      const ws = wirelessSets.find(
        (s) => s.id === parseInt(data.wirelessSetId),
      );
      await breakagesApi.create({
        visitId: parseInt(data.visitId),
        wirelessSetId: data.wirelessSetId
          ? parseInt(data.wirelessSetId)
          : undefined,
        itemNumber: data.wirelessSetId
          ? ws?.itemNumber || data.itemNumber
          : data.itemNumber,
        breakageReason: data.breakageReason,
        reportedBy: data.reportedBy,
        remarks: data.remarks,
      });
      toast.success("Breakage reported");
      setShowForm(false);
      reset();
      setValue("visitId", filterVisit);
      load();
    } catch {
      toast.error("Failed to report");
    }
  };

  return (
    <AdminLayout title="Breakage Tracking">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="card">
            <div className="text-3xl font-bold text-red-600">
              {breakages.length}
            </div>
            <div className="text-sm text-gray-600">Total Breakages</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-orange-600">
              {breakages.length > 0
                ? Math.round(breakages.length / (visits.length || 1))
                : 0}
            </div>
            <div className="text-sm text-gray-600">Per Visit Avg</div>
          </div>
          <div className="card col-span-2 md:col-span-1">
            <div className="text-3xl font-bold text-yellow-600">
              {visits.filter((v) => v.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Visits</div>
          </div>
        </div>

        {/* Filter & Add */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterVisit}
            onChange={(e) => setFilterVisit(e.target.value)}
            className="input flex-1 md:w-56"
          >
            <option value="">All Visits</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              reset();
              setValue("visitId", filterVisit);
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Report Breakage
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" /> Report
                Breakage
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="label">Visit *</label>
                  <select
                    {...register("visitId", { required: true })}
                    className="input"
                  >
                    <option value="">Select Visit</option>
                    {visits.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Wireless Set (from inventory)</label>
                  <select {...register("wirelessSetId")} className="input">
                    <option value="">— Select if in inventory —</option>
                    {wirelessSets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.itemNumber} ({s.brand})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    Item Number (manual if not in inventory)
                  </label>
                  <input
                    {...register("itemNumber")}
                    className="input"
                    placeholder="e.g. VT-05"
                  />
                </div>
                <div>
                  <label className="label">Breakage Reason *</label>
                  <textarea
                    {...register("breakageReason", { required: true })}
                    className="input h-16 resize-none"
                    placeholder="Describe the damage..."
                  />
                </div>
                <div>
                  <label className="label">Reported By *</label>
                  <input
                    {...register("reportedBy", { required: true })}
                    className="input"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="label">Remarks</label>
                  <input {...register("remarks")} className="input" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-danger flex-1">
                    Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {breakages.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
              <p>No breakages reported</p>
            </div>
          ) : (
            breakages.map((b) => (
              <div key={b.id} className="card border-l-4 border-red-500 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">
                      {b.itemNumber}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {b.visitName}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete?")) return;
                      await breakagesApi.delete(b.id);
                      toast.success("Deleted");
                      load();
                    }}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="bg-red-50 rounded p-2 border-l-2 border-red-300">
                    <p className="text-red-700 font-medium">Damage:</p>
                    <p className="text-red-600 text-xs mt-1">
                      {b.breakageReason}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reported By:</span>
                    <span className="font-medium">{b.reportedBy}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Date:
                    </span>
                    <span className="text-xs">
                      {new Date(b.reportedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  {b.remarks && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-600">{b.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <tr>
                  {[
                    "Sr.",
                    "Visit",
                    "Item#",
                    "Reason",
                    "Reported By",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-semibold text-red-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      No breakages reported.
                    </td>
                  </tr>
                ) : (
                  breakages.map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-100 hover:bg-red-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 font-medium">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {b.visitName}
                      </td>
                      <td className="px-4 py-3 font-bold text-red-700">
                        {b.itemNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">
                        {b.breakageReason}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.reportedBy}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(b.reportedAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            if (!confirm("Delete?")) return;
                            await breakagesApi.delete(b.id);
                            toast.success("Deleted");
                            load();
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
