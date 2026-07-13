import DashboardLayout from '@/components/DashboardLayout';
import { useI18n } from "@/contexts/I18nContext";

export default function BehaviorLogs() {
  const { t, lang } = useI18n();
  return (
    <DashboardLayout>
      <div className='p-6'>
        <h1 className='text-3xl font-bold'>{t.behaviorLogs.title}</h1>
        <p className='text-muted-foreground mt-2'>
          {lang === 'th' ? 'ฟีเจอร์นี้กำลังพัฒนา' : 'This feature is under development'}
        </p>
      </div>
    </DashboardLayout>
  );
}
