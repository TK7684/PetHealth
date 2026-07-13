import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { CalendarIcon, Clock, Edit, Plus, Trash2, AlertCircle, Bell, BellOff } from "lucide-react";
import { format, formatDistanceToNow, isAfter, addDays } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/contexts/I18nContext";

export default function Vaccinations() {
  const { t, lang } = useI18n();
  const dateLocale = lang === "th" ? th : enUS;

  const [selectedPetId, setSelectedPetId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [selectedVaccination, setSelectedVaccination] = useState<any>(null);

  const [formData, setFormData] = useState({
    vaccineName: "",
    lastDate: "",
    nextDate: "",
    reminderEnabled: true,
    notes: "",
  });

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.pets.list.query(),
  });

  const { data: vaccinations, isLoading: vaccinationsLoading } = useQuery({
    queryKey: ["vaccinations", selectedPetId],
    queryFn: () => api.vaccinations.list.query({ petId: selectedPetId }),
    enabled: selectedPetId > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.vaccinations.create.mutate({
        petId: selectedPetId,
        ...data,
      }),
    onSuccess: () => {
      toast.success(t.success.saved);
      setAddDialogOpen(false);
      setFormData({
        vaccineName: "",
        lastDate: "",
        nextDate: "",
        reminderEnabled: true,
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "เพิ่มบันทึกวัคซีนไม่สำเร็จ" : "Failed to add vaccination"}: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.vaccinations.update.mutate({ vaccinationId: id, ...data }),
    onSuccess: () => {
      toast.success(t.success.updated);
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "อัพเดทข้อมูลวัคซีนไม่สำเร็จ" : "Failed to update vaccination"}: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (vaccinationId: number) =>
      api.vaccinations.delete.mutate({ vaccinationId }),
    onSuccess: () => {
      toast.success(t.success.deleted);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "ลบบันทึกวัคซีนไม่สำเร็จ" : "Failed to delete vaccination"}: ${error.message}`);
    },
  });

  const isOverdue = (nextDate: string | null) => {
    if (!nextDate) return false;
    return !isAfter(new Date(nextDate), new Date());
  };

  const isDueSoon = (nextDate: string | null) => {
    if (!nextDate) return false;
    const now = new Date();
    const next = new Date(nextDate);
    const thirtyDaysFromNow = addDays(now, 30);
    return isAfter(next, now) && !isAfter(next, thirtyDaysFromNow);
  };

  const getStatusBadge = (record: any) => {
    if (!record.nextDate) {
      return <Badge variant="secondary">{lang === "th" ? "ไม่มีกำหนดถัดไป" : "No due date"}</Badge>;
    }
    if (isOverdue(record.nextDate)) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {t.vaccinations.overdue}
        </Badge>
      );
    }
    if (isDueSoon(record.nextDate)) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{lang === "th" ? "ใกล้ครบกำหนด" : "Due soon"}</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{lang === "th" ? "ใช้งานได้" : "Active"}</Badge>;
  };

  const filteredVaccinations = useMemo(() => {
    if (!vaccinations) return [];
    switch (activeTab) {
      case "dueSoon":
        return vaccinations.filter((v) => isDueSoon(v.nextDate));
      case "overdue":
        return vaccinations.filter((v) => isOverdue(v.nextDate));
      default:
        return vaccinations;
    }
  }, [vaccinations, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId || !formData.vaccineName || !formData.lastDate) {
      toast.error(lang === "th" ? "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด" : "Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (vaccination: any) => {
    setSelectedVaccination(vaccination);
    setFormData({
      vaccineName: vaccination.vaccineName,
      lastDate: format(new Date(vaccination.lastDate), "yyyy-MM-dd"),
      nextDate: vaccination.nextDate ? format(new Date(vaccination.nextDate), "yyyy-MM-dd") : "",
      reminderEnabled: Boolean(vaccination.reminderEnabled),
      notes: vaccination.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaccination) return;
    updateMutation.mutate({
      id: selectedVaccination.id,
      data: formData,
    });
  };

  const handleDelete = (vaccinationId: number) => {
    setDeleteTarget(vaccinationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      deleteMutation.mutate(deleteTarget);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.vaccinations.title}</h1>
          <p className="text-muted-foreground">{lang === "th" ? "ติดตามตารางการฉีดวัคซีนและแจ้งเตือน" : "Track vaccination schedule and reminders"}</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={selectedPetId === 0}>
              <Plus className="mr-2 h-4 w-4" />
              {t.vaccinations.addNew}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t.vaccinations.addNew}</DialogTitle>
                <DialogDescription>
                  {lang === "th" ? "บันทึกข้อมูลการฉีดวัคซีนเพื่อติดตามและแจ้งเตือน" : "Record vaccination information for tracking and reminders"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vaccineName" className="text-right">
                    {t.vaccinations.vaccineName}
                  </Label>
                  <Input
                    id="vaccineName"
                    value={formData.vaccineName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, vaccineName: e.target.value }))
                    }
                    className="col-span-3"
                    placeholder={lang === "th" ? "เช่น วัคซีนรักษ์โรคพาร์โว" : "e.g. Parvovirus vaccine"}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastDate" className="text-right">
                    {t.vaccinations.lastDate}
                  </Label>
                  <Input
                    id="lastDate"
                    type="date"
                    value={formData.lastDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lastDate: e.target.value }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nextDate" className="text-right">
                    {t.vaccinations.nextDate}
                  </Label>
                  <Input
                    id="nextDate"
                    type="date"
                    value={formData.nextDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nextDate: e.target.value }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reminderEnabled" className="text-right">
                    {t.vaccinations.reminderEnabled}
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="reminderEnabled"
                      checked={formData.reminderEnabled}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, reminderEnabled: checked }))
                      }
                    />
                    <Label htmlFor="reminderEnabled">{lang === "th" ? "รับการแจ้งเตือนก่อนวันครบกำหนด" : "Receive reminder before due date"}</Label>
                  </div>
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
                    placeholder={lang === "th" ? "รายละเอียดเพิ่มเติม" : "Additional details"}
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

      {/* Tabs & Content */}
      {selectedPetId === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{lang === "th" ? "เลือกสัตว์เลี้ยง" : "Select a pet"}</CardTitle>
            <CardDescription>
              {lang === "th" ? "กรุณาเลือกสัตว์เลี้ยงจากเมนูด้านบนเพื่อดูบันทึกวัคซีน" : "Please select a pet from the menu above to view vaccinations"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{t.common.all}</TabsTrigger>
              <TabsTrigger value="dueSoon">{lang === "th" ? "ใกล้ครบกำหนด" : "Due Soon"}</TabsTrigger>
              <TabsTrigger value="overdue">{t.vaccinations.overdue}</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {vaccinationsLoading ? (
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
              ) : filteredVaccinations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredVaccinations.map((vacc) => (
                    <Card
                      key={vacc.id}
                      className={`relative ${isOverdue(vacc.nextDate) ? "border-red-300 dark:border-red-800" : ""}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{vacc.vaccineName}</CardTitle>
                          {getStatusBadge(vacc)}
                        </div>
                        <CardDescription>
                          {getStatusBadge(vacc).props.children}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {lang === "th" ? "ฉีดล่าสุด" : "Last given"}:{" "}
                              {format(new Date(vacc.lastDate), "d MMMM yyyy", { locale: dateLocale })}
                            </span>
                          </div>
                          {vacc.nextDate && (
                            <div
                              className={`flex items-center gap-2 text-sm ${
                                isOverdue(vacc.nextDate) ? "text-red-600" : ""
                              }`}
                            >
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {lang === "th" ? "ครบกำหนด" : "Due"}:{" "}
                                {format(new Date(vacc.nextDate), "d MMMM yyyy", { locale: dateLocale })}
                                {isOverdue(vacc.nextDate) && (
                                  <span className="ml-1">
                                    (
                                    {formatDistanceToNow(new Date(vacc.nextDate), {
                                      addSuffix: true,
                                      locale: dateLocale,
                                    })}
                                    )
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            {vacc.reminderEnabled ? (
                              <Bell className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <BellOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>
                              {vacc.reminderEnabled ? (lang === "th" ? "เปิดแจ้งเตือน" : "Reminders on") : (lang === "th" ? "ปิดแจ้งเตือน" : "Reminders off")}
                            </span>
                          </div>
                          {vacc.notes && (
                            <div className="text-sm">
                              <span className="font-medium">{t.common.notes}:</span> {vacc.notes}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vacc)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t.common.edit}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(vacc.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t.common.delete}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {activeTab === "all"
                        ? (lang === "th" ? "ไม่มีบันทึกวัคซีน" : "No vaccinations")
                        : activeTab === "dueSoon"
                          ? (lang === "th" ? "ไม่มีวัคซีนที่ใกล้ครบกำหนด" : "No vaccines due soon")
                          : (lang === "th" ? "ไม่มีวัคซีนที่หมดอายุ" : "No overdue vaccines")}
                    </CardTitle>
                    <CardDescription>
                      {activeTab === "all"
                        ? (lang === "th" ? `ยังไม่มีบันทึกวัคซีนสำหรับสัตว์เลี้ยงตัวนี้ คลิกปุ่ม "${t.vaccinations.addNew}" เพื่อเริ่มต้น` : `No vaccinations for this pet yet. Click "${t.vaccinations.addNew}" to get started`)
                        : activeTab === "dueSoon"
                          ? (lang === "th" ? "ไม่มีวัคซีนที่จะครบกำหนดใน 30 วันนี้" : "No vaccines due in the next 30 days")
                          : (lang === "th" ? "ยินดีด้วย! ไม่มีวัคซีนที่หมดอายุ" : "Great! No overdue vaccines")}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t.vaccinations.editVaccination}</DialogTitle>
              <DialogDescription>
                {lang === "th" ? "แก้ไขข้อมูลการฉีดวัคซีน" : "Edit vaccination information"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-vaccineName" className="text-right">
                  {t.vaccinations.vaccineName}
                </Label>
                <Input
                  id="edit-vaccineName"
                  value={formData.vaccineName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vaccineName: e.target.value }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lastDate" className="text-right">
                  {t.vaccinations.lastDate}
                </Label>
                <Input
                  id="edit-lastDate"
                  type="date"
                  value={formData.lastDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastDate: e.target.value }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nextDate" className="text-right">
                  {t.vaccinations.nextDate}
                </Label>
                <Input
                  id="edit-nextDate"
                  type="date"
                  value={formData.nextDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nextDate: e.target.value }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-reminderEnabled" className="text-right">
                  {t.vaccinations.reminderEnabled}
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="edit-reminderEnabled"
                    checked={formData.reminderEnabled}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, reminderEnabled: checked }))
                    }
                  />
                  <Label htmlFor="edit-reminderEnabled">{lang === "th" ? "รับการแจ้งเตือนก่อนวันครบกำหนด" : "Receive reminder before due date"}</Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  {t.common.notes}
                </Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t.common.loading : (lang === "th" ? "บันทึกการแก้ไข" : "Save Changes")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "th" ? "ยืนยันการลบบันทึกวัคซีน" : "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {lang === "th" ? "คุณแน่ใจหรือไม่ที่จะลบบันทึกวัคซีนนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้" : "Are you sure you want to delete this vaccination? This action cannot be undone."}
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
