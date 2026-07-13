import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UpcomingReminders } from "@/components/UpcomingReminders";
import { trpc } from "@/lib/trpc";
import {
  Heart,
  PawPrint,
  Syringe,
  TrendingUp,
  DollarSign,
  Plus,
  Pill,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/contexts/I18nContext";

export default function Home() {
  const { t, lang } = useI18n();
  const { data: pets, isLoading: petsLoading } = trpc.pets.list.useQuery();
  const { data: subscription } = trpc.subscriptions.get.useQuery();

  const tier = subscription?.tier || "free";
  const isPremium = tier === "premium";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t.dashboard.welcome}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.dashboard.subtitle}
            </p>
          </div>
          <Link href="/pets">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              {t.dashboard.addPet}
            </Button>
          </Link>
        </div>

        {/* Subscription Status */}
        {!isPremium && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">
                {t.dashboard.upgradeToPremium}
              </CardTitle>
              <CardDescription>
                {t.dashboard.upgradeDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/subscription">
                <Button variant="default">{t.dashboard.upgradeNow}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.dashboard.totalPets}
              </CardTitle>
              <PawPrint className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {petsLoading ? "..." : pets?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {tier === "free" ? t.dashboard.maxOnFreeTier : (lang === 'th' ? 'ไม่จำกัด' : 'Unlimited')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t.dashboard.healthRecords}
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                {tier === "free" ? t.dashboard.perMonthOnFreeTier : (lang === 'th' ? 'ไม่จำกัด' : 'Unlimited')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.dashboard.vaccinations}</CardTitle>
              <Syringe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                {t.dashboard.trackUpcomingDates}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isPremium ? t.expenses.title : t.dashboard.premiumFeature}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isPremium ? "-" : "🔒"}</div>
              <p className="text-xs text-muted-foreground">
                {isPremium ? (lang === 'th' ? 'ติดตามการใช้จ่าย' : 'Track spending') : t.dashboard.upgradeToUnlock}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pets List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t.dashboard.yourPets}</h2>
          {petsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.common.loading}
            </div>
          ) : pets && pets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pets.map(pet => (
                <Link key={pet.id} href={`/pets/${pet.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
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
                            {pet.birthDate &&
                              ` • ${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} ${t.pets.years}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t.dashboard.noPetsYet}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t.dashboard.addFirstPet}
                </p>
                <Link href="/pets">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t.dashboard.addYourFirstPet}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Reminders */}
        <UpcomingReminders />

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t.dashboard.quickActions}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/health-records">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.healthRecords.title}</CardTitle>
                      <CardDescription>
                        {t.dashboard.trackMedicalHistory}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/vaccinations">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Syringe className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.vaccinations.title}</CardTitle>
                      <CardDescription>{t.dashboard.manageVaccineSchedule}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/weight-tracking">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.weightTracking.title}</CardTitle>
                      <CardDescription>
                        {t.dashboard.monitorGrowthTrends}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/medications">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Pill className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.medications.title}</CardTitle>
                      <CardDescription>
                        {lang === 'th' ? 'ติดตามการให้ยาเห็บหมัดและยาถ่ายพยาธิ' : 'Track flea/tick and deworming medication'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/daily-activities">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.dailyActivities.title}</CardTitle>
                      <CardDescription>
                        {lang === 'th' ? 'บันทึกกิจกรรมประจำวันและแชร์ไปยัง Instagram' : 'Log daily activities and share to Instagram'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
