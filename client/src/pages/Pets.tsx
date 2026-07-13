import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { PawPrint, Plus, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";

export default function Pets() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    birthDate: "",
    gender: "unknown" as "male" | "female" | "unknown",
  });

  const { data: pets, isLoading } = trpc.pets.list.useQuery();
  const { data: subscription } = trpc.subscription.get.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.pets.create.useMutation({
    onSuccess: () => {
      utils.pets.list.invalidate();
      toast.success(t.success.saved);
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.pets.update.useMutation({
    onSuccess: () => {
      utils.pets.list.invalidate();
      toast.success(t.success.updated);
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.pets.delete.useMutation({
    onSuccess: () => {
      utils.pets.list.invalidate();
      toast.success(t.success.deleted);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", breed: "", birthDate: "", gender: "unknown" });
    setEditingPet(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPet) {
      updateMutation.mutate({
        petId: editingPet.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (pet: any) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      breed: pet.breed || "",
      birthDate: pet.birthDate ? new Date(pet.birthDate).toISOString().split("T")[0] : "",
      gender: pet.gender || "unknown",
    });
    setOpen(true);
  };

  const handleDelete = (petId: number) => {
    if (confirm(t.pets.confirmDelete)) {
      deleteMutation.mutate({ petId });
    }
  };

  const tier = subscription?.tier || "free";
  const canAddMore = tier === "premium" || (pets?.length || 0) < 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.pets.title}</h1>
            <p className="text-muted-foreground mt-1">
              {lang === 'th' ? 'จัดการสัตว์เลี้ยงและข้อมูลของพวกเขา' : 'Manage your pets and their information'}
            </p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2" disabled={!canAddMore}>
                <Plus className="h-5 w-5" />
                {t.dashboard.addPet}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingPet ? t.pets.editPet : t.pets.addNew}</DialogTitle>
                  <DialogDescription>
                    {editingPet ? (lang === 'th' ? 'อัพเดทข้อมูลสัตว์เลี้ยงของคุณ' : "Update your pet's information") : (lang === 'th' ? 'เพิ่มสัตว์เลี้ยงใหม่ในบัญชีของคุณ' : 'Add a new pet to your account')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.pets.name} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breed">{t.pets.breed}</Label>
                    <Input
                      id="breed"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">{t.pets.birthDate}</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">{t.pets.gender}</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: "male" | "female" | "unknown") =>
                        setFormData({ ...formData, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t.pets.male}</SelectItem>
                        <SelectItem value="female">{t.pets.female}</SelectItem>
                        <SelectItem value="unknown">{t.pets.unknown}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingPet ? t.common.edit : t.common.add} {t.pets.title.replace(lang === 'th' ? 'ของฉัน' : 'My', '').trim()}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!canAddMore && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">{t.pets.limitReached}</CardTitle>
              <CardDescription>
                {t.pets.limitReachedDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/subscription">
                <Button variant="default">{t.subscription.upgradeNow}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">{t.common.loading}</div>
        ) : pets && pets.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <Card key={pet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {pet.photoUrl ? (
                        <img
                          src={pet.photoUrl}
                          alt={pet.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <PawPrint className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle>{pet.name}</CardTitle>
                        <CardDescription>
                          {pet.breed || (lang === 'th' ? 'ไม่ระบุสายพันธุ์' : 'Unknown breed')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(pet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(pet.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.pets.gender}:</span>
                      <span className="font-medium capitalize">{pet.gender}</span>
                    </div>
                    {pet.birthDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.pets.age}:</span>
                        <span className="font-medium">
                            {Math.floor(
                              (Date.now() - new Date(pet.birthDate).getTime()) /
                                (1000 * 60 * 60 * 24 * 365)
                            )}{" "}
                            {lang === 'th' ? 'ปี' : 'years old'}
                        </span>
                      </div>
                    )}
                  </div>
                  <Link href={`/pets/${pet.id}`}>
                    <Button className="w-full mt-4" variant="outline">
                      {lang === 'th' ? 'ดูโปรไฟล์' : 'View Profile'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <PawPrint className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t.dashboard.noPetsYet}</h3>
              <p className="text-muted-foreground mb-6">
                {t.dashboard.addFirstPet}
              </p>
              <Button onClick={() => setOpen(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                {t.dashboard.addYourFirstPet}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
