import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Plus, Trash2, CalendarIcon, DollarSign, Receipt, TrendingUp, Crown } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { th } from "date-fns/locale";
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

const categoryLabels: Record<string, string> = {
  อาหาร: "อาหาร",
  ยา: "ยา",
  วัคซีน: "วัคซีน",
  ตรวจสุขภาพ: "ตรวจสุขภาพ",
  ผ่าตัด: "ผ่าตัด",
  อุปกรณ์: "อุปกรณ์",
  "อื่นๆ": "อื่นๆ",
};

const categoryColors: Record<string, string> = {
  อาหาร: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ยา: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  วัคซีน: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ตรวจสุขภาพ: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ผ่าตัด: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  อุปกรณ์: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "อื่นๆ": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function Expenses() {
  const [selectedPetId, setSelectedPetId] = useState<number>(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    petId: 0,
    date: "",
    category: "อาหาร",
    amount: "",
    description: "",
  });

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.pets.list.query(),
  });

  const { data: expenses, isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ["expenses", selectedPetId],
    queryFn: () => api.expenses.list.query({ petId: selectedPetId }),
    enabled: !!selectedPetId,
    retry: false,
  });

  const isForbidden = (expensesError as any)?.data?.code === "FORBIDDEN" || (expensesError as any)?.message?.includes("FORBIDDEN");

  const createMutation = useMutation({
    mutationFn: (data: any) => api.expenses.create.mutate(data),
    onSuccess: () => {
      toast.success("เพิ่มรายจ่ายสำเร็จแล้ว");
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.data?.code === "FORBIDDEN") {
        toast.error("ฟีเจอร์นี้สำหรับผู้ใช้ Premium เท่านั้น");
      } else {
        toast.error(`เพิ่มรายจ่ายไม่สำเร็จ: ${error.message}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: number) => api.expenses.delete.mutate({ expenseId }),
    onSuccess: () => {
      toast.success("ลบรายจ่ายสำเร็จแล้ว");
    },
    onError: (error: any) => {
      if (error.data?.code === "FORBIDDEN") {
        toast.error("ฟีเจอร์นี้สำหรับผู้ใช้ Premium เท่านั้น");
      } else {
        toast.error(`ลบรายจ่ายไม่สำเร็จ: ${error.message}`);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      petId: selectedPetId,
      date: "",
      category: "อาหาร",
      amount: "",
      description: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.petId || !formData.date || !formData.amount) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นทั้งหมด");
      return;
    }
    createMutation.mutate({
      petId: formData.petId,
      date: formData.date,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description || undefined,
    });
  };

  const handleDelete = (expenseId: number) => {
    deleteMutation.mutate(expenseId);
  };

  // Summary stats
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thisMonthExpenses = expenses?.filter((exp) =>
    isWithinInterval(new Date(exp.date), { start: monthStart, end: monthEnd })
  );
  const thisMonthTotal = thisMonthExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const recordCount = expenses?.length || 0;

  // Category breakdown
  const categoryBreakdown = expenses?.reduce(
    (acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = { count: 0, total: 0 };
      }
      acc[exp.category].count += 1;
      acc[exp.category].total += exp.amount;
      return acc;
    },
    {} as Record<string, { count: number; total: number }>
  );

  const formatBaht = (amount: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(amount);

  // Premium upgrade prompt
  if (isForbidden) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">รายจ่าย</h1>
          <p className="text-muted-foreground">ติดตามรายจ่ายทั้งหมดของสัตว์เลี้ยง</p>
        </div>
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-xl">ฟีเจอร์สำหรับผู้ใช้ Premium</CardTitle>
            <CardDescription>
              การติดตามรายจ่ายเป็นฟีเจอร์พิเศษสำหรับผู้ใช้ Premium เท่านั้น
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายจ่าย</h1>
          <p className="text-muted-foreground">ติดตามรายจ่ายทั้งหมดของสัตว์เลี้ยง</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มรายจ่าย
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>เพิ่มรายจ่าย</DialogTitle>
                <DialogDescription>บันทึกรายจ่ายสำหรับสัตว์เลี้ยง</DialogDescription>
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">วันที่</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">หมวดหมู่</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(categoryLabels).map((key) => (
                        <SelectItem key={key} value={key}>{categoryLabels[key]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">จำนวนเงิน (฿)</Label>
                  <Input id="amount" type="number" min="0" value={formData.amount} onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))} className="col-span-3" placeholder="0" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">รายละเอียด</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} className="col-span-3" rows={2} placeholder="รายละเอียดเพิ่มเติม (ไม่จำเป็น)" />
                </div>
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
        <>
          {/* Summary stats */}
          {expensesLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">รวมทั้งหมด</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatBaht(totalExpenses)}</div>
                  <p className="text-xs text-muted-foreground">ยอดรวมทั้งหมด</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">เดือนนี้</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatBaht(thisMonthTotal)}</div>
                  <p className="text-xs text-muted-foreground">{format(monthStart, "MMMM yyyy", { locale: th })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">จำนวนรายการ</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recordCount}</div>
                  <p className="text-xs text-muted-foreground">รายการทั้งหมด</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category breakdown */}
          {categoryBreakdown && Object.keys(categoryBreakdown).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">สรุปตามหมวดหมู่</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Object.entries(categoryBreakdown).map(([category, data]) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={categoryColors[category] || ""}>{categoryLabels[category] || category}</Badge>
                        <span className="text-sm text-muted-foreground">{data.count} รายการ</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{formatBaht(data.total)}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Expense list */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">รายการรายจ่าย</h2>
            {expensesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-5 w-20" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <Badge className={categoryColors[expense.category] || ""}>
                          {categoryLabels[expense.category] || expense.category}
                        </Badge>
                        <div>
                          <div className="text-sm font-medium">{expense.description || "-"}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(expense.date), "d MMMM yyyy", { locale: th })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatBaht(expense.amount)}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                              <AlertDialogDescription>
                                คุณแน่ใจหรือไม่ที่จะลบรายจ่ายรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                <CardHeader>
                  <CardTitle>ไม่มีรายจ่าย</CardTitle>
                  <CardDescription>ยังไม่มีรายจ่ายที่บันทึก คลิกปุ่ม "เพิ่มรายจ่าย" เพื่อเริ่มต้น</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
