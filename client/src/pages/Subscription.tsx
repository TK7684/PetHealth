import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Check, Crown, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useI18n } from "@/contexts/I18nContext";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export default function Subscription() {
  const { t, lang } = useI18n();
  const { data: subscription, isLoading } = trpc.subscription.get.useQuery();
  const utils = trpc.useUtils();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const createCheckoutSessionMutation =
    trpc.subscription.createCheckoutSession.useMutation({
      onSuccess: async data => {
        // When the customer clicks on the button, redirect them to Checkout.
        window.location.href = data.url;
      },
      onError: error => {
        toast.error(error.message);
        setIsProcessing(false);
      },
    });

  const createCustomerPortalSessionMutation =
    trpc.subscription.createCustomerPortalSession.useMutation({
      onSuccess: async data => {
        // Redirect to the customer portal
        window.location.href = data.url;
      },
      onError: error => {
        toast.error(error.message);
      },
    });

  const tier = subscription?.tier || "free";
  const isPremium = tier === "premium";

  const handleSubscribe = (priceId: string) => {
    setIsProcessing(true);

    const successUrl = `${window.location.origin}/subscription?success=true`;
    const cancelUrl = `${window.location.origin}/subscription`;

    createCheckoutSessionMutation.mutate({
      priceId,
      successUrl,
      cancelUrl,
    });
  };

  useEffect(() => {
    // Check if the user was redirected back from Stripe
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      toast.success(t.subscription.alreadyPremium);

      // Update the URL to remove the success parameter
      window.history.replaceState({}, "", window.location.pathname);

      // Invalidate the subscription query to refetch the data
      utils.subscription.get.invalidate();
    }
  }, [utils.subscription]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-80 bg-gray-200 rounded"></div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <DashboardLayout>
        <div className="container mx-auto py-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.subscription.title}</h1>
            <p className="text-muted-foreground mt-1">
              {lang === 'th' ? 'เลือกแผนที่เหมาะสมกับความต้องการของคุณ' : 'Choose the plan that fits your needs'}
            </p>
          </div>

          {subscription && (
            <Card className={isPremium ? "border-primary bg-primary/5" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {isPremium && <Crown className="h-5 w-5 text-primary" />}
                      {t.subscription.currentPlan}: {tier === "free" ? t.subscription.free : t.subscription.premium}
                    </CardTitle>
                    <CardDescription>
                      {isPremium
                        ? t.subscription.alreadyPremium
                        : (lang === 'th' ? 'อัพเกรดเพื่อปลดล็อคฟีเจอร์ทั้งหมด' : 'Upgrade to unlock all features')}
                    </CardDescription>
                  </div>
                  {isPremium && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        createCustomerPortalSessionMutation.mutate({
                          returnUrl: window.location.href,
                        })
                      }
                      disabled={createCustomerPortalSessionMutation.isPending}
                    >
                      {createCustomerPortalSessionMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>{t.subscription.managePlan}</>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className={tier === "free" ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{t.subscription.free}</CardTitle>
                  {tier === "free" && (
                    <Badge variant="default">{t.subscription.currentPlan}</Badge>
                  )}
                </div>
                <CardDescription>
                  {lang === 'th' ? 'เหมาะสำหรับการลองใช้งาน PetHealth' : 'Great for trying PetHealth'}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">฿0</span>
                  <span className="text-muted-foreground">/{lang === 'th' ? 'เดือน' : 'month'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{t.subscription.feature1Free}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{t.subscription.feature2Free}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{t.subscription.feature3Free}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{lang === 'th' ? 'ติดตามวัคซีนและน้ำหนัก' : 'Vaccination & weight tracking'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{t.feedingSchedule.title}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{lang === 'th' ? 'บันทึกยาและกิจกรรมรายวัน' : 'Medication & activity logs'}</span>
                  </li>
                  <Separator className="my-3" />
                  <li className="flex items-center gap-2">
                    <X className="h-5 w-5 text-muted-foreground" />
                    <span>{t.subscription.feature1Premium}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-5 w-5 text-muted-foreground" />
                    <span>{t.subscription.feature4Premium}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-5 w-5 text-muted-foreground" />
                    <span>{t.subscription.feature5Premium}</span>
                  </li>
                </ul>
                {tier === "free" && (
                  <Button className="w-full mt-6" disabled variant="outline">
                    {t.subscription.currentPlan}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card
              className={
                isPremium ? "border-primary bg-primary/5" : "border-primary"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Crown className="h-6 w-6 text-primary" />
                    {t.subscription.premium}
                  </CardTitle>
                  {isPremium && <Badge variant="default">{t.subscription.currentPlan}</Badge>}
                </div>
                <CardDescription>{lang === 'th' ? 'เข้าถึงฟีเจอร์ทั้งหมด' : 'Access all features'}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">฿350</span>
                    <span className="text-muted-foreground">/{lang === 'th' ? 'เดือน' : 'month'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {lang === 'th' ? 'หรือ฿3,500/ปี (ประหยัด 2 เดือน)' : 'or ฿3,500/year (save 2 months)'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{t.subscription.feature1Premium}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{lang === 'th' ? 'บันทึกไม่จำกัด' : 'Unlimited records'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{t.subscription.feature4Premium}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{t.subscription.feature5Premium}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{lang === 'th' ? 'อัปโหลดรูปภาพไม่จำกัด' : 'Unlimited photo uploads'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{lang === 'th' ? 'การแจ้งเตือนอัตโนมัติ' : 'Automatic notifications'}</span>
                  </li>
                </ul>

                {isPremium ? (
                  <Button className="w-full mt-6" disabled variant="outline">
                    {t.subscription.currentPlan}
                  </Button>
                ) : (
                  <div className="space-y-3 mt-6">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant={
                          selectedPlan === "monthly" ? "default" : "outline"
                        }
                        onClick={() => setSelectedPlan("monthly")}
                        size="sm"
                      >
                        {lang === 'th' ? 'รายเดือน' : 'Monthly'}
                      </Button>
                      <Button
                        variant={
                          selectedPlan === "yearly" ? "default" : "outline"
                        }
                        onClick={() => setSelectedPlan("yearly")}
                        size="sm"
                      >
                        {lang === 'th' ? 'รายปี (ลด 17%)' : 'Yearly (17% off)'}
                      </Button>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() =>
                        handleSubscribe(
                          selectedPlan === "monthly"
                            ? process.env.VITE_STRIPE_MONTHLY_PRICE_ID ||
                                "price_monthly_premium_350"
                            : process.env.VITE_STRIPE_YEARLY_PRICE_ID ||
                                "price_yearly_premium_3500"
                        )
                      }
                      disabled={
                        isProcessing || createCheckoutSessionMutation.isPending
                      }
                    >
                      {isProcessing ||
                      createCheckoutSessionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.common.loading}
                        </>
                      ) : (
                        `${t.subscription.upgradeNow} (${selectedPlan === "monthly" ? (lang === 'th' ? 'รายเดือน' : 'Monthly') : (lang === 'th' ? 'รายปี' : 'Yearly')})`
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      {lang === 'th' ? 'การชำระเงินจัดการโดย Stripe อย่างปลอดภัย' : 'Payments securely processed by Stripe'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {lang === 'th' ? 'คุณสามารถยกเลิกการสมัครสมาชิกได้ทุกเวลา ไม่มีค่าธรรมเนียมในการยกเลิก' : 'You can cancel your subscription at any time. No cancellation fees.'}
          </div>
        </div>
      </DashboardLayout>
    </Elements>
  );
}
