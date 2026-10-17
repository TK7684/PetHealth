#!/usr/bin/env python3
"""PedPro dogfood fix batch — 2026-10-17. Assert-per-patch, fail loudly."""
import re, sys

ROOT = "/home/tk578/PetHealth"
ok = []

def patch(path, old, new, label, count=1):
    p = f"{ROOT}/{path}"
    s = open(p).read()
    if s.count(old) < count:
        print(f"FAIL [{label}] anchor not found in {path}")
        sys.exit(1)
    s = s.replace(old, new, count)
    open(p, "w").write(s)
    ok.append(label)
    print(f"OK   [{label}]")

# 1) main.tsx — global invalidation on any successful mutation
patch("client/src/main.tsx",
"""queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {""",
"""queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "success") {
    // Any successful mutation refreshes visible data (fixes stale lists after save/delete)
    queryClient.invalidateQueries();
  }
  if (event.type === "updated" && event.action.type === "error") {""",
"main: global mutation invalidation")

# 2) DashboardLayout — real auth gate
patch("client/src/components/DashboardLayout.tsx",
"const { user, logout } = useAuth();",
"const { user, logout } = useAuth({ redirectOnUnauthenticated: true });",
"layout: auth gate redirect")

# 3) PetProfile — age clamp + edit button opens Pets edit dialog via sessionStorage
patch("client/src/pages/PetProfile.tsx",
"""  const age = pet.birthDate
    ? Math.floor(
        (Date.now() - new Date(pet.birthDate).getTime()) /
          (1000 * 60 * 60 * 24 * 365)
      )
    : null;""",
"""  const age = pet.birthDate
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(pet.birthDate).getTime()) /
            (1000 * 60 * 60 * 24 * 365)
        )
      )
    : null;""",
"petprofile: age clamp >= 0")

patch("client/src/pages/PetProfile.tsx",
"""          <Link href={`/pets/${pet.id}/edit`}>
            <Button variant="outline">{t.common.edit}</Button>
          </Link>""",
"""          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.setItem("pethealth.editPetId", String(pet.id));
              window.location.href = "/pet-health/pets";
            }}
          >
            {t.common.edit}
          </Button>""",
"petprofile: edit button -> real edit dialog")

# 4) Pets.tsx — gender i18n on card + open edit dialog from sessionStorage
patch("client/src/pages/Pets.tsx",
"""<span className="font-medium capitalize">{pet.gender}</span>""",
"""<span className="font-medium">
                        {pet.gender === "male"
                          ? t.pets.male
                          : pet.gender === "female"
                            ? t.pets.female
                            : t.pets.unknown}
                      </span>""",
"pets: gender i18n on card")

patch("client/src/pages/Pets.tsx",
'import { useState } from "react";',
'import { useEffect, useState } from "react";',
"pets: useEffect import")

patch("client/src/pages/Pets.tsx",
"""  const handleDelete = (petId: number) => {""",
"""  // Open edit dialog when arriving from PetProfile "edit" button
  useEffect(() => {
    const id = sessionStorage.getItem("pethealth.editPetId");
    if (id && pets) {
      const target = pets.find((p: any) => p.id === Number(id));
      if (target) handleEdit(target);
      sessionStorage.removeItem("pethealth.editPetId");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets]);

  const handleDelete = (petId: number) => {""",
"pets: open edit dialog from profile handoff")

# 5) selector pages — auto-select single pet
SELECTOR_PAGES = ["WeightTracking", "HealthRecords", "Vaccinations",
                  "FeedingSchedule", "Expenses", "SickCare"]
for page in SELECTOR_PAGES:
    p = f"client/src/pages/{page}.tsx"
    s = open(f"{ROOT}/{p}").read()
    # ensure useEffect import from react
    m = re.search(r'import\s*\{([^}]*)\}\s*from\s*"react";', s)
    if m and "useEffect" not in m.group(1):
        s = s.replace(m.group(0), m.group(0).replace("{", "{ useEffect,", 1), 1)
    elif not m:
        print(f"FAIL [auto-select {page}] no react import")
        sys.exit(1)
    # insert effect after the pets query block
    anchor = "const { data: pets, isLoading: petsLoading } = useQuery({"
    i = s.find(anchor)
    if i == -1:
        print(f"FAIL [auto-select {page}] pets query anchor missing")
        sys.exit(1)
    j = s.find("  });", i)
    if j == -1:
        print(f"FAIL [auto-select {page}] query block end missing")
        sys.exit(1)
    insert_at = j + len("  });")
    effect = """

  // Auto-select when the account has exactly one pet
  useEffect(() => {
    if (!selectedPetId && pets && pets.length === 1) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);"""
    s = s[:insert_at] + effect + s[insert_at:]
    open(f"{ROOT}/{p}", "w").write(s)
    ok.append(f"auto-select {page}")
    print(f"OK   [auto-select {page}]")

# 6) AiHealthPanel — Thai error message + keep chat history (message already kept)
patch("client/src/components/AiHealthPanel.tsx",
"""  const sendChat = trpc.intelligence.chat.useMutation({
    onSuccess: (data) => {
      setChatHistory(h => [...h, { role: "ai", text: data.reply }]);
      if (data.emergency) {
        toast.error(th ? "ภาวะฉุกเฉิน — ไปโรงพยาบาลสัตวแพทย์ทันที" : "EMERGENCY — go to vet now");
      }
    },
    onError: (e) => toast.error(e.message),
  });""",
"""  const sendChat = trpc.intelligence.chat.useMutation({
    onSuccess: (data) => {
      setChatHistory(h => [...h, { role: "ai", text: data.reply }]);
      if (data.emergency) {
        toast.error(th ? "ภาวะฉุกเฉิน — ไปโรงพยาบาลสัตวแพทย์ทันที" : "EMERGENCY — go to vet now");
      }
    },
    onError: () => {
      // Never leak provider internals to pet owners; keep the user's message visible
      toast.error(th
        ? "AI ยังไม่พร้อมใช้งานขณะนี้ ลองใหม่ภายหลัง หรือปรึกษาสัตวแพทย์"
        : "AI is unavailable right now — please try again later or contact your vet");
    },
  });""",
"ai-panel: friendly chat error")

# 7) HealthRecords — honest empty copy when no pets exist
patch("client/src/pages/HealthRecords.tsx",
"""{lang === "th" ? "กรุณาเลือกสัตว์เลี้ยงจากเมนูด้านบนเพื่อดูบันทึกสุขภาพ" : "Please select a pet from the menu above to view health records"}""",
"""{pets && pets.length === 0
              ? (lang === "th"
                ? "ยังไม่มีสัตว์เลี้ยง — เพิ่มสัตว์เลี้ยงก่อนเริ่มบันทึกสุขภาพ"
                : "No pets yet — add a pet first to start health records")
              : (lang === "th"
                ? "กรุณาเลือกสัตว์เลี้ยงจากเมนูด้านบนเพื่อดูบันทึกสุขภาพ"
                : "Please select a pet from the menu above to view health records")}""",
"health-records: no-pets copy")

# 8) server routers.ts — reject future birth dates (pets create + update)
s = open(f"{ROOT}/server/routers.ts").read()
n8 = 0

# 8a: wrap pets.update schema (unique combo: petId + optional name + birthDate + gender)
old_upd_start = """      .input(
        z.object({
          petId: z.number(),
          name: z.string().min(1).optional(),
          breed: z.string().optional(),
          birthDate: z.string().optional(),
          photoUrl: z.string().optional(),
          gender: z.enum(["male", "female", "unknown"]).optional(),
        })
      )"""
new_upd_start = """      .input(
        z
          .object({
            petId: z.number(),
            name: z.string().min(1).optional(),
            breed: z.string().optional(),
            birthDate: z.string().optional(),
            photoUrl: z.string().optional(),
            gender: z.enum(["male", "female", "unknown"]).optional(),
          })
          .refine((v) => !v.birthDate || new Date(v.birthDate) <= new Date(), {
            message: "birthDate cannot be in the future",
            path: ["birthDate"],
          })
      )"""
if old_upd_start in s:
    s = s.replace(old_upd_start, new_upd_start, 1)
    n8 += 1
    print("OK   [routers: pets.update birthDate refine]")
else:
    print("WARN [routers: pets.update anchor not found — inspect]")

# 8b: pets.create refine (unique: tier-limits comment right after the input block)
old_create = """          gender: z.enum(["male", "female", "unknown"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check tier limits"""
new_create = """          gender: z.enum(["male", "female", "unknown"]).optional(),
        })
        .refine((v) => !v.birthDate || new Date(v.birthDate) <= new Date(), {
          message: "birthDate cannot be in the future",
          path: ["birthDate"],
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check tier limits"""
if old_create in s:
    s = s.replace(old_create, new_create, 1)
    n8 += 1
    print("OK   [routers: pets.create birthDate refine]")
else:
    print("WARN [routers: pets.create anchor not found — inspect]")

open(f"{ROOT}/server/routers.ts", "w").write(s)
ok.append(f"routers birthDate refine ({n8}/2)")

print("\nDONE:", len(ok), "patch groups applied")
