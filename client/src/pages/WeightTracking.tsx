import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { CalendarIcon, Plus, Trash2, TrendingUp, TrendingDown, Minus, Weight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/contexts/I18nContext";

export default function WeightTracking() {
  const { t, lang } = useI18n();
  const dateLocale = lang === "th" ? th : enUS;

  const [selectedPetId, setSelectedPetId] = useState<number>(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    weight: "",
    unit: "kg",
  });

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.pets.list.query(),
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ["weightRecords", selectedPetId],
    queryFn: () => api.weightRecords.list.query({ petId: selectedPetId }),
    enabled: selectedPetId > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.weightRecords.create.mutate({
        petId: selectedPetId,
        ...data,
      }),
    onSuccess: () => {
      toast.success(t.success.saved);
      setAddDialogOpen(false);
      setFormData({
        date: "",
        weight: "",
        unit: "kg",
      });
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "เพิ่มบันทึกน้ำหนักไม่สำเร็จ" : "Failed to add weight record"}: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: number) =>
      api.weightRecords.delete.mutate({ recordId }),
    onSuccess: () => {
      toast.success(t.success.deleted);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "ลบบันทึกน้ำหนักไม่สำเร็จ" : "Failed to delete weight record"}: ${error.message}`);
    },
  });

  const sortedRecords = useMemo(() => {
    if (!records) return [];
    return [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [records]);

  const stats = useMemo(() => {
    if (!sortedRecords || sortedRecords.length === 0) {
      return { latest: null, average: null, total: 0, trend: "stable" as const, trendDiff: 0 };
    }

    const latest = sortedRecords[0];
    const average =
      sortedRecords.reduce((sum, r) => sum + r.weight, 0) / sortedRecords.length;
    const total = sortedRecords.length;

    let trend: "up" | "down" | "stable" = "stable";
    let trendDiff = 0;

    if (sortedRecords.length >= 2) {
      const prev = sortedRecords[1];
      trendDiff = latest.weight - prev.weight;
      if (trendDiff > 0.05) trend = "up";
      else if (trendDiff < -0.05) trend = "down";
    }

    return {
      latest: { weight: latest.weight, unit: latest.unit || "kg" },
      average: Number(average.toFixed(2)),
      total,
      trend,
      trendDiff: Number(trendDiff.toFixed(2)),
    };
  }, [sortedRecords]);

  const getChangeFromPrevious = (currentIndex: number) => {
    const current = sortedRecords[currentIndex];
    if (currentIndex + 1 >= sortedRecords.length) return null;
    const previous = sortedRecords[currentIndex + 1];
    const diff = current.weight - previous.weight;
    return Number(diff.toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId || !formData.date || !formData.weight) {
      toast.error(lang === "th" ? "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด" : "Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      date: formData.date,
      weight: parseFloat(formData.weight),
      unit: formData.unit,
    });
  };

  const handleDelete = (recordId: number) => {
    setDeleteTarget(recordId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      deleteMutation.mutate(deleteTarget);
    }
  };

  const TrendIcon = () => {
    switch (stats.trend) {
      case "up":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "down":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const TrendLabel = () => {
    switch (stats.trend) {
      case "up":
        return <span className="text-green-500">{lang === "th" ? "เพิ่มขึ้น" : "Increasing"}</span>;
      case "down":
        return <span className="text-red-500">{lang === "th" ? "ลดลง" : "Decreasing"}</span>;
      default:
        return <span className="text-muted-foreground">{lang === "th" ? "คงที่" : "Stable"}</span>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.weightTracking.title}</h1>
          <p className="text-muted-foreground">{lang === "th" ? "บันทึกและติดตามน้ำหนักของสัตว์เลี้ยง" : "Record and track your pet's weight"}</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={selectedPetId === 0}>
              <Plus className="mr-2 h-4 w-4" />
              {t.weightTracking.addNew}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t.weightTracking.addNew}</DialogTitle>
                <DialogDescription>
                  {lang === "th" ? "บันทึกน้ำหนักล่าสุดของสัตว์เลี้ยงเพื่อติดตาม" : "Record your pet's latest weight for tracking"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="weight" className="text-right">
                    {t.weightTracking.weight}
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, weight: e.target.value }))
                      }
                      placeholder={lang === "th" ? "เช่น 5.2" : "e.g. 5.2"}
                      className="flex-1"
                    />
                    <Select
                      value={formData.unit}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, unit: value }))
                      }
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    {t.common.date}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? t.common.loading : t.common.save}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pet Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="font-medium whitespace-nowrap">{lang === "th" ? "เลือกสัตว์เลี้ยง:" : "Select pet:"}</Label>
            {petsLoading ? (
              <Skeleton className="h-10 w-60" />
            ) : (
              <Select
                value={selectedPetId.toString()}
                onValueChange={(value) => setSelectedPetId(parseInt(value))}
              >
                <SelectTrigger className="w-60">
                  <SelectValue placeholder={lang === "th" ? "เลือกสัตว์เลี้ยง" : "Select a pet"} />
                </SelectTrigger>
                <SelectContent>
                  {pets?.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id.toString()}>
                      {pet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {selectedPetId === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{lang === "th" ? "เลือกสัตว์เลี้ยง" : "Select a pet"}</CardTitle>
            <CardDescription>
              {lang === "th" ? "กรุณาเลือกสัตว์เลี้ยงจากเมนูด้านบนเพื่อดูข้อมูลน้ำหนัก" : "Please select a pet from the menu above to view weight data"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : recordsLoading ? (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : sortedRecords.length > 0 ? (
        <>
          {/* Stats Summary */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Weight className="h-4 w-4" />
                  {lang === "th" ? "น้ำหนักล่าสุด" : "Latest Weight"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats.latest?.weight} {stats.latest?.unit}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{lang === "th" ? "น้ำหนักเฉลี่ย" : "Average Weight"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats.average} {stats.latest?.unit}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{lang === "th" ? "จำนวนบันทึก" : "Total Records"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total} {lang === "th" ? "ครั้ง" : "records"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{lang === "th" ? "แนวโน้ม" : "Trend"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendIcon />
                  <div>
                    <TrendLabel />
                    {stats.trendDiff !== 0 && (
                      <p className="text-sm text-muted-foreground">
                        {stats.trendDiff > 0 ? "+" : ""}
                        {stats.trendDiff} {stats.latest?.unit}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weight Records Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedRecords.map((record, index) => {
              const change = getChangeFromPrevious(index);
              return (
                <Card key={record.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {record.weight} {record.unit || "kg"}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {format(new Date(record.date), "d MMMM yyyy", { locale: dateLocale })}
                      <span className="ml-2">
                        ({formatDistanceToNow(new Date(record.date), { addSuffix: true, locale: dateLocale })})
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {change !== null && (
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          change > 0
                            ? "text-green-600"
                            : change < 0
                              ? "text-red-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {change > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : change < 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                        <span>
                          {change > 0 ? "+" : ""}
                          {change} {record.unit || "kg"} {lang === "th" ? "จากครั้งก่อน" : "from previous"}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Weight className="h-5 w-5" />
              {lang === "th" ? "ไม่มีบันทึกน้ำหนัก" : "No weight records"}
            </CardTitle>
            <CardDescription>
              {lang === "th" ? `ยังไม่มีบันทึกน้ำหนักสำหรับสัตว์เลี้ยงตัวนี้ คลิกปุ่ม "${t.weightTracking.addNew}" เพื่อเริ่มต้น` : `No weight records for this pet yet. Click "${t.weightTracking.addNew}" to get started`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "th" ? "ยืนยันการลบบันทึกน้ำหนัก" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {lang === "th" ? "คุณแน่ใจหรือไม่ที่จะลบบันทึกน้ำหนักนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้" : "Are you sure you want to delete this weight record? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (lang === "th" ? "กำลังลบ..." : "Deleting...") : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
