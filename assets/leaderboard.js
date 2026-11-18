// leaderboard.js — the live class leaderboard. Scores come from Lab 3 of the notebook.
// On gradlabs.in the API is on the same site, and a signed-in presenter also gets the controls.

(function () {
  const BOARD = "deep-learning";
  const SAME_SITE = /(^|\.)gradlabs\.in$/.test(location.hostname);
  const API = (SAME_SITE ? "" : "https://gradlabs.in") + "/api/leaderboard/" + BOARD;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MEDALS = ["🥇", "🥈", "🥉"];
  const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let last = {};          // team → "best|tries", to flash rows that changed
  let presenter = false;
  let code = null;

  async function control(action) {
    const res = await fetch(API + "/control", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    let data = null; try { data = await res.json(); } catch (e) {}
    if (!res.ok || !data) throw new Error((data && data.error) || "Not allowed.");
    return data;
  }

  function showCode() {
    $("codeBox").hidden = !code;
    $("code").textContent = code || "";
  }

  async function refresh() {
    let data;
    try {
      const res = await fetch(API, { cache: "no-store" });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load");
    } catch (e) {
      $("status").textContent = "Can't reach the leaderboard. Trying again…";
      $("status").className = "lb-status bad";
      return;
    }
    $("status").textContent = data.open ? "Open: send your scores" : "Closed";
    $("status").className = "lb-status " + (data.open ? "good" : "");
    if (!data.open) { code = null; showCode(); }

    const teams = data.teams || [];
    $("empty").hidden = teams.length > 0;
    $("bestTeam").textContent = teams.length ? `${teams[0].team} · ${teams[0].best.toFixed(1)}%` : "—";
    const jump = teams.find(t => t.team === data.biggestJump);
    $("jumpTeam").textContent = jump ? `${jump.team} · +${jump.jump.toFixed(1)}` : "—";

    const now = {};
    $("rows").innerHTML = teams.map((t, i) => {
      now[t.team] = t.best + "|" + t.tries;
      const changed = last[t.team] !== undefined && last[t.team] !== now[t.team];
      return `<tr class="${changed && !still ? "flash" : ""}${i < 3 ? " top" : ""}">
        <td class="rank">${MEDALS[i] || i + 1}</td>
        <td class="team">${esc(t.team)}</td>
        <td class="best">${t.best.toFixed(1)}%</td>
        <td class="jump">${t.jump > 0 ? "+" + t.jump.toFixed(1) : "–"}${t.team === data.biggestJump ? " 🚀" : ""}</td>
        <td class="tries">${t.tries}</td>
        <td class="lb-changed">${esc(t.changed || "")}</td></tr>`;
    }).join("");
    last = now;
  }

  // Presenter controls: only shown to a signed-in admin on gradlabs.in.
  async function setupPresenter() {
    if (!SAME_SITE) return;
    try {
      const s = await control("status");
      presenter = true; code = s.code; showCode();
      $("presenter").hidden = false;
    } catch (e) { /* a student, or signed out: no controls */ }
  }

  function note(text, bad) { $("note").textContent = text; $("note").className = "lb-note" + (bad ? " bad" : ""); }

  $("openBtn").onclick = async () => {
    try { code = (await control("open")).code; showCode(); note("Open. Students type the code on screen."); refresh(); }
    catch (e) { note(e.message, true); }
  };
  $("closeBtn").onclick = async () => {
    try { await control("close"); code = null; showCode(); note("Closed. The scores stay on the board."); refresh(); }
    catch (e) { note(e.message, true); }
  };
  // Clearing can't be undone, so it takes a second press.
  let armed = null;
  $("clearBtn").onclick = async () => {
    if (!armed) {
      $("clearBtn").textContent = "Press again to clear every score";
      $("clearBtn").classList.add("danger");
      armed = setTimeout(() => { armed = null; $("clearBtn").textContent = "Clear the board"; $("clearBtn").classList.remove("danger"); }, 4000);
      return;
    }
    clearTimeout(armed); armed = null;
    $("clearBtn").textContent = "Clear the board"; $("clearBtn").classList.remove("danger");
    try { await control("reset"); last = {}; note("Cleared."); refresh(); }
    catch (e) { note(e.message, true); }
  };

  setupPresenter();
  refresh();
  setInterval(refresh, 3000);
})();
