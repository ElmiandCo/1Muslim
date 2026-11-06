"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../../../utils/supabase/client";
import styles from "./apply.module.css";

type Role = "writer" | "editor";
const allowed = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const maxBytes = 10 * 1024 * 1024;

export default function EditorialApplication() {
  const [role, setRole] = useState<Role>("writer");
  const [experience, setExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !resume) return;
    const extension = resume.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx"].includes(extension) || !allowed.has(resume.type) || resume.size > maxBytes || resume.size === 0) {
      setMessage("Upload a PDF, DOC, or DOCX résumé no larger than 10 MB."); return;
    }
    setBusy(true); setMessage("");
    let uploadedPath: string | null = null;
    try {
      const db = createClient();
      const { data: auth, error: authError } = await db.auth.getUser();
      if (authError || !auth.user) throw new Error("Sign in to apply to the editorial team.");
      const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await db.storage.from("qibla-resumes").upload(path, resume, { contentType: resume.type, upsert: false });
      if (uploadError) throw uploadError;
      uploadedPath = path;
      const { error: applicationError } = await db.rpc("qibla_apply_to_editorial", {
        p_desired_role: role,
        p_experience: experience.trim(),
        p_motivation: motivation.trim(),
        p_portfolio_url: portfolio.trim(),
        p_resume_path: path
      });
      if (applicationError) throw applicationError;
      uploadedPath = null;
      setDone(true);
      setResume(null);
      setMessage("Application received. The editorial team can review it privately.");
    } catch (error) {
      // A failed application must not leave an unattached private résumé in storage.
      // Removal is best-effort: storage RLS may restrict deletes, so the server should
      // also periodically clean up orphaned applicant-owned uploads.
      if (uploadedPath) {
        try { await createClient().storage.from("qibla-resumes").remove([uploadedPath]); }
        catch { /* Preserve the original submission error. */ }
      }
      setMessage(error instanceof Error ? error.message : "Application failed. Please try again.");
    } finally { setBusy(false); }
  };

  return <main className={styles.root}>
    <div className={styles.shell}>
      <nav className={styles.nav}><Link href="/qibla/newsroom">← 1Qibla Magazine</Link><Link href="/">1Muslim Home</Link></nav>
      <header><p className={styles.kicker}>JOIN THE EDITORIAL TEAM</p><h1>Help tell the Ummah’s stories.</h1><p>Apply to write or edit stories for 1Qibla. Approver access is assigned separately. Your résumé stays private to you and authorized Approvers.</p></header>
      {message && <p role={done ? "status" : "alert"} className={styles.notice}>{message}</p>}
      {!done && <form onSubmit={e => void submit(e)} className={styles.form}>
        <label>Editorial role<select value={role} onChange={e => setRole(e.target.value as Role)} disabled={busy}><option value="writer">Writer</option><option value="editor">Editor</option></select></label>
        <label>Relevant experience<textarea required maxLength={10000} rows={4} value={experience} onChange={e => setExperience(e.target.value)} disabled={busy}/></label>
        <label>Why would you like to join?<textarea required maxLength={10000} rows={4} value={motivation} onChange={e => setMotivation(e.target.value)} disabled={busy}/></label>
        <label>Portfolio URL (optional)<input type="url" maxLength={2000} value={portfolio} onChange={e => setPortfolio(e.target.value)} disabled={busy} placeholder="https://"/></label>
        <label>Résumé (PDF, DOC or DOCX; max 10 MB)<input required type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setResume(e.target.files?.[0] ?? null)} disabled={busy}/></label>
        <p className={styles.note}>Submitting an application does not grant editorial permissions. Approval and role assignment are separate.</p>
        <button disabled={busy || !resume} type="submit">{busy ? "Submitting…" : "Submit application"}</button>
      </form>}
    </div>
  </main>;
}
