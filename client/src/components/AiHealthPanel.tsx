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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Sparkles,
  Send,
  Mic,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";

const SEVERITY_STYLE: Record<string, { badge: string; icon: typeof Sparkles }> = {
  info: { badge: "bg-blue-100 text-blue-800", icon: Sparkles },
  green: { badge: "bg-green-100 text-green-800", icon: ShieldCheck },
  amber: { badge: "bg-amber-100 text-amber-800", icon: AlertTriangle },
  red: { badge: "bg-red-100 text-red-800", icon: AlertTriangle },
};

export default function AiHealthPanel({ petId }: { petId: number }) {
  const { lang } = useI18n();
  const th = lang === "th";
  const [memoText, setMemoText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  const utils = trpc.useUtils();

  const { data: insights, isLoading: insightsLoading } = trpc.intelligence.insights.useQuery(
    { petId, limit: 10 },
    { enabled: !!petId }
  );
  const { data: memos } = trpc.memos.list.useQuery({ petId, sinceDays: 7 }, { enabled: !!petId });

  const addMemo = trpc.memos.create.useMutation({
    onSuccess: () => {
      utils.memos.list.invalidate({ petId });
      toast.success(th ? "บันทึกแล้ว" : "Memo saved");
      setMemoText("");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMemo = trpc.memos.delete.useMutation({
    onSuccess: () => utils.memos.list.invalidate({ petId }),
  });

  const genDigest = trpc.intelligence.digest.useMutation({
    onSuccess: () => {
      utils.intelligence.insights.invalidate({ petId });
      toast.success(th ? "สรุปสุขภาพวันนี้พร้อมแล้ว" : "Today's digest ready");
    },
    onError: (e) => toast.error(e.message),
  });

  const analyzeCluster = trpc.intelligence.analyzeCluster.useMutation({
    onSuccess: (data) => {
      utils.intelligence.insights.invalidate({ petId });
      if (data.cluster) {
        toast.warning(th ? `พบรูปแบบผิดปกติ ${data.anomalies.length} จุด` : `Cluster detected: ${data.anomalies.length} anomalies`);
      } else {
        toast.success(th ? "ไม่พบความผิดปกติแบบ cluster — ดีมาก!" : "No clusters — all clear!");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const setInsightStatus = trpc.intelligence.setStatus.useMutation({
    onSuccess: () => utils.intelligence.insights.invalidate({ petId }),
  });

  const sendChat = trpc.intelligence.chat.useMutation({
    onSuccess: (data) => {
      setChatHistory(h => [...h, { role: "ai", text: data.reply }]);
      if (data.emergency) {
        toast.error(th ? "ภาวะฉุกเฉิน — ไปโรงพยาบาลสัตวแพทย์ทันที" : "EMERGENCY — go to vet now");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatHistory(h => [...h, { role: "user", text: msg }]);
    setChatInput("");
    sendChat.mutate({ petId, message: msg });
  };

  const handleVoiceMemo = () => {
    // Web Speech API — Thai
    const W = window as any;
    if (!W.SpeechRecognition && !W.webkitSpeechRecognition) {
      toast.error(th ? "เบราว์เซอร์ไม่รองรับการพูด" : "Voice not supported");
      return;
    }
    const rec = new (W.SpeechRecognition || W.webkitSpeechRecognition)();
    rec.lang = th ? "th-TH" : "en-US";
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      addMemo.mutate({ petId, content: text, source: "voice" });
    };
    rec.onerror = () => toast.error(th ? "ฟังไม่ชัด ลองใหม่" : "Didn't catch that");
    rec.start();
    toast.info(th ? "กำลังฟัง..." : "Listening...");
  };

  return (
    <div className="space-y-6">
      {/* AI Insights feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>{th ? "🤖 ข้อมูลเชิงลึกสุขภาพ AI" : "🤖 AI Health Insights"}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => genDigest.mutate({ petId })} disabled={genDigest.isPending}>
                <Sparkles className="h-4 w-4 mr-1" />
                {genDigest.isPending ? (th ? "กำลังสรุป..." : "Summarizing...") : th ? "สรุปวันนี้" : "Daily digest"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => analyzeCluster.mutate({ petId })} disabled={analyzeCluster.isPending}>
                <AlertTriangle className="h-4 w-4 mr-1" />
                {analyzeCluster.isPending ? (th ? "กำลังวิเคราะห์..." : "Analyzing...") : th ? "วิเคราะห์ cluster" : "Cluster check"}
              </Button>
            </div>
          </div>
          <CardDescription>
            {th
              ? "AI สรุปข้อมูลทุกวัน 21:00 — แจ้งเตือนเมื่อพบหลายสัญญาณผิดปกติพร้อมกันเท่านั้น"
              : "AI digests daily at 21:00 — alerts only on multi-signal clusters (evidence-based)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insightsLoading ? (
            <p className="text-sm text-muted-foreground">{th ? "กำลังโหลด..." : "Loading..."}</p>
          ) : insights && insights.length > 0 ? (
            insights.map(ins => {
              const style = SEVERITY_STYLE[ins.severity] ?? SEVERITY_STYLE.info;
              const Icon = style.icon;
              return (
                <div key={ins.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{ins.title}</span>
                      <Badge variant="outline" className={style.badge}>{ins.severity}</Badge>
                      <Badge variant="outline" className="text-xs">{ins.type}</Badge>
                    </div>
                    {ins.status === "new" && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title={th ? "รับทราบ" : "Acknowledge"}
                          onClick={() => setInsightStatus.mutate({ insightId: ins.id, status: "acknowledged" })}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" title={th ? "ไม่สนใจ" : "Dismiss"}
                          onClick={() => setInsightStatus.mutate({ insightId: ins.id, status: "dismissed" })}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{ins.body}</p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {th ? "ยังไม่มีข้อมูลเชิงลึก — ลองกด \"สรุปวันนี้\"" : "No insights yet — try \"Daily digest\""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Memo everything */}
      <Card>
        <CardHeader>
          <CardTitle>{th ? "📝 บันทึกทุกอย่าง (Memo Everything)" : "📝 Memo Everything"}</CardTitle>
          <CardDescription>
            {th ? "พิมพ์หรือพูด — AI จะอ่านทุกบันทึกในการสรุปรายวัน" : "Type or speak — AI reads all memos in the daily digest"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={th ? "เช่น วันนี้ขี้อ้อนผิดปกติ เดินเล่น 30 นาที กินข้าวหมดจาน..." : "e.g. extra clingy today, walked 30 min, ate everything..."}
            value={memoText}
            onChange={e => setMemoText(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={!memoText.trim() || addMemo.isPending}
              onClick={() => addMemo.mutate({ petId, content: memoText, source: "manual" })}>
              <Send className="h-4 w-4 mr-1" />
              {th ? "บันทึก" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleVoiceMemo}>
              <Mic className="h-4 w-4 mr-1" />
              {th ? "พูดบันทึก" : "Voice memo"}
            </Button>
          </div>
          {memos && memos.length > 0 && (
            <div className="space-y-2 pt-2">
              {memos.map(m => (
                <div key={m.id} className="flex items-start justify-between gap-2 border rounded p-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.memoDate).toLocaleString(th ? "th-TH" : "en-US")} · {m.source}
                    </span>
                    <p>{m.content}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteMemo.mutate({ memoId: m.id })}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ask AI chat */}
      <Card>
        <CardHeader>
          <CardTitle>{th ? "💬 ถาม AI เรื่องสุขภาพน้อง" : "💬 Ask about your pet"}</CardTitle>
          <CardDescription>
            {th
              ? "AI อ่านโปรไฟล์ทั้งหมดก่อนตอบ — ไม่ใช่การวินิจฉัย อาการฉุกเฉินระบบจะเตือนให้ไปหาหมอทันที"
              : "AI reads the full profile first — guidance only, emergencies route straight to the vet"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {chatHistory.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {chatHistory.map((m, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${m.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
                  <div className="text-xs text-muted-foreground mb-1">{m.role === "user" ? (th ? "คุณ" : "You") : "AI"}</div>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              ))}
              {sendChat.isPending && (
                <div className="bg-muted mr-8 p-3 rounded-lg text-sm text-muted-foreground">
                  {th ? "AI กำลังคิด..." : "Thinking..."}
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder={th ? "เช่น ลูก้ากินอาหารน้อยลงเรื่อยๆ ควรทำไง" : "e.g. He's eating less lately, what should I do?"}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendChat()}
            />
            <Button size="icon" onClick={handleSendChat} disabled={!chatInput.trim() || sendChat.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
