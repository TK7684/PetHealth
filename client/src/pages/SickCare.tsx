import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Plus, Trash2, CalendarIcon, Edit, Pill, HeartPulse, Crown, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";

const statusStyles: Record<string, string> = {
  ongoing: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  monitoring: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  recovered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  ongoing: <HeartPulse className="h-4 w-4" />,
  monitoring: <Activity className="h-4 w-4" />,
  recovered: <CheckCircle2 className="h-4 w-4" />,
};

export default function SickCare() {
  const { t, lang } = useI18n();
  const dateLocale = lang === "th" ? th : enUS;

  const statusLabels: Record<string, string> = {
    ongoing: t.sickCare.ongoing,
    monitoring: t.sickCare.monitoring,
    recovered: t.sickCare.recovered,
  };

  const [selectedPetId, setSelectedPetId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const [formData, setFormData] = useState({
    petId: 0,
    startDate: "",
    endDate: "",
    symptoms: "",
    medications: "",
    status: "ongoing",
    notes: "",
  });

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.pets.list.query(),
  });

  const { data: logs, isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ["sickCareLogs", selectedPetId],
    queryFn: () => api.sickCareLogs.list.query({ petId: selectedPetId }),
    enabled: !!selectedPetId,
    retry: false,
  });

  const isForbidden = (logsError as any)?.data?.code === "FORBIDDEN" || (logsError as any)?.message?.includes("FORBIDDEN");

  const createMutation = useMutation({
    mutationFn: (data: any) => api.sickCareLogs.create.mutate(data),
    onSuccess: () => {
      toast.success(t.success.saved);
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.data?.code === "FORBIDDEN") {
        toast.error(t.sickCare.premiumFeatureDescription);
      } else {
        toast.error(`${lang === "th" ? "เพิ่มบันทึกการรักษาไม่สำเร็จ" : "Failed to add record"}: ${error.message}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.sickCareLogs.update.mutate({ logId: id, ...data }),
    onSuccess: () => {
      toast.success(t.success.updated);
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.data?.code === "FORBIDDEN") {
        toast.error(t.sickCare.premiumFeatureDescription);
      } else {
        toast.error(`${lang === "th" ? "อัพเดทบันทึกการรักษาไม่สำเร็จ" : "Failed to update record"}: ${error.message}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (logId: number) => api.sickCareLogs.delete.mutate({ logId }),
    onSuccess: () => {
      toast.success(t.success.deleted);
    },
    onError: (error: any) => {
      if (error.data?.code === "FORBIDDEN") {
        toast.error(t.sickCare.premiumFeatureDescription);
      } else {
        toast.error(`${lang === "th" ? "ลบบันทึกการรักษาไม่สำเร็จ" : "Failed to delete record"}: ${error.message}`);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      petId: selectedPetId,
      startDate: "",
      endDate: "",
      symptoms: "",
      medications: "",
      status: "ongoing",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.petId || !formData.startDate || !formData.symptoms) {
      toast.error(lang === "th" ? "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด" : "Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      petId: formData.petId,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      symptoms: formData.symptoms,
      medications: formData.medications || undefined,
      status: formData.status as "ongoing" | "recovered" | "monitoring",
      notes: formData.notes || undefined,
    });
  };

  const handleEdit = (log: any) => {
    setSelectedLog(log);
    setFormData({
      petId: log.petId,
      startDate: format(new Date(log.startDate), "yyyy-MM-dd"),
      endDate: log.endDate ? format(new Date(log.endDate), "yyyy-MM-dd") : "",
      symptoms: log.symptoms,
      medications: log.medications || "",
      status: log.status,
      notes: log.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    updateMutation.mutate({
      id: selectedLog.id,
      data: {
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        symptoms: formData.symptoms,
        medications: formData.medications || undefined,
        status: formData.status as "ongoing" | "recovered" | "monitoring",
        notes: formData.notes || undefined,
      },
    });
  };

  const handleDelete = (logId: number) => {
    deleteMutation.mutate(logId);
  };

  const filteredLogs = logs?.filter((log) => {
    if (activeTab === "all") return true;
    return log.status === activeTab;
  }) || [];

  // Premium upgrade prompt
  if (isForbidden) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t.sickCare.title}</h1>
          <p className="text-muted-foreground">{lang === "th" ? "จัดการบันทึกการรักษาและติดตามอาการของสัตว์เลี้ยง" : "Manage treatment records and monitor your pet's symptoms"}</p>
        </div>
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-xl">{t.sickCare.premiumFeature}</CardTitle>
            <CardDescription>
              {t.sickCare.premiumFeatureDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/subscription">
              <Button size="lg" className="gap-2">
                <Crown className="h-4 w-4" />
                {t.subscription.upgradeNow}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formFields = (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="startDate" className="text-right">{t.sickCare.startDate}</Label>
        <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="endDate" className="text-right">{t.sickCare.endDate}</Label>
        <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="symptoms" className="text-right pt-2">{t.sickCare.symptoms}</Label>
        <Textarea id="symptoms" value={formData.symptoms} onChange={(e) => setFormData((prev) => ({ ...prev, symptoms: e.target.value }))} className="col-span-3" rows={3} placeholder={lang === "th" ? "อาการที่พบ เช่น ไม่กินอาหาร อ้วก" : "Observed symptoms, e.g. not eating, vomiting"} />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="medications" className="text-right pt-2">{lang === "th" ? "ยาที่ใช้รักษา" : "Medications"}</Label>
        <Textarea id="medications" value={formData.medications} onChange={(e) => setFormData((prev) => ({ ...prev, medications: e.target.value }))} className="col-span-3" rows={2} placeholder={lang === "th" ? "ยาและวิธีการใช้ (ไม่จำเป็น)" : "Medication and dosage (optional)"} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">{t.sickCare.status}</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
          <SelectTrigger className="col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ongoing">{statusLabels.ongoing}</SelectItem>
            <SelectItem value="monitoring">{statusLabels.monitoring}</SelectItem>
            <SelectItem value="recovered">{statusLabels.recovered}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="notes" className="text-right pt-2">{t.common.notes}</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} className="col-span-3" rows={2} placeholder={lang === "th" ? "หมายเหตุเพิ่มเติม (ไม่จำเป็น)" : "Additional notes (optional)"} />
      </div>
    </>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.sickCare.title}</h1>
          <p className="text-muted-foreground">{lang === "th" ? "จัดการบันทึกการรักษาและติดตามอาการของสัตว์เลี้ยง" : "Manage treatment records and monitor your pet's symptoms"}</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.sickCare.addNew}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t.sickCare.title}</DialogTitle>
                <DialogDescription>{lang === "th" ? "บันทึกอาการและข้อมูลการรักษา" : "Record symptoms and treatment information"}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pet" className="text-right">{lang === "th" ? "สัตว์เลี้ยง" : "Pet"}</Label>
                  <Select value={formData.petId.toString() || selectedPetId.toString()} onValueChange={(value) => setFormData((prev) => ({ ...prev, petId: parseInt(value) }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={lang === "th" ? "เลือกสัตว์เลี้ยง" : "Select pet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {pets?.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id.toString()}>{pet.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formFields}
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

      {/* Pet selector */}
      <div className="flex items-center gap-4">
        <Label>{lang === "th" ? "เลือกสัตว์เลี้ยง" : "Select pet"}:</Label>
        {petsLoading ? (
          <Skeleton className="h-9 w-[200px]" />
        ) : (
          <Select value={selectedPetId.toString()} onValueChange={(value) => setSelectedPetId(parseInt(value))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={lang === "th" ? "เลือกสัตว์เลี้ยง" : "Select pet"} />
            </SelectTrigger>
            <SelectContent>
              {pets?.map((pet) => (
                <SelectItem key={pet.id} value={pet.id.toString()}>{pet.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedPetId > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">{t.common.all}</TabsTrigger>
            <TabsTrigger value="ongoing">{t.sickCare.ongoing}</TabsTrigger>
            <TabsTrigger value="monitoring">{t.sickCare.monitoring}</TabsTrigger>
            <TabsTrigger value="recovered">{t.sickCare.recovered}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {logsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredLogs.map((log) => (
                  <Card key={log.id} className="relative">
                    <div className="absolute top-2 right-2">
                      <Badge className={`${statusStyles[log.status] || ""} flex items-center gap-1`}>
                        {statusIcons[log.status]}
                        {statusLabels[log.status]}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {log.symptoms.length > 60 ? log.symptoms.substring(0, 60) + "..." : log.symptoms}
                      </CardTitle>
                      <CardDescription>
                        {pets?.find((pet) => pet.id === log.petId)?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{t.sickCare.startDate}: {format(new Date(log.startDate), "d MMMM yyyy", { locale: dateLocale })}</span>
                        </div>
                        {log.endDate && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{t.sickCare.recovered}: {format(new Date(log.endDate), "d MMMM yyyy", { locale: dateLocale })}</span>
                          </div>
                        )}
                        {log.medications && (
                          <div className="text-sm">
                            <span className="font-medium flex items-center gap-1">
                              <Pill className="h-4 w-4" />
                              {lang === "th" ? "ยาที่ใช้รักษา" : "Medications"}:
                            </span>{" "}
                            {log.medications}
                          </div>
                        )}
                        {log.notes && (
                          <div className="text-sm">
                            <span className="font-medium">{t.common.notes}:</span> {log.notes}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.startDate), { addSuffix: true, locale: dateLocale })}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(log)}>
                          <Edit className="h-4 w-4 mr-1" />
                          {t.common.edit}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              {t.common.delete}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{lang === "th" ? "ยืนยันการลบ" : "Confirm Delete"}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {lang === "th" ? "คุณแน่ใจหรือไม่ที่จะลบบันทึกการรักษานี้? การกระทำนี้ไม่สามารถย้อนกลับได้" : "Are you sure you want to delete this record? This action cannot be undone."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(log.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {t.common.delete}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>{t.common.noData}</CardTitle>
                  <CardDescription>
                    {activeTab === "all"
                      ? (lang === "th" ? `ยังไม่มีบันทึกการดูแลเจ็บป่วย คลิกปุ่ม "${t.sickCare.addNew}" เพื่อเริ่มต้น` : `No sick care records yet. Click "${t.sickCare.addNew}" to get started.`)
                      : `${lang === "th" ? "ไม่มีบันทึกที่มีสถานะ" : "No records with status"} "${statusLabels[activeTab] || activeTab}"`}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t.sickCare.editLog}</DialogTitle>
              <DialogDescription>{lang === "th" ? "แก้ไขข้อมูลอาการและการรักษา" : "Edit symptoms and treatment details"}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">{formFields}</div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t.common.loading : t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
