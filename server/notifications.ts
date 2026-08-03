import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import * as dbFns from "./db";
import {
  vaccinations,
  medications,
  users,
  subscriptions,
} from "../drizzle/schema";
import { addDays } from "date-fns";
import { ENV } from "./_core/env";

// Types for notification
export interface NotificationTemplate {
  subject: string;
  message: string;
  type: "email" | "sms";
}

// Email notification service
export class EmailService {
  static async send(to: string, subject: string, message: string): Promise<boolean> {
    try {
      console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
      if (ENV.emailServiceApiKey && ENV.emailFromAddress) {
        const response = await fetch("https://api.emailservice.com/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.emailServiceApiKey}`,
          },
          body: JSON.stringify({ from: ENV.emailFromAddress, to, subject, message }),
        });
        return response.ok;
      }
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }
}

// SMS notification service
export class SMSService {
  static async send(to: string, message: string): Promise<boolean> {
    try {
      console.log(`[SMS] To: ${to}`);
      if (ENV.smsServiceApiKey) {
        const response = await fetch("https://api.smsservice.com/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.smsServiceApiKey}`,
          },
          body: JSON.stringify({ to, message }),
        });
        return response.ok;
      }
      return true;
    } catch (error) {
      console.error("Failed to send SMS:", error);
      return false;
    }
  }
}

// Notification templates
export const NotificationTemplates = {
  vaccinationReminder: (petName: string, vaccineName: string, dueDate: Date): NotificationTemplate => ({
    subject: `แจ้งเตือน: ถึงวันฉีดวัคซีน ${vaccineName} ของ ${petName}`,
    message: `วันที่ครบกำหนด: ${dueDate.toLocaleDateString("th-TH")}`,
    type: "email",
  }),
  medicationReminder: (petName: string, medicationName: string, dueDate: Date): NotificationTemplate => ({
    subject: `แจ้งเตือน: ถึงวันที่ต้องให้ยา ${medicationName} แก่ ${petName}`,
    message: `วันที่ครบกำหนด: ${dueDate.toLocaleDateString("th-TH")}`,
    type: "email",
  }),
  vaccinationOverdue: (petName: string, vaccineName: string, dueDate: Date): NotificationTemplate => ({
    subject: `แจ้งเตือนฉุกเฉิน: ${vaccineName} ของ ${petName} ล่าช้าแล้ว!`,
    message: `วันที่ครบกำหนด: ${dueDate.toLocaleDateString("th-TH")}`,
    type: "email",
  }),
  medicationOverdue: (petName: string, medicationName: string, dueDate: Date): NotificationTemplate => ({
    subject: `แจ้งเตือนฉุกเฉิน: การให้ยา ${medicationName} แก่ ${petName} ล่าช้าแล้ว!`,
    message: `วันที่ครบกำหนด: ${dueDate.toLocaleDateString("th-TH")}`,
    type: "email",
  }),
};

// Main notification service
export class NotificationService {
  static async processAllNotifications(): Promise<void> {
    console.log("Processing notifications...");
    try {
      await this.processVaccinationNotifications();
      await this.processMedicationNotifications();
      console.log("All notifications processed successfully");
    } catch (error) {
      console.error("Error processing notifications:", error);
    }
  }

  static async processVaccinationNotifications(): Promise<void> {
    const db = getDb();
    if (!db) {
      console.warn("Database not available for vaccination notifications");
      return;
    }

    const usersWithSubs = await db
      .select({ user: users, subscription: subscriptions })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(eq(subscriptions.status, "active"));

    for (const { user } of usersWithSubs) {
      if (!user.email) continue;
      const pets = await dbFns.getUserPets(user.id);

      for (const pet of pets) {
        const petVaccinations = await db
          .select()
          .from(vaccinations)
          .where(and(eq(vaccinations.petId, pet.id), eq(vaccinations.reminderEnabled, 1)));

        for (const vaccination of petVaccinations) {
          if (!vaccination.nextDate) continue;
          const today = new Date();
          const dueDate = new Date(vaccination.nextDate);

          if (dueDate < today) {
            const template = NotificationTemplates.vaccinationOverdue(pet.name, vaccination.vaccineName, dueDate);
            await EmailService.send(user.email, template.subject, template.message);
          } else if (dueDate <= addDays(today, 7)) {
            const template = NotificationTemplates.vaccinationReminder(pet.name, vaccination.vaccineName, dueDate);
            await EmailService.send(user.email, template.subject, template.message);
          }
        }
      }
    }
  }

  static async processMedicationNotifications(): Promise<void> {
    const db = getDb();
    if (!db) {
      console.warn("Database not available for medication notifications");
      return;
    }

    const usersWithSubs = await db
      .select({ user: users, subscription: subscriptions })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(eq(subscriptions.status, "active"));

    for (const { user } of usersWithSubs) {
      if (!user.email) continue;
      const pets = await dbFns.getUserPets(user.id);

      for (const pet of pets) {
        const petMeds = await db
          .select()
          .from(medications)
          .where(and(eq(medications.petId, pet.id), eq(medications.reminderEnabled, 1)));

        for (const medication of petMeds) {
          if (!medication.nextDueDate) continue;
          const today = new Date();
          const dueDate = new Date(medication.nextDueDate);

          if (dueDate < today) {
            const template = NotificationTemplates.medicationOverdue(pet.name, medication.medicationName, dueDate);
            await EmailService.send(user.email, template.subject, template.message);
          } else if (dueDate <= addDays(today, 3)) {
            const template = NotificationTemplates.medicationReminder(pet.name, medication.medicationName, dueDate);
            await EmailService.send(user.email, template.subject, template.message);
          }
        }
      }
    }
  }

  static async sendCustomNotification(userId: number, template: NotificationTemplate): Promise<boolean> {
    const user = await dbFns.getUserById(userId);
    if (!user || !user.email) return false;

    if (template.type === "email") {
      return EmailService.send(user.email, template.subject, template.message);
    }
    return false;
  }
}

export async function runNotificationJob(): Promise<void> {
  console.log("Starting notification job...");
  await NotificationService.processAllNotifications();
  console.log("Notification job completed");
}
