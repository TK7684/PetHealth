import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Plus, Trash2, CalendarIcon, Edit, Pill, HeartPulse, Crown, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
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

const statusLabels: Record<string, string> = {
  ongoing: "กำลังรักษา",
  monitoring: "กำลังเฝ้าระวัง",
  recovered: "หายดีแล้ว",
};

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
      toast.success("เพิ่มบันทึกการรักษาสำเร็จแล้ว");
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.data?.code === "FORBIDDEN") {
        toast.error("ฟีเจอร์นี้สำหรับผู้ใช้ Premium เท่านั้น");
      } else {
        toast.error(`เพิ่มบันทึกการรักษาไม่สำเร็จ: ${error.message}`);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.sickCareLogs.update.mutate({ logId: id, ...data }),
    onSuccess: () => {
      toast.success("อัพเดทบันทึกการรักษาสำเร็จแล้ว");
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.data?.code === "FORBIDDEN") {
        toast.error("ฟีเจอร์นี้สำหรับผู้ใช้ Premium เท่านั้น");
      } else {
        toast.error(`อัพเดทบันทึกการรักษาไม่สำเร็จ: ${error.message}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (logId: number) => api.sickCareLogs.delete.mutate({ logId }),
    onSuccess: () => {
      toast.success("ลบบันทึกการรักษาสำเร็จแล้ว");
    },
    onError: (error: any) => {
      if (error.data?.code === "FORBIDDEN") {
        toast.error("ฟีเจอร์นี้สำหรับผู้ใช้ Premium เท่านั้น");
      } else {
        toast.error(`ลบบันทึกการรักษาไม่สำเร็จ: ${error.message}`);
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
      toast.error("กรุณากรอกข้อมูลที่จำเป็นทั้งหมด");
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
          <h1 className="text-3xl font-bold">บันทึกการดูแลเจ็บป่วย</h1>
          <p className="text-muted-foreground">จัดการบันทึกการรักษาและติดตามอาการของสัตว์เลี้ยง</p>
        </div>
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-xl">ฟีเจอร์สำหรับผู้ใช้ Premium</CardTitle>
            <CardDescription>
              การจัดการบันทึกการดูแลเจ็บป่วยเป็นฟีเจอร์พิเศษสำหรับผู้ใช้ Premium เท่านั้น
              อัปเกรดเพื่อเข้าถึงฟีเจอร์นี้และอีกมาก
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/subscription">
              <Button size="lg" className="gap-2">
                <Crown className="h-4 w-4" />
                อัปเกรดเป็น Premium
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
        <Label htmlFor="startDate" className="text-right">วันที่เริ่มป่วย</Label>
        <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="endDate" className="text-right">วันที่หาย</Label>
        <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="symptoms" className="text-right pt-2">อาการ</Label>
        <Textarea id="symptoms" value={formData.symptoms} onChange={(e) => setFormData((prev) => ({ ...prev, symptoms: e.target.value }))} className="col-span-3" rows={3} placeholder="อาการที่พบ เช่น ไม่กินอาหาร อ้วก" />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="medications" className="text-right pt-2">ยาที่ใช้รักษา</Label>
        <Textarea id="medications" value={formData.medications} onChange={(e) => setFormData((prev) => ({ ...prev, medications: e.target.value }))} className="col-span-3" rows={2} placeholder="ยาและวิธีการใช้ (ไม่จำเป็น)" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">สถานะ</Label>
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
        <Label htmlFor="notes" className="text-right pt-2">หมายเหตุ</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} className="col-span-3" rows={2} placeholder="หมายเหตุเพิ่มเติม (ไม่จำเป็น)" />
      </div>
    </>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">บันทึกการดูแลเจ็บป่วย</h1>
          <p className="text-muted-foreground">จัดการบันทึกการรักษาและติดตามอาการของสัตว์เลี้ยง</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มบันทึก
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>เพิ่มบันทึกการดูแลเจ็บป่วย</DialogTitle>
                <DialogDescription>บันทึกอาการและข้อมูลการรักษา</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pet" className="text-right">สัตว์เลี้ยง</Label>
                  <Select value={formData.petId.toString() || selectedPetId.toString()} onValueChange={(value) => setFormData((prev) => ({ ...prev, petId: parseInt(value) }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="เลือกสัตว์เลี้ยง" />
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
                  {createMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pet selector */}
      <div className="flex items-center gap-4">
        <Label>เลือกสัตว์เลี้ยง:</Label>
        {petsLoading ? (
          <Skeleton className="h-9 w-[200px]" />
        ) : (
          <Select value={selectedPetId.toString()} onValueChange={(value) => setSelectedPetId(parseInt(value))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="เลือกสัตว์เลี้ยง" />
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
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="ongoing">กำลังรักษา</TabsTrigger>
            <TabsTrigger value="monitoring">กำลังเฝ้าระวัง</TabsTrigger>
            <TabsTrigger value="recovered">หายดีแล้ว</TabsTrigger>
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
                          <span>เริ่มป่วย: {format(new Date(log.startDate), "d MMMM yyyy", { locale: th })}</span>
                        </div>
                        {log.endDate && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>หายดี: {format(new Date(log.endDate), "d MMMM yyyy", { locale: th })}</span>
                          </div>
                        )}
                        {log.medications && (
                          <div className="text-sm">
                            <span className="font-medium flex items-center gap-1">
                              <Pill className="h-4 w-4" />
                              ยาที่ใช้รักษา:
                            </span>{" "}
                            {log.medications}
                          </div>
                        )}
                        {log.notes && (
                          <div className="text-sm">
                            <span className="font-medium">หมายเหตุ:</span> {log.notes}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          บันทึกเมื่อ {formatDistanceToNow(new Date(log.startDate), { addSuffix: true, locale: th })}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(log)}>
                          <Edit className="h-4 w-4 mr-1" />
                          แก้ไข
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              ลบ
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                              <AlertDialogDescription>
                                คุณแน่ใจหรือไม่ที่จะลบบันทึกการรักษานี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(log.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                ลบ
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
                  <CardTitle>ไม่มีบันทึกการรักษา</CardTitle>
                  <CardDescription>
                    {activeTab === "all"
                      ? "ยังไม่มีบันทึกการดูแลเจ็บป่วย คลิกปุ่ม \"เพิ่มบันทึก\" เพื่อเริ่มต้น"
                      : `ไม่มีบันทึกที่มีสถานะ "${statusLabels[activeTab] || activeTab}"`}
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
              <DialogTitle>แก้ไขบันทึกการดูแลเจ็บป่วย</DialogTitle>
              <DialogDescription>แก้ไขข้อมูลอาการและการรักษา</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">{formFields}</div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
