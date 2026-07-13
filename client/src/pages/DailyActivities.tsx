import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarIcon, Clock, MapPin, Instagram, Edit, Plus, Trash2, Camera, Link2 } from "lucide-react";
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
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ImageUpload";
import { useI18n } from "@/contexts/I18nContext";

export default function DailyActivities() {
  const { t, lang } = useI18n();
  const dateLocale = lang === "th" ? th : enUS;

  const activityTypeOptions = [
    { value: "walk", label: t.dailyActivities.walk },
    { value: "play", label: t.dailyActivities.play },
    { value: "training", label: t.dailyActivities.training },
    { value: "grooming", label: t.dailyActivities.grooming },
    { value: "social", label: lang === "th" ? "สังสรรค์กับสัตว์อื่น" : "Socializing" },
    { value: "meal", label: lang === "th" ? "มื้ออาหาร" : "Meal" },
    { value: "trip", label: lang === "th" ? "เที่ยว/ท่องเที่ยว" : "Trip/Outing" },
    { value: "health_check", label: t.dailyActivities.vet },
    { value: "other", label: t.dailyActivities.other },
  ];

  const [activeTab, setActiveTab] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Form state for adding activity
  const [formData, setFormData] = useState({
    petId: 0,
    date: new Date().toISOString().split('T')[0],
    activityType: "play",
    description: "",
    photoUrls: [] as string[],
    instagramPostUrl: "",
    duration: 0,
    location: "",
    notes: ""
  });

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: () => api.pets.list.query(),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["daily-activities"],
    queryFn: () => api.dailyActivities.list.query(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.dailyActivities.create.mutate(data),
    onSuccess: () => {
      toast.success(t.success.saved);
      setAddDialogOpen(false);
      setFormData({
        petId: 0,
        date: new Date().toISOString().split('T')[0],
        activityType: "play",
        description: "",
        photoUrls: [],
        instagramPostUrl: "",
        duration: 0,
        location: "",
        notes: ""
      });
      setUploadedImages([]);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "เพิ่มกิจกรรมไม่สำเร็จ" : "Failed to add activity"}: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.dailyActivities.update.mutate({ activityId: id, ...data }),
    onSuccess: () => {
      toast.success(t.success.updated);
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "อัพเดทข้อมูลกิจกรรมไม่สำเร็จ" : "Failed to update activity"}: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.dailyActivities.delete.mutate({ activityId: id }),
    onSuccess: () => {
      toast.success(t.success.deleted);
    },
    onError: (error) => {
      toast.error(`${lang === "th" ? "ลบกิจกรรมไม่สำเร็จ" : "Failed to delete activity"}: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.petId || !formData.description) {
      toast.error(lang === "th" ? "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด" : "Please fill in all required fields");
      return;
    }

    const activityData = {
      ...formData,
      photoUrls: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
      date: new Date(formData.date).toISOString(),
    };

    createMutation.mutate(activityData);
  };

  const handleEdit = (activity: any) => {
    setSelectedActivity(activity);
    const photoUrls = activity.photoUrls ? JSON.parse(activity.photoUrls) : [];
    setUploadedImages(photoUrls);

    setFormData({
      petId: activity.petId,
      date: format(new Date(activity.date), "yyyy-MM-dd"),
      activityType: activity.activityType,
      description: activity.description,
      photoUrls: photoUrls,
      instagramPostUrl: activity.instagramPostUrl || "",
      duration: activity.duration || 0,
      location: activity.location || "",
      notes: activity.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedActivity) return;

    const activityData = {
      ...formData,
      photoUrls: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
      date: new Date(formData.date).toISOString(),
    };

    updateMutation.mutate({
      id: selectedActivity.id,
      data: activityData
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm(lang === "th" ? "คุณแน่ใจหรือไม่ที่จะลบกิจกรรมนี้?" : "Are you sure you want to delete this activity?")) {
      deleteMutation.mutate(id);
    }
  };

  const filterActivities = (activities: any[]) => {
    if (activeTab === "all") return activities;
    if (activeTab === "recent") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return activities.filter(activity => new Date(activity.date) >= oneWeekAgo);
    }
    if (activeTab === "instagram") {
      return activities.filter(activity => activity.instagramPostUrl);
    }
    return activities;
  };

  const filteredActivities = filterActivities(activities || []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.dailyActivities.title}</h1>
          <p className="text-muted-foreground">{lang === "th" ? "บันทึกกิจกรรมประจำวันและแชร์ไปยัง Instagram" : "Log daily activities and share to Instagram"}</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.dailyActivities.addNew}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{t.dailyActivities.addNew}</DialogTitle>
                <DialogDescription>
                  {lang === "th" ? "บันทึกกิจกรรมที่สัตว์เลี้ยงของคุณทำในแต่ละวัน" : "Record activities your pet does each day"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pet" className="text-right">
                    {lang === "th" ? "สัตว์เลี้ยง" : "Pet"}
                  </Label>
                  <Select
                    value={formData.petId.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, petId: parseInt(value) }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={lang === "th" ? "เลือกสัตว์เลี้ยง" : "Select pet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {pets?.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id.toString()}>
                          {pet.name}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="activityType" className="text-right">
                    {t.dailyActivities.activityType}
                  </Label>
                  <Select
                    value={formData.activityType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, activityType: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    {t.dailyActivities.description}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                    rows={2}
                    placeholder={lang === "th" ? "อธิบายเกี่ยวกับกิจกรรมนี้" : "Describe this activity"}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duration" className="text-right">
                    {t.dailyActivities.duration} ({t.dailyActivities.minutes})
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    className="col-span-3"
                    placeholder="60"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    {t.dailyActivities.location}
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="col-span-3"
                    placeholder={lang === "th" ? "สวนสาธารณะ, บ้าน, เป็นต้น" : "Park, Home, etc."}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="instagramPostUrl" className="text-right">
                    {lang === "th" ? "ลิงก์ Instagram" : "Instagram Link"}
                  </Label>
                  <Input
                    id="instagramPostUrl"
                    value={formData.instagramPostUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagramPostUrl: e.target.value }))}
                    className="col-span-3"
                    placeholder="https://instagram.com/p/..."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    {t.dailyActivities.photos}
                  </Label>
                  <div className="col-span-3">
                    <ImageUpload
                      onImagesUploaded={setUploadedImages}
                      initialImages={uploadedImages}
                      maxImages={5}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    {t.common.notes}
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="col-span-3"
                    rows={2}
                    placeholder={lang === "th" ? "บันทึกอื่นๆ ที่อยากจดจำ" : "Other notes to remember"}
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">{t.common.all}</TabsTrigger>
          <TabsTrigger value="recent">{lang === "th" ? "ล่าสุด (7 วัน)" : "Recent (7 days)"}</TabsTrigger>
          <TabsTrigger value="instagram">{lang === "th" ? "มี Instagram" : "Has Instagram"}</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-4">
          {activitiesLoading ? (
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
          ) : filteredActivities.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((activity) => (
                <Card key={activity.id} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {activityTypeOptions.find(opt => opt.value === activity.activityType)?.label || activity.activityType}
                      {activity.instagramPostUrl && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Instagram className="h-3 w-3" />
                          Instagram
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {pets?.find(pet => pet.id === activity.petId)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(activity.date), "d MMMM yyyy", { locale: dateLocale })}</span>
                      </div>
                      <div className="text-sm">
                        <p>{activity.description}</p>
                      </div>
                      {activity.duration && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{t.dailyActivities.duration}: {activity.duration} {t.dailyActivities.minutes}</span>
                        </div>
                      )}
                      {activity.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{t.dailyActivities.location}: {activity.location}</span>
                        </div>
                      )}
                      {activity.photoUrls && JSON.parse(activity.photoUrls).length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                          <span>{t.dailyActivities.photos} {JSON.parse(activity.photoUrls).length}</span>
                        </div>
                      )}
                      {activity.instagramPostUrl && (
                        <div className="flex items-center gap-2 text-sm">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={activity.instagramPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {lang === "th" ? "ดูใน Instagram" : "View on Instagram"}
                          </a>
                        </div>
                      )}
                      {activity.notes && (
                        <div className="text-sm">
                          <span className="font-medium">{t.common.notes}:</span> {activity.notes}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(activity)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t.common.edit}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(activity.id)}
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
                <CardTitle>{t.common.noData}</CardTitle>
                <CardDescription>
                  {lang === "th" ? `คุณยังไม่ได้เพิ่มกิจกรรมใดๆ คลิกปุ่ม "${t.dailyActivities.addNew}" เพื่อเริ่มต้น` : `You haven't added any activities yet. Click "${t.dailyActivities.addNew}" to get started.`}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t.dailyActivities.editActivity}</DialogTitle>
              <DialogDescription>
                {lang === "th" ? "แก้ไขข้อมูลกิจกรรมที่คุณได้บันทึกไว้" : "Edit your recorded activity details"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-activityType" className="text-right">
                  {t.dailyActivities.activityType}
                </Label>
                <Select
                  value={formData.activityType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, activityType: value }))}
                >
                  <SelectTrigger className="col-span-3" id="edit-activityType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date" className="text-right">
                  {t.common.date}
                </Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  {t.dailyActivities.description}
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  rows={2}
                  placeholder={lang === "th" ? "อธิบายเกี่ยวกับกิจกรรมนี้" : "Describe this activity"}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-duration" className="text-right">
                  {t.dailyActivities.duration} ({t.dailyActivities.minutes})
                </Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="col-span-3"
                  placeholder="60"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-location" className="text-right">
                  {t.dailyActivities.location}
                </Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="col-span-3"
                  placeholder={lang === "th" ? "สวนสาธารณะ, บ้าน, เป็นต้น" : "Park, Home, etc."}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-instagramPostUrl" className="text-right">
                  {lang === "th" ? "ลิงก์ Instagram" : "Instagram Link"}
                </Label>
                <Input
                  id="edit-instagramPostUrl"
                  value={formData.instagramPostUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramPostUrl: e.target.value }))}
                  className="col-span-3"
                  placeholder="https://instagram.com/p/..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  {t.dailyActivities.photos}
                </Label>
                <div className="col-span-3">
                  <ImageUpload
                    onImagesUploaded={setUploadedImages}
                    initialImages={uploadedImages}
                    maxImages={5}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  {t.common.notes}
                </Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3"
                  rows={2}
                  placeholder={lang === "th" ? "บันทึกอื่นๆ ที่อยากจดจำ" : "Other notes to remember"}
                />
              </div>
            </div>
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
