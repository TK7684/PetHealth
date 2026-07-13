import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarIcon, FileText, Paperclip, Plus, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/contexts/I18nContext";

const recordTypeColors: Record<string, string> = {
  checkup: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  vaccination: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  lab: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  surgery: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  emergency: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function HealthRecords() {
  const { t, lang } = useI18n();
  const dateLocale = lang === "th" ? th : enUS;

  const recordTypeLabels: Record<string, string> = {
    checkup: lang === "th" ? "ตรวจสุขภาพ" : "Checkup",
    vaccination: lang === "th" ? "การฉีดวัคซีน" : "Vaccination",
    lab: lang === "th" ? "ผลแล็บ/เลือด" : "Lab/Blood Test",
    surgery: t.healthRecords.surgery,
    emergency: t.healthRecords.emergency,
    other: t.healthRecords.other,
  };

  const [selectedPetId, setSelectedPetId] = useState<number>(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    recordType: "checkup",
    date: "",
    notes: "",
  });

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.pets.list.query(),
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ["healthRecords", selectedPetId],
    queryFn: () => api.healthRecords.list.query({ petId: selectedPetId }),
    enabled: selectedPetId > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.healthRecords.create.mutate({
        petId: selectedPetId,
        ...data,
      }),
    onSuccess: () => {
      toast.success(t.success.saved);
      setAddDialogOpen(false);
      setFormData({
        recordType: "checkup",
        date: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "เพิ่มบันทึกไม่สำเร็จ" : "Failed to add record"}: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: number) =>
      api.healthRecords.delete.mutate({ recordId }),
    onSuccess: () => {
      toast.success(t.success.deleted);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "ลบบันทึกไม่สำเร็จ" : "Failed to delete record"}: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPetId || !formData.date || !formData.recordType) {
      toast.error(lang === "th" ? "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด" : "Please fill in all required fields");
      return;
    }

    createMutation.mutate(formData);
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

  const sortedRecords = [...(records || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.healthRecords.title}</h1>
          <p className="text-muted-foreground">{lang === "th" ? "ติดตามประวัติการรักษาและสุขภาพของสัตว์เลี้ยง" : "Track your pet's medical history and health"}</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={selectedPetId === 0}>
              <Plus className="mr-2 h-4 w-4" />
              {t.healthRecords.addNew}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t.healthRecords.addNew}</DialogTitle>
                <DialogDescription>
                  {lang === "th" ? "บันทึกข้อมูลสุขภาพเพื่อติดตามประวัติการรักษา" : "Record health information to track medical history"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recordType" className="text-right">
                    {t.healthRecords.recordType}
                  </Label>
                  <Select
                    value={formData.recordType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, recordType: value }))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(recordTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    {t.common.notes}
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="col-span-3"
                    rows={3}
                    placeholder={lang === "th" ? "รายละเอียดเพิ่มเติม เช่น อาการ, การวินิจฉัย, การรักษา..." : "Additional details, e.g. symptoms, diagnosis, treatment..."}
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

      {/* Timeline */}
      {selectedPetId === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{lang === "th" ? "เลือกสัตว์เลี้ยง" : "Select a pet"}</CardTitle>
            <CardDescription>
              {lang === "th" ? "กรุณาเลือกสัตว์เลี้ยงจากเมนูด้านบนเพื่อดูบันทึกสุขภาพ" : "Please select a pet from the menu above to view health records"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : recordsLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex-1">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      ) : sortedRecords.length > 0 ? (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[90px] top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {sortedRecords.map((record, index) => (
              <div key={record.id} className="flex gap-4 relative">
                {/* Timeline dot */}
                <div className="flex flex-col items-center w-[90px] shrink-0 pt-4">
                  <div className="absolute left-[86px] top-6 h-3 w-3 rounded-full bg-primary border-2 border-background z-10" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {format(new Date(record.date), "d MMMM yyyy", { locale: dateLocale })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(record.date), { addSuffix: true, locale: dateLocale })}
                  </span>
                </div>

                {/* Record card */}
                <Card className="flex-1">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {recordTypeLabels[record.recordType] || record.recordType}
                        <Badge
                          className={recordTypeColors[record.recordType] || recordTypeColors.other}
                        >
                          {recordTypeLabels[record.recordType] || record.recordType}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {record.attachmentUrl && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Paperclip className="h-4 w-4" />
                            <span>{lang === "th" ? "มีไฟล์แนบ" : "Has attachment"}</span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {record.notes && (
                    <CardContent>
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-muted-foreground whitespace-pre-wrap">{record.notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {lang === "th" ? "ไม่มีบันทึกสุขภาพ" : "No health records"}
            </CardTitle>
            <CardDescription>
              {lang === "th" ? `ยังไม่มีบันทึกสุขภาพสำหรับสัตว์เลี้ยงตัวนี้ คลิกปุ่ม "${t.healthRecords.addNew}" เพื่อเริ่มต้น` : `No health records for this pet yet. Click "${t.healthRecords.addNew}" to get started`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "th" ? "ยืนยันการลบบันทึกสุขภาพ" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {lang === "th" ? "คุณแน่ใจหรือไม่ที่จะลบบันทึกสุขภาพนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้" : "Are you sure you want to delete this health record? This action cannot be undone."}
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
