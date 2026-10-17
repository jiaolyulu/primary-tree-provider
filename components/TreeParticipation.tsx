"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { TreeAnswer } from "@/lib/participation-validation";

type WallData = { title: string; open: boolean; answers: TreeAnswer[]; total: number };
const endpoint = (session: string) => `/api/participation/${encodeURIComponent(session)}`;
async function load(session: string, page = 0): Promise<WallData> {
  const response = await fetch(`${endpoint(session)}?page=${page}`, { cache: "no-store", signal: AbortSignal.timeout(12000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load responses.");
  return data;
}
function Brand() { return <Link className="tree-brand" href="/">✳ Primary Care Tree</Link>; }
export function TreeQuestionnaire({ session }: { session: string }) {
  const [info, setInfo] = useState<WallData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const submissionId = useRef("");
  useEffect(() => { load(session).then(setInfo).catch(error => setError(error.message)); }, [session]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const fields = new FormData(event.currentTarget);
    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    try {
      const response = await fetch(endpoint(session), {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ id: submissionId.current, tree: fields.get("tree"), city: fields.get("city"), place: "", story: fields.get("story"), name: fields.get("name"), consent: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDone(true);
    } catch (error) {
      setError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "Connection interrupted. Your text is still here; please try again.");
    } finally { setBusy(false); }
  }
  return <main className="tree-form-shell"><Brand /><p className="tree-eyebrow">{session === "rehearsal" ? "Rehearsal · " : ""}A collective city forest</p>
    {done ? <section className="tree-success" role="status"><span className="tree-symbol">✳</span><h1>Your tree is part of the forest.</h1><p>Thank you for sharing a little piece of your city.</p><Link className="tree-button" href={`/participate/${encodeURIComponent(session)}/wall`}>See the response wall ↗</Link><button className="tree-secondary" onClick={() => { submissionId.current = ""; setDone(false); }}>Add another tree</button></section>
    : <><h1>What tree do you recognize in your city?</h1><p className="tree-intro">A familiar corner. A little shade. A tree with a story.<br />Introduce us to one you know.</p>
    {info && !info.open ? <p role="status">This presentation is no longer accepting responses. <Link href={`/participate/${encodeURIComponent(session)}/wall`}>Explore the forest.</Link></p>
    : <form onSubmit={submit} className="tree-form">
      <label>What tree is it? <span>Required · “I don’t know its name” is welcome.</span><input name="tree" required maxLength={100} placeholder="An oak, a ginkgo, the big tree outside…" /></label>
      <label>What city is it in? <span>Required · Include a country or state if helpful.</span><input name="city" required maxLength={100} placeholder="Brooklyn, New York" autoComplete="address-level2" /></label>
      <label>What should we know about this tree? <span>Optional · How do you recognize it? What makes it memorable?</span><textarea name="story" maxLength={500} rows={4} placeholder="Every autumn, its leaves turn bright yellow…" /><span>Up to 500 characters.</span></label>
      <label>Your name or nickname <span>Optional · Leave blank to appear anonymously.</span><input name="name" maxLength={80} placeholder="Anonymous" autoComplete="nickname" /></label>
      <p className="tree-small">By submitting, you agree to display your response on the public presentation wall. Please leave out private contact details and home addresses.</p>
      <button className="tree-button" disabled={busy}>{busy ? "Planting your story…" : "Add my tree ↗"}</button><p className="tree-small">Your answer will appear immediately. No account needed.</p>
    </form>}
    {error && <p className="tree-error" role="alert">{error}</p>}</>}
  </main>;
}
export function TreeWall({ session }: { session: string }) {
  const [data, setData] = useState<WallData | null>(null);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [page, setPage] = useState(0);
  const [qr, setQr] = useState("");
  const [url, setUrl] = useState("");
  const [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => {
    const value = `${window.location.origin}/participate/${encodeURIComponent(session)}`;
    setUrl(value);
    QRCode.toDataURL(value, { width: 320, margin: 4, color: { dark: "#063d22", light: "#ffffff" } }).then(setQr).catch(() => setError("QR code unavailable. Use the link to join."));
  }, [session]);
  useEffect(() => {
    if (paused) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    async function refresh() {
      if (!document.hidden) {
        try { const result = await load(session, page); if (!stopped) { setData(result); setError(""); } failures = 0; }
        catch { failures++; if (!stopped) setError("Reconnecting… Saved responses will return when the connection is available."); }
      }
      if (!stopped) timer = setTimeout(refresh, Math.min(30000, 3000 * 2 ** failures));
    }
    refresh();
    return () => { stopped = true; clearTimeout(timer); };
  }, [session, paused, page]);
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setFullscreenError("Use your browser’s fullscreen option."); }
  }
  return <main className="tree-wall"><header className="tree-wall-header"><div><Brand /><p className="tree-eyebrow">A collective city forest</p><h1>{data?.title || "Trees we know"}</h1><p>Every tree has a place. Every place has a story.</p><div className="tree-tools"><span role="status">{paused ? "Updates paused" : error ? "Reconnecting" : data ? `${data.total} tree ${data.total === 1 ? "story" : "stories"} · Live` : "Connecting…"}</span><button onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button><button onClick={fullscreen}>Fullscreen</button></div>{fullscreenError && <p role="status">{fullscreenError}</p>}</div>
    <aside className="tree-join">{qr && <img src={qr} width={160} height={160} alt="QR code to share your tree" />}<div><strong>Know a tree?<br />Introduce us.</strong><p>Scan to add your story</p><a href={url}>{url.replace(/^https?:\/\//, "")}</a>{qr && <a className="tree-small" href={qr} download={`tree-${session}-qr.png`}>Download QR code ↓</a>}</div></aside></header>
    {error && <p className="tree-error" role="alert">{error}</p>}
    {data && !data.open && <p className="tree-notice">Submissions are closed. Our shared forest is still here to explore.</p>}
    {data && data.total === 0 ? <section className="tree-empty"><span className="tree-symbol">✳</span><h2>A forest starts with one tree.</h2><p>Scan the code and be the first to share.</p></section> : <section className="tree-grid" aria-label="Audience tree stories">{data?.answers.map(answer => <article className="tree-story" key={answer.id}><p className="tree-eyebrow">{answer.city}</p><h2>{answer.tree}</h2>{answer.place && <p className="tree-place">↳ {answer.place}</p>}<p className="tree-quote">{answer.story}</p><footer>Shared by {answer.name || "Anonymous"}</footer></article>)}</section>}
    {data && (page > 0 || data.total > 30) && <nav className="tree-pagination" aria-label="Response pages"><button disabled={page === 0} onClick={() => { setPage(page - 1); setPaused(false); }}>← Newer</button><span>Page {page + 1}</span><button disabled={(page + 1) * 30 >= data.total} onClick={() => { setPage(page + 1); setPaused(false); }}>Older →</button></nav>}
  </main>;
}
