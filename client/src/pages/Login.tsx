import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { PawPrint } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";

export default function Login() {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success(lang === "th" ? "เข้าสู่ระบบสำเร็จ" : "Login successful");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">🐾</div>
          <CardTitle className="text-2xl">{lang === "th" ? "เข้าสู่ระบบ" : "Sign In"}</CardTitle>
          <CardDescription>
            {lang === "th" ? "เข้าสู่บัญชี PetHealth ของคุณ" : "Access your PetHealth account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
              {loginMutation.isPending
                ? (lang === "th" ? "กำลังเข้าสู่ระบบ..." : "Signing in...")
                : (lang === "th" ? "เข้าสู่ระบบ" : "Sign In")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {lang === "th" ? "ยังไม่มีบัญชี?" : "Don't have an account?"}{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              {lang === "th" ? "สมัครสมาชิก" : "Sign up"}
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              {lang === "th" ? "กลับหน้าหลัก" : "Back to home"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
