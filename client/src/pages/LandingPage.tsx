import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Star, Heart, Shield, Clock, Zap, Users, ArrowRight, Calendar, Bell, FileText, Download, ChevronRight, PawPrint, Camera, Instagram, Crown, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useI18n } from "@/contexts/I18nContext";

export default function LandingPage() {
  const { lang } = useI18n();
  const th = lang === "th";
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = th ? [
    {
      name: "คุณสมชาย",
      petName: "โมโม่",
      role: "เจ้าของสุนัข",
      content: "PetHealth ช่วยให้ฉันจัดการวัคซีนของโมโม่ได้อย่างง่ายดาย ไม่พลาดการฉีดวัคซีนอีกเลย! แจ้งเตือนล่วงหน้ามากมาย",
      avatar: "🐕",
      rating: 5,
    },
    {
      name: "คุณมานี",
      petName: "ลูนา",
      role: "เจ้าของแมว",
      content: "ฉันชอบฟีเจอร์บันทึกกิจกรรมรายวันและการเชื่อมต่อกับ Instagram สามารถเก็บความทรงจำช่วงเวลาที่ดีๆ ของลูนาได้",
      avatar: "🐱",
      rating: 5,
    },
    {
      name: "คุณวีระ",
      petName: "ฮามี",
      role: "เจ้าของกระต่าย",
      content: "แผนพรีเมียมคุ้มค่ากับฟีเจอร์ทั้งหมด! สามารถติดตามค่าใช้จ่ายและสุขภาพของฮามีได้ในที่เดียว",
      avatar: "🐹",
      rating: 5,
    },
  ] : [
    {
      name: "Somchai",
      petName: "Momo",
      role: "Dog Owner",
      content: "PetHealth makes it so easy to manage Momo's vaccinations. Never missed one since! Great reminders.",
      avatar: "🐕",
      rating: 5,
    },
    {
      name: "Manee",
      petName: "Luna",
      role: "Cat Owner",
      content: "I love the daily activity tracking and Instagram integration. Can capture all of Luna's special moments!",
      avatar: "🐱",
      rating: 5,
    },
    {
      name: "Weera",
      petName: "Hami",
      role: "Rabbit Owner",
      content: "Premium plan is worth every feature! Track expenses and Hami's health all in one place.",
      avatar: "🐹",
      rating: 5,
    },
  ];

  const features = th ? [
    {
      title: "จัดการสัตว์เลี้ยงหลายตัว",
      description: "เก็บข้อมูลสัตว์เลี้ยงทั้งหมดของคุณไว้ในที่เดียว",
      icon: <PawPrint className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "บันทึกสุขภาพและการไปหาหมอ",
      description: "บันทึกประวัติการแพทย์ อาการ คำวินิจฉัย และค่าใช้จ่าย",
      icon: <Heart className="h-8 w-8 text-primary" />,
      premium: false,
    },
    {
      title: "แจ้งเตือนอัตโนมัติ",
      description: "รับการแจ้งเตือนทางอีเมลก่อนถึงวันฉีดวัคซีนและวันที่ต้องให้ยา",
      icon: <Bell className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "ติดตามยาเห็บหมัดและยาถ่ายพยาธิ",
      description: "ตั้งค่าการแจ้งเตือนสำหรับการให้ยาเห็บหมัดและยาถ่ายพยาธิ",
      icon: <Shield className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "บันทึกกิจกรรมรายวัน",
      description: "จดบันทึกกิจกรรมประจำวันและเชื่อมต่อกับ Instagram",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "อัปโหลดรูปภาพ",
      description: "อัปโหลดรูปสัตว์เลี้ยงและเอกสารสำคัญได้อย่างปลอดภัย",
      icon: <Camera className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "ติดตามค่าใช้จ่าย",
      description: "บันทึกและวิเคราะห์ค่าใช้จ่ายทั้งหมดเกี่ยวกับสัตว์เลี้ยง",
      icon: <FileText className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "ดูแลสัตว์ป่วย",
      description: "จัดการข้อมูลและการดูแลเมื่อสัตว์เลี้ยงป่วย",
      icon: <Shield className="h-8 w-8 text-primary" />,
      premium: true,
    },
  ] : [
    {
      title: "Manage Multiple Pets",
      description: "Keep all your pet information in one place",
      icon: <PawPrint className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "Health Records & Vet Visits",
      description: "Track medical history, symptoms, diagnoses, and costs",
      icon: <Heart className="h-8 w-8 text-primary" />,
      premium: false,
    },
    {
      title: "Automatic Reminders",
      description: "Get email alerts before vaccination and medication due dates",
      icon: <Bell className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "Flea/Tick & Deworming Tracking",
      description: "Set reminders for flea/tick and deworming treatments",
      icon: <Shield className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "Daily Activity Log",
      description: "Record daily activities and connect with Instagram",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "Photo Uploads",
      description: "Upload pet photos and important documents securely",
      icon: <Camera className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "Expense Tracking",
      description: "Record and analyze all pet-related expenses",
      icon: <FileText className="h-8 w-8 text-primary" />,
      premium: true,
    },
    {
      title: "Sick Care",
      description: "Manage care information when your pet is sick",
      icon: <Shield className="h-8 w-8 text-primary" />,
      premium: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-blue-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🐾</div>
            <span className="text-xl font-bold text-primary">PetHealth</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">{th ? "คุณสมบัติ" : "Features"}</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">{th ? "ราคา" : "Pricing"}</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">{th ? "รีวิว" : "Reviews"}</a>
          </nav>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline">{th ? "เข้าสู่ระบบ" : "Sign In"}</Button>
            </Link>
            <Link href="/signup">
              <Button>{th ? "สมัครสมาชิก" : "Sign Up"}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
            🎉 {th ? "ใหม่! ระบบแจ้งเตือนอัตโนมัติและการจัดการยา" : "New! Auto reminders & medication tracking"}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            {th ? "แอปจัดการสุขภาพสัตว์เลี้ยงที่สมบูรณ์" : "The complete pet health management app"}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {th
              ? "เก็บข้อมูลสุขภาพ วัคซีน การให้ยา และกิจกรรมของสัตว์เลี้ยงของคุณไว้ในที่เดียว พร้อมระบบแจ้งเตือนอัตโนมัติเพื่อไม่พลาดวันสำคัญ"
              : "Keep track of your pet's health, vaccines, medications, and activities in one place. With automatic reminders so you never miss an important date."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-3 h-auto">
                {th ? "เริ่มใช้งานฟรี" : "Start Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3 h-auto">
              {th ? "ดูตัวอย่าง" : "See Demo"}
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-3xl font-bold text-primary">1,000+</h3>
            <p className="text-sm text-muted-foreground">{th ? "สัตว์เลี้ยงที่ลงทะเบียน" : "Registered Pets"}</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-primary">5,000+</h3>
            <p className="text-sm text-muted-foreground">{th ? "บันทึกสุขภาพ" : "Health Records"}</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-primary">98%</h3>
            <p className="text-sm text-muted-foreground">{th ? "ความพึงพอใจของผู้ใช้" : "User Satisfaction"}</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-primary">24/7</h3>
            <p className="text-sm text-muted-foreground">{th ? "การแจ้งเตือนอัตโนมัติ" : "Auto Reminders"}</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{th ? "คุณสมบัติทั้งหมดที่คุณต้องการ" : "All the features you need"}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {th ? "จัดการสัตว์เลี้ยงของคุณได้อย่างง่ายดายด้วยเครื่องมือที่ออกแบบมาเพื่อให้ใช้งานง่าย" : "Manage your pets easily with tools designed for simplicity"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden">
              {feature.premium && (
                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 rounded-full bg-blue-50 w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{th ? "เลือกแผนที่เหมาะกับคุณ" : "Choose the right plan"}</h2>
          <p className="text-lg text-muted-foreground">
            {th ? "เริ่มต้นได้ฟรี อัพเกรดเมื่อคุณพร้อมใช้ฟีเจอร์เพิ่มเติม" : "Start free, upgrade when you're ready for more features"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{th ? "ฟรี" : "Free"}</CardTitle>
              <CardDescription>{th ? "เหมาะสำหรับการลองใช้งาน" : "Great for trying out"}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">฿0</span>
                <span className="text-lg text-muted-foreground">{th ? "/เดือน" : "/mo"}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{th ? "สัตว์เลี้ยง 1 ตัว" : "1 Pet"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{th ? "บันทึกสุขภาพ 10 รายการ/เดือน" : "10 Health Records/mo"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{th ? "บันทึกพฤติกรรม 5 รายการ/เดือน" : "5 Behavior Logs/mo"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{th ? "ติดตามวัคซีนและน้ำหนัก" : "Vaccine & weight tracking"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{th ? "ตารางให้อาหารและกิจกรรมรายวัน" : "Feeding schedule & daily activities"}</span>
                </li>
                <Separator />
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                  </div>
                  <span className="text-muted-foreground">{th ? "สัตว์เลี้ยงไม่จำกัด" : "Unlimited pets"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                  </div>
                  <span className="text-muted-foreground">{th ? "ติดตามค่าใช้จ่ายและดูแลสัตว์ป่วย" : "Expense tracking & sick care"}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-primary shadow-lg">
            <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-blue-600 text-white">
              {th ? "ยอดนิยมที่สุด" : "Most Popular"}
            </Badge>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                {th ? "พรีเมียม" : "Premium"}
              </CardTitle>
              <CardDescription>{th ? "เข้าถึงฟีเจอร์ทั้งหมด" : "Access all features"}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold">฿350</span>
                <span className="text-lg text-muted-foreground">{th ? "/เดือน" : "/mo"}</span>
                <div className="text-sm text-muted-foreground mt-1">
                  {th ? "หรือ฿3,500/ปี (ประหยัด 2 เดือน)" : "or ฿3,500/yr (save 2 months)"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{th ? "สัตว์เลี้ยงไม่จำกัด" : "Unlimited pets"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{th ? "บันทึกไม่จำกัด" : "Unlimited records"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{th ? "ติดตามค่าใช้จ่ายและดูแลสัตว์ป่วย" : "Expense tracking & sick care"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{th ? "อัปโหลดรูปภาพและเอกสาร" : "Upload photos & documents"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{th ? "การแจ้งเตือนอัตโนมัติ" : "Automatic reminders"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{th ? "จัดการยาเห็บหมัดและยาถ่ายพยาธิ" : "Flea/tick & deworming management"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{th ? "บันทึกกิจกรรมและเชื่อมต่อกับ Instagram" : "Activity logging & Instagram integration"}</span>
                </li>
                <Separator />
                <li className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{th ? "ฟีเจอร์ใหม่ที่เพิ่มเข้ามาทุกเดือน" : "New features added every month"}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{th ? "ผู้ใช้งานพูดถึงเรา" : "What our users say"}</h2>
          <p className="text-lg text-muted-foreground">
            {th ? "ความคิดเห็นจากผู้ใช้ PetHealth ทั่วประเทศ" : "Reviews from PetHealth users across the country"}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className={`h-full ${activeTestimonial === index ? 'ring-2 ring-primary/20' : ''}`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <CardDescription className="italic text-base">
                    "{testimonial.content}"
                  </CardDescription>
                  <p className="text-sm font-medium mt-2">- {testimonial.petName}</p>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Testimonial Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${
                  activeTestimonial === index ? 'bg-primary' : 'bg-gray-300'
                }`}
                onClick={() => setActiveTestimonial(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{th ? "พร้อมเริ่มจัดการสุขภาพสัตว์เลี้ยงของคุณหรือ?" : "Ready to manage your pet's health?"}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {th ? "เข้าร่วมกับผู้ใช้งานมากกว่า 1,000 คนที่เชื่อถือใน PetHealth" : "Join over 1,000 users who trust PetHealth"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3 h-auto">
                {th ? "สมัครสมาชิกฟรี" : "Sign Up Free"}
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 h-auto bg-white text-primary border-white hover:bg-white/90">
                {th ? "ดูแผนราคา" : "View Plans"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{th ? "คำถามที่พบบ่อย" : "FAQ"}</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{th ? "PetHealth ฟรีหรือเปล่า?" : "Is PetHealth free?"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {th ? "PetHealth มีแผนฟรีและพรีเมียม แผนฟรีเหมาะสำหรับผู้ที่ต้องการลองใช้งาน และแผนพรีเมียมสำหรับผู้ที่ต้องการฟีเจอร์ครบถ้วย" : "PetHealth has both free and premium plans. The free plan is great for trying things out, and premium is for those who want all features."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{th ? "ฉันสามารถเปลี่ยนแผนได้หรือไม่?" : "Can I change plans?"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {th ? "ได้ค่ะ คุณสามารถเปลี่ยนระหว่างแผนฟรีและพรีเมียมได้ทุกเวลา" : "Yes! You can switch between free and premium plans anytime."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{th ? "ข้อมูลของฉันปลอดภัยหรือไม่?" : "Is my data safe?"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {th ? "ใช่ เราใช้การเข้ารหัสแบบ end-to-end และจัดเก็บข้อมูลในเซิร์ฟเวอร์ที่ปลอดภัย ข้อมูลสัตว์เลี้ยงของคุณจะถูกเก็บเป็นความลับเสมอ" : "Yes. We use end-to-end encryption and store data on secure servers. Your pet's information is always kept confidential."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{th ? "ฉันสามารถใช้งานบนมือถือได้หรือไม่?" : "Can I use it on mobile?"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {th ? "ได้ค่ะ PetHealth รองรับบนอุปกรณ์ทุกชนิด ทั้งบนคอมพิวเตอร์และมือถือ" : "Yes! PetHealth works on all devices — both desktop and mobile."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">PetHealth</h3>
              <p className="text-muted-foreground text-sm">
                {th ? "แอปจัดการสุขภาพสัตว์เลี้ยงที่สมบูรณ์ สำหรับผู้ที่รักสัตว์เลี้ยง" : "The complete pet health management app for pet lovers"}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{th ? "คุณสมบัติ" : "Features"}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">{th ? "บันทึกสุขภาพ" : "Health Records"}</a></li>
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">{th ? "จัดการวัคซีน" : "Vaccinations"}</a></li>
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">{th ? "บันทึกกิจกรรม" : "Activities"}</a></li>
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">{th ? "จัดการยา" : "Medications"}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{th ? "บริษัท" : "Company"}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">{th ? "แผนราคา" : "Pricing"}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{th ? "ความเป็นส่วนตัว" : "Privacy"}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{th ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy"}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{th ? "ติดต่อเรา" : "Contact Us"}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{th ? "ติดต่อ" : "Contact"}</h3>
              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Separator />
          <div className="text-center text-sm text-muted-foreground py-4">
            <p>&copy; {new Date().getFullYear()} PetHealth. {th ? "สงวนลิขสิทธิ์" : "All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
