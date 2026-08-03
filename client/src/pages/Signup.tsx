import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";

export default function Signup() {
  const { lang } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success(lang === "th" ? "สมัครสมาชิกสำเร็จ!" : "Account created successfully!");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(lang === "th" ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" : "Password must be at least 6 characters");
      return;
    }
    registerMutation.mutate({ email, password, name: name || undefined });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">🐾</div>
          <CardTitle className="text-2xl">{lang === "th" ? "สมัครสมาชิก" : "Create Account"}</CardTitle>
          <CardDescription>
            {lang === "th"
              ? "เริ่มจัดการสุขภาพสัตว์เลี้ยงของคุณวันนี้"
              : "Start managing your pet's health today"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{lang === "th" ? "ชื่อ (ไม่บังคับ)" : "Name (optional)"}</Label>
              <Input
                id="name"
                type="text"
                placeholder={lang === "th" ? "ชื่อของคุณ" : "Your name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{lang === "th" ? "รหัสผ่าน" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {lang === "th" ? "อย่างน้อย 6 ตัวอักษร" : "At least 6 characters"}
              </p>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending}>
              {registerMutation.isPending
                ? (lang === "th" ? "กำลังสร้างบัญชี..." : "Creating account...")
                : (lang === "th" ? "สมัครสมาชิก" : "Sign Up")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {lang === "th" ? "มีบัญชีอยู่แล้ว?" : "Already have an account?"}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {lang === "th" ? "เข้าสู่ระบบ" : "Sign in"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
