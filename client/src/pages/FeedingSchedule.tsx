import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Clock, Edit, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function FeedingSchedule() {
  const { t, lang } = useI18n();

  const frequencyLabels: Record<string, string> = {
    daily: lang === "th" ? "ทุกวัน" : "Daily",
    "twice daily": lang === "th" ? "วันละ 2 ครั้ง" : "Twice daily",
    "three times daily": lang === "th" ? "วันละ 3 ครั้ง" : "Three times daily",
    weekly: lang === "th" ? "ทุกสัปดาห์" : "Weekly",
    custom: lang === "th" ? "กำหนดเอง" : "Custom",
  };

  const [selectedPetId, setSelectedPetId] = useState<number>(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const [formData, setFormData] = useState({
    petId: 0,
    foodType: "",
    amount: "",
    frequency: "daily",
    time: "",
    notes: "",
  });

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.pets.list.query(),
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["feedingSchedules", selectedPetId],
    queryFn: () => api.feedingSchedules.list.query({ petId: selectedPetId }),
    enabled: !!selectedPetId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.feedingSchedules.create.mutate(data),
    onSuccess: () => {
      toast.success(t.success.saved);
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "เพิ่มตารางให้อาหารไม่สำเร็จ" : "Failed to add schedule"}: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.feedingSchedules.update.mutate({ scheduleId: id, ...data }),
    onSuccess: () => {
      toast.success(t.success.updated);
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "อัพเดทตารางให้อาหารไม่สำเร็จ" : "Failed to update schedule"}: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: number) => api.feedingSchedules.delete.mutate({ scheduleId }),
    onSuccess: () => {
      toast.success(t.success.deleted);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "ลบตารางให้อาหารไม่สำเร็จ" : "Failed to delete schedule"}: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      petId: selectedPetId,
      foodType: "",
      amount: "",
      frequency: "daily",
      time: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.petId || !formData.foodType || !formData.amount) {
      toast.error(lang === "th" ? "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด" : "Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      petId: formData.petId,
      foodType: formData.foodType,
      amount: formData.amount,
      frequency: formData.frequency,
      time: formData.time || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleEdit = (schedule: any) => {
    setSelectedSchedule(schedule);
    setFormData({
      petId: schedule.petId,
      foodType: schedule.foodType,
      amount: schedule.amount,
      frequency: schedule.frequency,
      time: schedule.time || "",
      notes: schedule.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    updateMutation.mutate({
      id: selectedSchedule.id,
      data: {
        foodType: formData.foodType,
        amount: formData.amount,
        frequency: formData.frequency,
        time: formData.time || undefined,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleDelete = (scheduleId: number) => {
    deleteMutation.mutate(scheduleId);
  };

  const formFields = (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="foodType" className="text-right">{t.feedingSchedule.foodType}</Label>
        <Input id="foodType" value={formData.foodType} onChange={(e) => setFormData((prev) => ({ ...prev, foodType: e.target.value }))} className="col-span-3" placeholder={lang === "th" ? "เช่น อาหารเม็ด อาหารเปียก" : "e.g. Dry food, Wet food"} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="amount" className="text-right">{t.feedingSchedule.amount}</Label>
        <Input id="amount" value={formData.amount} onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))} className="col-span-3" placeholder={lang === "th" ? "เช่น 100 กรัม 1 ถ้วย" : "e.g. 100g, 1 cup"} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="frequency" className="text-right">{t.feedingSchedule.frequency}</Label>
        <Select value={formData.frequency} onValueChange={(value) => setFormData((prev) => ({ ...prev, frequency: value }))}>
          <SelectTrigger className="col-span-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(frequencyLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="time" className="text-right">{t.feedingSchedule.time}</Label>
        <Input id="time" type="time" value={formData.time} onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="notes" className="text-right">{t.common.notes}</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} className="col-span-3" rows={2} placeholder={lang === "th" ? "หมายเหตุเพิ่มเติม (ไม่จำเป็น)" : "Additional notes (optional)"} />
      </div>
    </>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.feedingSchedule.title}</h1>
          <p className="text-muted-foreground">{lang === "th" ? "จัดการตารางและข้อมูลการให้อาหารสัตว์เลี้ยง" : "Manage feeding schedules and information"}</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.feedingSchedule.addNew}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t.feedingSchedule.title}</DialogTitle>
                <DialogDescription>{lang === "th" ? "ตั้งค่าตารางให้อาหารสำหรับสัตว์เลี้ยง" : "Set up a feeding schedule for your pet"}</DialogDescription>
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
        <>
          {schedulesLoading ? (
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
          ) : schedules && schedules.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule) => (
                <Card key={schedule.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        {schedule.foodType}
                      </CardTitle>
                      <Badge variant="outline">{frequencyLabels[schedule.frequency] || schedule.frequency}</Badge>
                    </div>
                    <CardDescription>{t.feedingSchedule.amount}: {schedule.amount}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {schedule.time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{t.feedingSchedule.time}: {schedule.time}</span>
                        </div>
                      )}
                      {schedule.notes && (
                        <div className="text-sm">
                          <span className="font-medium">{t.common.notes}:</span> {schedule.notes}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)}>
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
                              {lang === "th" ? "คุณแน่ใจหรือไม่ที่จะลบตารางให้อาหารนี้? การกระทำนี้ไม่สามารถย้อนกลับได้" : "Are you sure you want to delete this schedule? This action cannot be undone."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(schedule.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                  {lang === "th" ? `ยังไม่มีตารางให้อาหารที่บันทึก คลิกปุ่ม "${t.feedingSchedule.addNew}" เพื่อเริ่มต้น` : `No schedules yet. Click "${t.feedingSchedule.addNew}" to get started.`}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      )}

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t.feedingSchedule.editSchedule}</DialogTitle>
              <DialogDescription>{lang === "th" ? "แก้ไขข้อมูลตารางให้อาหาร" : "Edit feeding schedule details"}</DialogDescription>
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
