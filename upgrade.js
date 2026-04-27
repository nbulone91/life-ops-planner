(function installLifeOpsUpgrade() {
  if (globalThis.lifeOpsUpgradeApplied || typeof state === "undefined") return;
  globalThis.lifeOpsUpgradeApplied = true;

  const API_KEY_STORAGE_KEY = "life-ops-openai-api-key-v1";
  const API_URL_STORAGE_KEY = "life-ops-api-url-v1";
  const SYNC_CODE_STORAGE_KEY = "life-ops-sync-code-v1";
  const SYNC_ID_STORAGE_KEY = "life-ops-sync-id-v1";
  const SYNC_HASH_STORAGE_KEY = "life-ops-last-sync-hash-v1";
  const SYNC_TIME_STORAGE_KEY = "life-ops-last-sync-time-v1";

  state.aiModel = state.aiModel || "gpt-5";
  state.writerBusy = false;
  state.syncBusy = false;
  state.currentDraft = state.currentDraft || "";

  const baseBindEvents = bindEvents;

  renderTopbar = function renderUpgradedTopbar() {
    const syncEnabled = Boolean(getSyncConfig());
    return `
      <header class="topbar">
        <label class="search" aria-label="Search">
          ${icons.search}
          <input id="globalSearch" type="search" placeholder="Search recipes, budget notes, or drafts" />
        </label>
        <button class="date-pill" data-view="meals">${icons.meals}<span>Apr 27 - May 3</span></button>
        <button class="status-pill ${syncEnabled ? "sync-on" : ""}" title="${syncEnabled ? "Synced with your backend" : "Saved in this browser"}">${icons.check}<span>${state.syncBusy ? "Syncing" : syncEnabled ? "Synced" : "Saved"}</span></button>
        <button class="ghost-button topbar-action" id="syncNow">${syncEnabled ? "Sync" : "Connect sync"}</button>
        <button class="ghost-button topbar-action" id="exportData">Export</button>
        <button class="ghost-button topbar-action" id="importData">Import</button>
        <input id="importFile" type="file" accept="application/json" hidden />
        <button class="profile-pill" data-view="writer"><span class="profile-dot">N</span><span>Draft mode</span></button>
      </header>
    `;
  };

  renderWriterPanel = function renderUpgradedWriterPanel() {
    const prompt = "Write a short weekly update that mentions the grocery list, the meal plan, and the current budget position.";
    const hasAI = Boolean(getAPIUrl() || getOpenAIKey());
    return `
      <section class="panel">
        <div class="panel-header">
          <div>
            <span class="section-label">Writer</span>
            <h2>${hasAI ? "AI draft assistant" : "Draft assistant"}</h2>
          </div>
          <div class="chips" aria-label="Tone">
            ${["Warm", "Brief", "Polished"].map((tone) => `<button class="chip ${state.writerTone === tone ? "active" : ""}" data-tone="${tone}">${tone}</button>`).join("")}
          </div>
        </div>
        <div class="composer">
          <textarea id="writerPrompt">${prompt}</textarea>
          <div class="composer-toolbar">
            <button class="primary-button" id="generateDraft" ${state.writerBusy ? "disabled" : ""}>${icons.spark}<span>${state.writerBusy ? "Writing..." : hasAI ? "Generate with AI" : "Generate draft"}</span></button>
            <button class="ghost-button" id="setApiKey">${icons.writer}<span>${getAPIUrl() ? "Server AI" : getOpenAIKey() ? "AI key set" : "Add AI key"}</span></button>
            <button class="ghost-button" id="copyDraft">${icons.copy}<span>${state.draftCopied ? "Copied" : "Copy"}</span></button>
          </div>
          <div class="draft-output" id="draftOutput">${state.currentDraft || buildDraft()}</div>
        </div>
      </section>
    `;
  };

  bindEvents = function bindUpgradedEvents() {
    baseBindEvents();

    replaceClick("#generateDraft", async () => {
      const prompt = document.querySelector("#writerPrompt")?.value || "";
      if (getAPIUrl() || getOpenAIKey()) {
        await generateAIDraft(prompt);
      } else {
        state.currentDraft = buildDraft(prompt);
        const output = document.querySelector("#draftOutput");
        if (output) output.textContent = state.currentDraft;
        state.draftCopied = false;
        showToast("Draft refreshed with local plan context");
      }
    });

    replaceClick("#copyDraft", async () => {
      const output = document.querySelector("#draftOutput")?.textContent || "";
      try {
        await navigator.clipboard.writeText(output);
        state.draftCopied = true;
        showToast("Draft copied");
      } catch {
        showToast("Copy is unavailable in this browser");
      }
      render();
    });

    document.querySelector("#setApiKey")?.addEventListener("click", setOpenAIKey);
    document.querySelector("#exportData")?.addEventListener("click", exportPlannerData);
    document.querySelector("#syncNow")?.addEventListener("click", () => (getSyncConfig() ? syncNow("manual") : configureSync()));
    const importFile = document.querySelector("#importFile");
    document.querySelector("#importData")?.addEventListener("click", () => importFile?.click());
    importFile?.addEventListener("change", () => importPlannerData(importFile.files?.[0]));
  };

  function replaceClick(selector, handler) {
    const button = document.querySelector(selector);
    if (!button) return;
    const fresh = button.cloneNode(true);
    button.replaceWith(fresh);
    fresh.addEventListener("click", handler);
  }

  function getAPIUrl() {
    return normalizeApiUrl(localStorage.getItem(API_URL_STORAGE_KEY) || "");
  }

  function normalizeApiUrl(value) {
    return value.trim().replace(/\/+$/, "");
  }

  function getSyncConfig() {
    const apiUrl = getAPIUrl();
    const syncId = localStorage.getItem(SYNC_ID_STORAGE_KEY) || "";
    if (!apiUrl || !syncId) return null;
    return { apiUrl, syncId };
  }

  async function configureSync() {
    const apiUrl = normalizeApiUrl(
      prompt("Paste your Life Ops backend URL.", getAPIUrl() || "https://life-ops-planner-api.YOUR-SUBDOMAIN.workers.dev") || "",
    );
    if (!apiUrl || apiUrl.includes("YOUR-SUBDOMAIN")) {
      showToast("Sync needs a deployed backend URL first");
      return;
    }

    let syncCode = (prompt("Enter your sync code. Leave blank to create a new one.", localStorage.getItem(SYNC_CODE_STORAGE_KEY) || "") || "").trim();
    if (!syncCode) {
      syncCode = `life-${crypto.randomUUID().slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;
      alert(`Your sync code is:\n\n${syncCode}\n\nEnter this same code on your phone and computer.`);
    }

    localStorage.setItem(API_URL_STORAGE_KEY, apiUrl);
    localStorage.setItem(SYNC_CODE_STORAGE_KEY, syncCode);
    localStorage.setItem(SYNC_ID_STORAGE_KEY, await sha256Hex(syncCode.toLowerCase()));
    showToast("Sync connected");
    await syncNow("manual");
  }

  async function syncNow(mode = "auto") {
    const config = getSyncConfig();
    if (!config || state.syncBusy) return;

    state.syncBusy = true;
    render();

    try {
      const localState = exportableState();
      const localHash = await hashState(localState);
      const lastHash = localStorage.getItem(SYNC_HASH_STORAGE_KEY) || "";
      const remoteResponse = await fetch(`${config.apiUrl}/api/state?syncId=${config.syncId}`, { cache: "no-store" });
      if (!remoteResponse.ok) throw new Error(await responseMessage(remoteResponse));
      const remote = await remoteResponse.json();

      if (remote.state) {
        const remoteHash = await hashState(remote.state);
        if (localHash === lastHash && remoteHash !== lastHash) {
          Object.assign(state, remote.state, { writerBusy: false, syncBusy: false, draftCopied: false });
          localStorage.setItem(SYNC_HASH_STORAGE_KEY, remoteHash);
          localStorage.setItem(SYNC_TIME_STORAGE_KEY, remote.updatedAt || new Date().toISOString());
          persistState();
          if (mode === "manual") showToast("Pulled latest planner data");
          render();
          return;
        }

        if (localHash === remoteHash) {
          localStorage.setItem(SYNC_HASH_STORAGE_KEY, localHash);
          localStorage.setItem(SYNC_TIME_STORAGE_KEY, remote.updatedAt || new Date().toISOString());
          if (mode === "manual") showToast("Planner is up to date");
          return;
        }
      }

      const pushResponse = await fetch(`${config.apiUrl}/api/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncId: config.syncId, state: localState }),
      });
      if (!pushResponse.ok) throw new Error(await responseMessage(pushResponse));
      const pushed = await pushResponse.json();
      localStorage.setItem(SYNC_HASH_STORAGE_KEY, localHash);
      localStorage.setItem(SYNC_TIME_STORAGE_KEY, pushed.updatedAt || new Date().toISOString());
      if (mode === "manual") showToast("Planner synced");
    } catch (error) {
      if (mode === "manual") showToast(`Sync issue: ${error.message}`);
    } finally {
      state.syncBusy = false;
      render();
    }
  }

  function exportableState() {
    const clone = JSON.parse(JSON.stringify(state));
    clone.writerBusy = false;
    clone.syncBusy = false;
    clone.draftCopied = false;
    return clone;
  }

  async function hashState(value) {
    return sha256Hex(JSON.stringify(value));
  }

  async function sha256Hex(value) {
    const data = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function responseMessage(response) {
    try {
      const data = await response.json();
      return data.error || response.statusText;
    } catch {
      return response.statusText;
    }
  }

  function getOpenAIKey() {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  }

  function setOpenAIKey() {
    if (getAPIUrl()) {
      alert("Server AI is configured through the backend. No browser key is needed on this device.");
      return;
    }

    const current = getOpenAIKey();
    const next = prompt("Paste your OpenAI API key for this device. Leave blank to remove it.", current ? "sk-..." : "");
    if (next === null) return;
    const clean = next.trim();
    if (!clean || clean === "sk-...") {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      showToast("AI key removed from this device");
    } else {
      localStorage.setItem(API_KEY_STORAGE_KEY, clean);
      showToast("AI key saved on this device");
    }
    render();
  }

  function buildAIInput(customPrompt) {
    const selected = selectedBudget();
    const remaining = selected.income - selected.spend;
    const recipe = recipeById(state.activeMealId);
    const openGroceries = state.groceries.filter((item) => !item.done).map((item) => `${item.name} (${item.qty})`);
    const categorySummary = state.categories.map((category) => `${category.name}: ${money(category.spent)} of ${money(category.limit)}`).join("; ");

    return [
      `Tone: ${state.writerTone}`,
      `User request: ${customPrompt.trim() || "Write a useful weekly update."}`,
      `Selected recipe: ${recipe.name} (${money(recipe.cost)}, ${recipe.time} minutes).`,
      `Budget: ${state.selectedMonth} income ${money(selected.income)}, spending ${money(selected.spend)}, remaining ${money(remaining)}.`,
      `Categories: ${categorySummary}.`,
      `Open groceries: ${openGroceries.join(", ") || "none"}.`,
      "Write a concise, practical draft for a household planning update. Do not mention that you are an AI.",
    ].join("\n");
  }

  async function generateAIDraft(promptText) {
    state.writerBusy = true;
    render();

    try {
      const apiUrl = getAPIUrl();
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/api/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: buildAIInput(promptText), state: exportableState() }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "AI request failed");
        state.currentDraft = data.text || buildDraft(promptText);
      } else {
        const apiKey = getOpenAIKey();
        if (!apiKey) {
          setOpenAIKey();
          return;
        }
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: state.aiModel || "gpt-5",
            instructions: "You are the writing assistant inside Life Ops Planner. Be concise, concrete, and helpful.",
            input: buildAIInput(promptText),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "OpenAI request failed");
        state.currentDraft = extractResponseText(data) || buildDraft(promptText);
      }

      state.draftCopied = false;
      showToast("AI draft ready");
    } catch (error) {
      state.currentDraft = `${buildDraft(promptText)}\n\nAI request issue: ${error.message}`;
      showToast("AI request could not complete");
    } finally {
      state.writerBusy = false;
      render();
    }
  }

  function extractResponseText(data) {
    if (data.output_text) return data.output_text;
    return (data.output || [])
      .flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  function exportPlannerData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "Life Ops Planner",
      version: 1,
      state: exportableState(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `life-ops-planner-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Planner backup exported");
  }

  function importPlannerData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const incoming = payload.state || payload;
        Object.assign(state, incoming, { writerBusy: false, syncBusy: false, draftCopied: false });
        persistState();
        showToast("Planner backup imported");
        render();
      } catch {
        showToast("That backup file could not be read");
      }
    };
    reader.readAsText(file);
  }

  window.addEventListener("online", () => syncNow("auto"));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncNow("auto");
  });
  setInterval(() => syncNow("auto"), 30000);

  render();
})();
