import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";

export function LanguageSwitcher() {
  const { lang, toggleLang } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLang}
      className="gap-1.5 font-medium text-sm"
      aria-label="Switch language"
    >
      <Languages className="h-4 w-4" />
      {lang === "th" ? "EN" : "ไทย"}
    </Button>
  );
}
